<#
  playout/osc-fast.ps1  --  turn the POC's channels into REAL linear channels
                            on Eyevinn Open Source Cloud (channel-engine / VOD2Live)

  This is Layer 1 of the roadmap (see ../README.md): production playout.
  It reads the SAME channel list the front end uses ( ../data/channels.json ),
  creates one Channel Engine instance per channel, waits for them to go
  healthy, and writes the playback URLs to playout/playout.json so you can
  paste them back into data/channels.json.
    - channel with a `playout` block  -> uses it ( type "Playlist" + url of a .txt playlist )
    - channel without one             -> type "Loop" on its `src` (original POC behaviour)
    - channel with `live: true`       -> skipped (already a live feed)
  Top-level `playoutDefaults` (slate, preroll ident) apply unless a channel overrides them.

  No Node, no CLI, no SDK -- just PowerShell + the OSC REST API:
    1. POST catalog.svc.../mysubscriptions      activate 'channel-engine'
    2. POST token.svc.../servicetoken           PAT  ->  short-lived service token
    3. GET  catalog.svc.../mysubscriptions      find the channel-engine apiUrl
    4. POST {apiUrl}                            launch each channel
    5. GET  {apiUrl}/../health/{name}           poll health
    6. DELETE {apiUrl}/{name}                   teardown

  Usage (from the repo root or the playout/ folder):
    $env:OSC_ACCESS_TOKEN = "eyJ..."                     # OR put it in playout/.env
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 token       # auth check
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 check       # all sources reachable (no OSC cost)
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision   # create all channels
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision -Only movieafrica,ppg   # a batch
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 status      # health + URLs
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 teardown    # delete every asiko* channel
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision -Recreate
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('provision', 'check', 'status', 'list', 'teardown', 'token')]
  [string]$Command = 'status',

  [string]$ConfigPath,       # defaults to ../data/channels.json
  [string]$NamePrefix = 'asiko',
  [string[]]$Only,           # channel ids, e.g. -Only movieafrica,ppg
  [switch]$Recreate,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
# `powershell -File` passes "-Only a,b" as one string, so split it ourselves.
if ($Only) { $Only = @($Only | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$PlayoutDir = $PSScriptRoot
$RepoRoot   = Split-Path -Parent $PlayoutDir
if (-not $ConfigPath) { $ConfigPath = Join-Path $RepoRoot 'data/channels.json' }
$PlatformBase = 'https://catalog.svc.prod.osaas.io'
$TokenUrl     = 'https://token.svc.prod.osaas.io/servicetoken'
$OutFile      = Join-Path $PlayoutDir 'playout.json'

# ---------------------------------------------------------------- helpers ----

function Get-OscToken {
  if ($env:OSC_ACCESS_TOKEN -and $env:OSC_ACCESS_TOKEN.Trim()) { return $env:OSC_ACCESS_TOKEN.Trim() }
  foreach ($p in @((Join-Path $PlayoutDir '.env'), (Join-Path $RepoRoot '.env'))) {
    if (Test-Path $p) {
      foreach ($line in Get-Content $p) {
        if ($line -match '^\s*OSC_ACCESS_TOKEN\s*=\s*(.+?)\s*$') { return ($Matches[1].Trim().Trim('"').Trim("'")) }
      }
    }
  }
  throw "No Personal Access Token. Set `$env:OSC_ACCESS_TOKEN or create playout/.env from playout/.env.example. Get it at https://app.osaas.io -> Settings -> API."
}

function Invoke-Osc {
  param([Parameter(Mandatory)][string]$Method, [Parameter(Mandatory)][string]$Uri, [hashtable]$Headers, $Body)
  $req = @{ Method = $Method; Uri = $Uri; Headers = $Headers; ContentType = 'application/json' }
  if ($null -ne $Body) { $req.Body = ($Body | ConvertTo-Json -Depth 12 -Compress) }
  try { return Invoke-RestMethod @req }
  catch {
    $detail = ''
    $resp = $_.Exception.Response
    if ($resp) { try { $detail = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {} }
    throw ("OSC API {0} {1} failed: {2}`n{3}" -f $Method, $Uri, $_.Exception.Message, $detail)
  }
}

function Connect-Osc {
  $pat = Get-OscToken
  $patHeaders = @{ 'x-pat-jwt' = "Bearer $pat" }
  Write-Host "-> activating 'channel-engine' subscription ..." -ForegroundColor DarkGray
  try { Invoke-Osc -Method POST -Uri "$PlatformBase/mysubscriptions" -Headers $patHeaders -Body @{ services = @('channel-engine') } | Out-Null }
  catch { Write-Host "   (subscription call: $($_.Exception.Message.Split("`n")[0]))" -ForegroundColor DarkGray }

  $subs = Invoke-Osc -Method GET -Uri "$PlatformBase/mysubscriptions" -Headers $patHeaders
  $svc  = $subs | Where-Object { $_.serviceId -eq 'channel-engine' } | Select-Object -First 1
  if (-not $svc) { throw "channel-engine not in your subscriptions after activation." }

  $sat = Invoke-Osc -Method POST -Uri $TokenUrl -Headers $patHeaders -Body @{ serviceId = 'channel-engine' }
  [pscustomobject]@{
    SvcHeaders = @{ 'x-jwt' = "Bearer $($sat.token)" }
    ApiUrl     = $svc.apiUrl.TrimEnd('/')
    ApiHost    = ([Uri]$svc.apiUrl).Host
    Expiry     = $sat.expiry
  }
}

function Load-Plan {
  if (-not (Test-Path $ConfigPath)) { throw "Channel list not found: $ConfigPath" }
  $cfg = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $def = $cfg.playoutDefaults
  $plan = @($cfg.channels | Where-Object { -not $_.live -and -not ($_.playout -and $_.playout.skip) } |
    Where-Object { -not $Only -or $Only -contains $_.id } | ForEach-Object {
    $p    = $_.playout
    $type = if ($p -and $p.type) { $p.type } else { 'Loop' }
    $url  = if ($p -and $p.url)  { $p.url }  else { $_.src }
    if (@('Loop', 'Playlist', 'WebHook') -notcontains $type) { throw "$($_.id): unknown playout.type '$type'" }
    if ($url -notmatch '^https?://') { throw "$($_.id): playout needs an http(s) url" }

    # OSC instance name: lowercase a-z0-9, max 20 chars
    $name = "{0}{1}" -f $NamePrefix, ($_.id.ToLower() -replace '[^a-z0-9]', '')
    if ($name.Length -gt 20) { throw "instance name '$name' is over 20 chars - shorten the channel id" }

    $opts = @{ useDemuxedAudio = $false; useVttSubtitles = $false }
    $slate = if ($p -and $p.slate) { $p.slate } elseif ($def) { $def.slate } else { $null }
    $hasOwnPreroll = $p -and ($p.PSObject.Properties.Name -contains 'preroll')
    $pre = if ($hasOwnPreroll) { $p.preroll } elseif ($def) { $def.preroll } else { $null }
    if ($slate) { $opts.defaultSlateUri = $slate }
    if ($pre -and $pre.url) { $opts.preroll = @{ url = $pre.url; duration = [string]$pre.durationMs } }

    [pscustomobject]@{ id = $_.id; name = $name; label = $_.name; genre = $_.genre; type = $type; url = $url; opts = $opts }
  })
  if ($Only) {
    $missing = @($Only | Where-Object { $plan.id -notcontains $_ })
    if ($missing) { throw "-Only: not found (or live/skipped): $($missing -join ', ')" }
  }
  $dupes = @($plan | Group-Object name | Where-Object Count -gt 1)
  if ($dupes) { throw "two channels map to the same instance name: $($dupes.Name -join ', ')" }
  $plan
}

function Test-Source { param([string]$Url)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -Method GET
    # a .txt served as application/octet-stream comes back as bytes, not a string
    $body = if ($r.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($r.Content) } else { [string]$r.Content }
    [pscustomobject]@{ ok = $true; status = [int]$r.StatusCode; body = $body }
  } catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { $_.Exception.Message }
    [pscustomobject]@{ ok = $false; status = $code; body = '' }
  }
}

function Get-Channels { param($Ctx)
  $r = Invoke-Osc -Method GET -Uri $Ctx.ApiUrl -Headers $Ctx.SvcHeaders
  if ($null -eq $r) { @() } else { @($r) }
}

function Get-Health { param($Ctx, $Ch)
  $u = if ($Ch._links.health.href) { "https://$($Ctx.ApiHost)$($Ch._links.health.href)" }
       else { ($Ctx.ApiUrl -replace '/channel$', '') + "/health/$($Ch.name)" }
  try { $h = Invoke-Osc -Method GET -Uri $u -Headers $Ctx.SvcHeaders; [pscustomobject]@{ health = $h.health; status = $h.status } }
  catch { [pscustomobject]@{ health = 'unknown'; status = 'unknown' } }
}

# --------------------------------------------------------------- commands ----

function Do-Provision {
  $plan = Load-Plan
  $ctx  = Connect-Osc
  Write-Host ("{0} channel(s) planned, ~{1} OSC tokens/day while running." -f $plan.Count, ($plan.Count * 10)) -ForegroundColor Cyan
  Write-Host "channel-engine API: $($ctx.ApiUrl)" -ForegroundColor Cyan
  $have = @{}; foreach ($c in (Get-Channels $ctx)) { $have[$c.name] = $c }

  foreach ($p in $plan) {
    Write-Host ""; Write-Host "=== $($p.label)  [$($p.name)]" -ForegroundColor White
    if ($have.ContainsKey($p.name)) {
      if ($Recreate) {
        Write-Host "   exists -> delete for recreate" -ForegroundColor Yellow
        Invoke-Osc -Method DELETE -Uri "$($ctx.ApiUrl)/$($p.name)" -Headers $ctx.SvcHeaders | Out-Null
        Start-Sleep 2
      } else { Write-Host "   already running - skip (use -Recreate)" -ForegroundColor DarkGray; continue }
    }
    Write-Host "   launching $($p.type) <- $($p.url)" -ForegroundColor DarkGray
    $inst = Invoke-Osc -Method POST -Uri $ctx.ApiUrl -Headers $ctx.SvcHeaders -Body @{ name = $p.name; type = $p.type; url = $p.url; opts = $p.opts }
    $pb = if ($inst.playback) { $inst.playback } else { $inst.url }
    Write-Host "   ok -> $pb" -ForegroundColor Green
  }

  Write-Host ""; Write-Host "Waiting up to 180s for healthy ..." -ForegroundColor Cyan
  $deadline = (Get-Date).AddSeconds(180)
  do {
    Start-Sleep 6
    $live = Get-Channels $ctx
    $running = @($live | Where-Object { $plan.name -contains $_.name } | ForEach-Object { (Get-Health $ctx $_).status } | Where-Object { $_ -eq 'running' }).Count
    Write-Host "   $running/$($plan.Count) running" -ForegroundColor DarkGray
  } while ($running -lt $plan.Count -and (Get-Date) -lt $deadline)

  Do-Status
}

function Do-Status {
  $plan = Load-Plan
  $ctx  = Connect-Osc
  $live = Get-Channels $ctx
  $rows = foreach ($p in $plan) {
    $l = $live | Where-Object { $_.name -eq $p.name } | Select-Object -First 1
    $h = if ($l) { Get-Health $ctx $l } else { [pscustomobject]@{ health = 'absent'; status = 'absent' } }
    $pb = if ($l) { if ($l.playback) { $l.playback } else { $l.url } } else { $null }
    [pscustomobject]@{ id = $p.id; label = $p.label; instance = $p.name; type = $p.type; status = $h.status; health = $h.health; playback = $pb; source = $p.url }
  }
  $rows | Format-Table id, type, status, playback -AutoSize

  $out = [pscustomobject]@{ generatedAt = (Get-Date).ToString('o'); apiUrl = $ctx.ApiUrl; channels = $rows }
  ($out | ConvertTo-Json -Depth 8) | Set-Content -Path $OutFile -Encoding utf8
  Write-Host "wrote $OutFile" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Next: copy each 'playback' URL into data/channels.json as that channel's \"src\"," -ForegroundColor Cyan
  Write-Host "      then the front end is playing your real linear channels." -ForegroundColor Cyan

  $ok = @($rows | Where-Object { $_.status -eq 'running' }).Count
  Write-Host ("{0}/{1} channels running." -f $ok, $rows.Count) -ForegroundColor $(if ($ok -eq $rows.Count) { 'Green' } else { 'Yellow' })
}

function Do-Check {
  $bad = 0
  foreach ($p in Load-Plan) {
    $urls = @()
    if ($p.type -eq 'Playlist') {
      $r = Test-Source $p.url
      if (-not $r.ok) { Write-Host "x $($p.id)  playlist $($r.status)  $($p.url)" -ForegroundColor Red; $bad++; continue }
      $urls = @($r.body -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
      if (-not $urls) { Write-Host "x $($p.id)  playlist is empty  $($p.url)" -ForegroundColor Red; $bad++; continue }
    } elseif ($p.type -eq 'Loop') { $urls = @($p.url) }
    else { Write-Host "- $($p.id)  WebHook - not probed ($($p.url))" -ForegroundColor DarkGray }
    if ($p.opts.preroll) { $urls += $p.opts.preroll.url }
    if ($p.opts.defaultSlateUri) { $urls += $p.opts.defaultSlateUri }

    $fails = @(foreach ($u in $urls) {
      $r = Test-Source $u
      if (-not $r.ok) { "$($r.status) $u" } elseif (-not $r.body.StartsWith('#EXTM3U')) { "not an HLS manifest: $u" }
    })
    if ($fails) { $bad++; Write-Host "x $($p.id)  $($fails.Count)/$($urls.Count) failed" -ForegroundColor Red; $fails | ForEach-Object { Write-Host "    $_" } }
    else { Write-Host "ok $($p.id)  $($p.type)  $($urls.Count) URL(s)" -ForegroundColor Green }
  }
  if ($bad) { Write-Host "`n$bad channel(s) have problems. A 403 from Bunny usually means 'Block direct URL access' is on." -ForegroundColor Yellow; exit 1 }
  Write-Host "`nAll sources reachable." -ForegroundColor Green
}

function Do-List { (Connect-Osc | ForEach-Object { Get-Channels $_ }) | ConvertTo-Json -Depth 8 }

function Do-Teardown {
  $ctx = Connect-Osc
  $targets = Get-Channels $ctx | Where-Object { $_.name -like "$NamePrefix*" }
  if ($Only) { $names = (Load-Plan).name; $targets = $targets | Where-Object { $names -contains $_.name } }
  if (-not $targets) { Write-Host "Nothing named '$NamePrefix*'." -ForegroundColor Green; return }
  Write-Host "DELETE:" -ForegroundColor Yellow; $targets | ForEach-Object { Write-Host "  - $($_.name)" }
  if (-not $Force -and (Read-Host "Type 'yes'") -ne 'yes') { Write-Host "Aborted."; return }
  foreach ($t in $targets) { Write-Host "deleting $($t.name)"; Invoke-Osc -Method DELETE -Uri "$($ctx.ApiUrl)/$($t.name)" -Headers $ctx.SvcHeaders | Out-Null }
  Write-Host "Done." -ForegroundColor Green
}

function Do-Token {
  $ctx = Connect-Osc
  Write-Host "channel-engine apiUrl : $($ctx.ApiUrl)"
  Write-Host "service token expiry  : $([DateTimeOffset]::FromUnixTimeSeconds([long]$ctx.Expiry).ToLocalTime())"
  Write-Host "Auth OK." -ForegroundColor Green
}

switch ($Command) {
  'provision' { Do-Provision } 'check' { Do-Check } 'status' { Do-Status } 'list' { Do-List } 'teardown' { Do-Teardown } 'token' { Do-Token }
}
