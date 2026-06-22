$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$nextPath = Join-Path $root ".next"

if (-not (Test-Path -LiteralPath $nextPath)) {
  exit 0
}

$resolvedRoot = (Resolve-Path -LiteralPath $root).Path
$resolvedNext = (Resolve-Path -LiteralPath $nextPath).Path

if (-not $resolvedNext.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw ".next path resolved outside the workspace."
}

Get-ChildItem -LiteralPath $resolvedNext -Force -Recurse -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($_.Attributes -band [System.IO.FileAttributes]::ReadOnly) {
      $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
    }
  }

$nextItem = Get-Item -LiteralPath $resolvedNext -Force
if ($nextItem.Attributes -band [System.IO.FileAttributes]::ReadOnly) {
  $nextItem.Attributes = $nextItem.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
}

for ($attempt = 1; $attempt -le 3; $attempt++) {
  try {
    Remove-Item -LiteralPath $resolvedNext -Recurse -Force
    exit 0
  } catch {
    if ($attempt -eq 3) {
      throw
    }

    Start-Sleep -Milliseconds (250 * $attempt)
  }
}
