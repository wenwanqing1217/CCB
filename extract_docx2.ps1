Add-Type -AssemblyName System.IO.Compression.FileSystem
`$zip = [System.IO.Compression.ZipFile]::OpenRead("D:\kki\doc_resume.docx")
`$entry = `$zip.GetEntry("word/document.xml")
`$stream = `$entry.Open()
`$reader = New-Object System.IO.StreamReader(`$stream)
`$xml = `$reader.ReadToEnd()
`$reader.Close()
`$zip.Dispose()

# Extract text content
`$matches = [regex]::Matches(`$xml, '<w:t[^>]*>(.*?)</w:t>')
foreach (`$m in `$matches) { Write-Host `$m.Groups[1].Value }