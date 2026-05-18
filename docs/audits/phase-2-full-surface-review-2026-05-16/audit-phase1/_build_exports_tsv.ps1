# Build a TSV of (exportName, definingLocation) from all .js/.jsx in lib/adapters/parsers/plugins/features
$rg = "rg"
$out = "C:\Dev\Projects\JotFolio\audit-phase1\_exports.tsv"
"" | Out-File $out -Encoding utf8

$dirs = @(
  "C:\Dev\Projects\JotFolio\source\src\lib",
  "C:\Dev\Projects\JotFolio\source\src\adapters",
  "C:\Dev\Projects\JotFolio\source\src\parsers",
  "C:\Dev\Projects\JotFolio\source\src\plugins",
  "C:\Dev\Projects\JotFolio\source\src\features"
)

foreach ($dir in $dirs) {
  $files = Get-ChildItem -Path $dir -Recurse -Include *.js,*.jsx -File | Where-Object {
    $_.FullName -notmatch '\.test\.(js|jsx)$' -and $_.FullName -notmatch '\.safety\.test\.'
  }
  foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    for ($i=0; $i -lt $lines.Count; $i++) {
      $line = $lines[$i]
      $lineNum = $i + 1
      # Match: export (async )?(function|const|class|let|var) NAME
      if ($line -match '^export\s+(?:async\s+)?(?:function|const|class|let|var)\s+(\w+)') {
        $name = $matches[1]
        "$name`t$($f.FullName):$lineNum" | Out-File $out -Encoding utf8 -Append
      }
      # Match: export { NAME1, NAME2 } (handle simple cases with re-exports skipped if " from ")
      elseif ($line -match '^export\s+\{\s*([^}]+)\s*\}') {
        $names = $matches[1] -split ',' | ForEach-Object { $_.Trim() -replace ' as .*','' } | Where-Object { $_ -and $_ -notmatch '^\s*$' }
        foreach ($n in $names) {
          "$n`t$($f.FullName):$lineNum" | Out-File $out -Encoding utf8 -Append
        }
      }
    }
  }
}

Write-Host "Built exports TSV: $out"
