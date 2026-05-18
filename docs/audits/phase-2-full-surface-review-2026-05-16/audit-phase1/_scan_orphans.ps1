# Orphan scan: for each export, count references excluding the defining file and its own test file.
# Output: TSV with cols: exportName, definedAt, refCount, sampleRefFile

param(
  [string]$ExportsFile = "C:\Dev\Projects\JotFolio\audit-phase1\_exports.tsv",
  [string]$Out = "C:\Dev\Projects\JotFolio\audit-phase1\_orphan_scan.tsv",
  [string]$SrcRoot = "C:\Dev\Projects\JotFolio\source\src"
)

$rg = "C:\Users\gavin\scoop\shims\rg.exe"
if (-not (Test-Path $rg)) {
  $rg = "rg"
}

$exports = Get-Content $ExportsFile | ForEach-Object {
  $parts = $_.Split("`t")
  if ($parts.Length -ge 2) { @{ Name = $parts[0]; Defined = $parts[1] } }
} | Where-Object { $_ }

"name`tdefined`trefCount`tsampleRef" | Out-File $Out -Encoding utf8

$total = $exports.Count
$i = 0
foreach ($e in $exports) {
  $i++
  $name = $e.Name
  $defined = $e.Defined
  # Defining file (absolute path before the colon)
  $defFile = ($defined -split ':')[0]
  if (-not $defFile.StartsWith('C:')) {
    $defFile = 'C:' + ($defined -split ':')[1]
  }
  # also exclude test file beside it (replace .js with .test.js etc.)
  $defBase = $defFile -replace '\.(jsx?|tsx?)$', ''

  # Search source/src for the symbol as a word (regex \b)
  $pattern = "\b$([regex]::Escape($name))\b"
  try {
    $hits = & $rg -n --no-heading --type-add 'jsxts:*.{js,jsx,ts,tsx,mjs,cjs}' -t jsxts $pattern $SrcRoot 2>$null
  } catch { $hits = @() }
  if (-not $hits) { $hits = @() }

  $count = 0
  $sample = ""
  foreach ($h in $hits) {
    $hFile = ($h -split ':')[0]
    if (-not $hFile.StartsWith('C:')) {
      $hFile = 'C:' + ($h -split ':')[1]
    }
    # Skip the defining file
    if ($hFile -eq $defFile) { continue }
    # Skip a test file that matches the defining file's base
    if ($hFile -like "$defBase*test*") { continue }
    $count++
    if (-not $sample) { $sample = $h }
  }
  "$name`t$defined`t$count`t$sample" | Out-File $Out -Encoding utf8 -Append
  if ($i % 20 -eq 0) { Write-Host "Scanned $i / $total" }
}
Write-Host "Done. $total exports scanned."
