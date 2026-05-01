# decode.ps1 - Decodes base64 App.jsx chunks.
[CmdletBinding()]
param(
  [string]$ChunksDir,
  [string]$OutputFile,
  [switch]$Cleanup
)

$ErrorActionPreference = "Stop"

if (-not $ChunksDir) {
  $scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
  $ChunksDir = Join-Path $scriptRoot "src"
}

$resolvedChunksDir = (Resolve-Path -LiteralPath $ChunksDir).Path
if (-not $OutputFile) {
  $OutputFile = Join-Path $resolvedChunksDir "App.jsx"
}

$chunks = Get-ChildItem -LiteralPath $resolvedChunksDir -Filter "chunk_*" -File | Sort-Object Name
if (-not $chunks) {
  throw "No chunk_* files found in '$resolvedChunksDir'. Pass -ChunksDir if the chunks are somewhere else."
}

$combined = ($chunks | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join ""
$combined = ($combined -replace "\s", "")
if (-not $combined) {
  throw "Chunk files were found, but their combined base64 content is empty."
}

try {
  $bytes = [Convert]::FromBase64String($combined)
} catch {
  throw "Combined chunk content is not valid base64. Original error: $($_.Exception.Message)"
}

[IO.File]::WriteAllBytes($OutputFile, $bytes)

if ($Cleanup) {
  $chunks | Remove-Item -Force
}

Write-Host "Wrote $OutputFile ($($bytes.Length) bytes)"
