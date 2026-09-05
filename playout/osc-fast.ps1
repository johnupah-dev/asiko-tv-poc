<#
  playout/osc-fast.ps1  --  turn the POC's 7 channels into REAL linear channels
                            on Eyevinn Open Source Cloud (channel-engine / VOD2Live)

  This is Layer 1 of the roadmap (see ../README.md): production playout.
  It reads the SAME channel list the front end uses ( ../data/channels.json ),
  creates one Channel Engine "Loop" instance per channel from that channel's
  `src`, waits for them to go healthy, and writes the playback URLs to
  playout/playout.json so you can paste them back into data/channels.json.

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
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision   # create all 7
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 status      # health + URLs
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 teardown    # delete all 7
    powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision -Recreate
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('provision', 'status', 'list', 'teardown', 'token')]
  [string]$Command = 'status',

  [string]$ConfigPath,       # defaults to ../data/channels.json
  [string]$NamePrefix = 'asiko',
  [switch]$Recreate,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
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
  $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json
  $cfg.channels | ForEach-Object {
    if ($_.id -notmatch '^[a-z0-9]+$') { throw "channel id '$($_.id)' must be lowercase a-z0-9 (Channel Engine instance-name rule)." }
    [pscustomobject]@{
      id     = $_.id
      name   = ("{0}{1}" -f $NamePrefix, $_.id)   # OSC instance name
      label  = $_.name
      genre  = $_.genre
      type   = 'Loop'
      url    = $_.src
      opts   = @{ useDemuxedAudio = $false; useVttSubtitles = $false }
    }
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
    Write-Host "   launching Loop <- $($p.url)" -ForegroundColor DarkGray
    $inst = Invoke-Osc -Method POST -Uri $ctx.ApiUrl -Headers $ctx.SvcHeaders -Body @{ name = $p.name; type = $p.type; url = $p.url; opts = $p.opts }
    $pb = if ($inst.playback) { $inst.playback } else { $inst.url }
    Write-Host "   ok -> $pb" -ForegroundColor Green
  }

  Write-Host ""; Write-Host "Waiting up to 180s for healthy ..." -ForegroundColor Cyan
  $deadline = (Get-Date).AddSeconds(180)
  do {
    Start-Sleep 6
    $live = Get-Channels $ctx
    $running = @($live | ForEach-Object { (Get-Health $ctx $_).status } | Where-Object { $_ -eq 'running' }).Count
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
    [pscustomobject]@{ id = $p.id; label = $p.label; instance = $p.name; status = $h.status; health = $h.health; playback = $pb; source = $p.url }
  }
  $rows | Format-Table id, label, status, playback -AutoSize

  $out = [pscustomobject]@{ generatedAt = (Get-Date).ToString('o'); apiUrl = $ctx.ApiUrl; channels = $rows }
  ($out | ConvertTo-Json -Depth 8) | Set-Content -Path $OutFile -Encoding utf8
  Write-Host "wrote $OutFile" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Next: copy each 'playback' URL into data/channels.json as that channel's \"src\"," -ForegroundColor Cyan
  Write-Host "      then the front end is playing your real linear channels." -ForegroundColor Cyan

  $ok = @($rows | Where-Object { $_.status -eq 'running' }).Count
  Write-Host ("{0}/{1} channels running." -f $ok, $rows.Count) -ForegroundColor $(if ($ok -eq $rows.Count) { 'Green' } else { 'Yellow' })
}

function Do-List { (Connect-Osc | ForEach-Object { Get-Channels $_ }) | ConvertTo-Json -Depth 8 }

function Do-Teardown {
  $ctx = Connect-Osc
  $targets = Get-Channels $ctx | Where-Object { $_.name -like "$NamePrefix*" }
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
  'provision' { Do-Provision } 'status' { Do-Status } 'list' { Do-List } 'teardown' { Do-Teardown } 'token' { Do-Token }
}
