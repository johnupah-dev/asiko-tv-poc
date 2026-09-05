# LOOP7 dev server - no dependencies, uses built-in Windows .NET HttpListener.
# Run:  powershell -ExecutionPolicy Bypass -File serve.ps1     (optional: $env:PORT)
$port = if ($env:PORT) { $env:PORT } else { 4173 }
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.m3u8' = 'application/vnd.apple.mpegurl'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "LOOP7 dev server -> http://localhost:$port  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      if ($rel -eq '/') { $rel = '/index.html' }
      $file = Join-Path $root ($rel.TrimStart('/') -replace '/', '\')
      $full = [System.IO.Path]::GetFullPath($file)

      if ((-not $full.StartsWith($root)) -or (-not (Test-Path -LiteralPath $full -PathType Leaf))) {
        $ctx.Response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      }
      else {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $ct = $mime[$ext]
        if (-not $ct) { $ct = 'application/octet-stream' }
        $ctx.Response.ContentType = $ct
        $ctx.Response.Headers.Add('Access-Control-Allow-Origin', '*')
        $ctx.Response.Headers.Add('Cache-Control', 'no-store')
        $bytes = [System.IO.File]::ReadAllBytes($full)
      }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    catch {
      try { $ctx.Response.StatusCode = 500 } catch {}
    }
    finally {
      try { $ctx.Response.OutputStream.Close() } catch {}
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
