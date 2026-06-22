$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$nextPath = Join-Path $root ".next"
$outLog = Join-Path $root "dev-server.log"
$errLog = Join-Path $root "dev-server.err.log"

$listeners = netstat -ano |
  Select-String ":3000" |
  Select-String "LISTENING" |
  ForEach-Object {
    $parts = ($_.ToString() -split "\s+") | Where-Object { $_ }
    [int]$parts[-1]
  } |
  Sort-Object -Unique

foreach ($listener in $listeners) {
  Stop-Process -Id $listener -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

if (Test-Path -LiteralPath $nextPath) {
  $resolvedRoot = (Resolve-Path -LiteralPath $root).Path
  $resolvedNext = (Resolve-Path -LiteralPath $nextPath).Path

  if ($resolvedNext.StartsWith($resolvedRoot)) {
    Remove-Item -LiteralPath $resolvedNext -Recurse -Force
  }
}

Remove-Item -LiteralPath $outLog, $errLog -ErrorAction SilentlyContinue

$command = 'npm.cmd run dev:turbo > "dev-server.log" 2> "dev-server.err.log"'
Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/d", "/c", $command `
  -WorkingDirectory $root `
  -WindowStyle Hidden

Start-Sleep -Seconds 6

$active = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if (-not $active) {
  Write-Host "Dev server did not start. Check dev-server.err.log."
  exit 1
}

Write-Host "Dev server restarted on http://localhost:3000"
