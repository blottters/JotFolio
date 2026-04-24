# decode.ps1 - Decodes base64 App.jsx chunks
$chunksDir = "C:\Dev\jotfolio\src"
$b64File = "$chunksDir\app_b64.txt"
$outFile = "$chunksDir\App.jsx"

# Combine all chunk files
$chunks = Get-ChildItem "$chunksDir\chunk_*" | Sort-Object Name
$combined = ($chunks | ForEach-Object { Get-Content $_.FullName -Raw }) -join ""
Set-Content -Path $b64File -Value $combined -NoNewline

# Decode
$bytes = [Convert]::FromBase64String($combined)
[IO.File]::WriteAllBytes($outFile, $bytes)

# Cleanup
Remove-Item "$chunksDir\chunk_*" -Force
Remove-Item $b64File -Force

Write-Host "Wrote App.jsx ($($bytes.Length) bytes)"
