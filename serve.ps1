# M7 Car Wash - TCP Web Server (No admin needed)
param([int]$Port = 5500)

$root = "c:\Users\ALFAHIM\Desktop\websites\m7carwash"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css"
  ".js"   = "application/javascript"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".ico"  = "image/x-icon"
  ".webp" = "image/webp"
}

$ip       = [System.Net.IPAddress]::Any
$endpoint = New-Object System.Net.IPEndPoint($ip, $Port)
$server   = New-Object System.Net.Sockets.TcpListener($endpoint)
$server.Start()

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" }).IPAddress

Clear-Host
Write-Host ""
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host "    M7 CAR WASH - Server Running!" -ForegroundColor Yellow
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open on iPhone Safari:" -ForegroundColor Cyan
Write-Host "  http://$($localIP):$Port" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "  (iPhone must be on same Wi-Fi)" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host "  ======================================" -ForegroundColor Yellow
Write-Host ""

while ($true) {
  try {
    $client = $server.AcceptTcpClient()
    $stream = $client.GetStream()

    # Read HTTP request
    $buffer  = New-Object byte[] 4096
    $read    = $stream.Read($buffer, 0, $buffer.Length)
    $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)

    # Parse path
    $requestLine = ($request -split "`r`n")[0]
    $urlPath     = ($requestLine -split " ")[1]
    $urlPath     = [System.Uri]::UnescapeDataString($urlPath)
    if ($urlPath -eq "/" -or $urlPath -eq "") { $urlPath = "/index.html" }

    $filePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', '\'))

    if (Test-Path $filePath -PathType Leaf) {
      $ext      = [System.IO.Path]::GetExtension($filePath).ToLower()
      $mime     = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
      $body     = [System.IO.File]::ReadAllBytes($filePath)
      $header   = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerB  = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerB, 0, $headerB.Length)
      $stream.Write($body, 0, $body.Length)
      Write-Host "  200  $urlPath" -ForegroundColor Green
    } else {
      $body    = [System.Text.Encoding]::ASCII.GetBytes("404 Not Found")
      $header  = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerB = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerB, 0, $headerB.Length)
      $stream.Write($body, 0, $body.Length)
      Write-Host "  404  $urlPath" -ForegroundColor Red
    }

    $stream.Flush()
    $stream.Close()
    $client.Close()
  } catch {
    # Ignore client disconnect errors
  }
}
