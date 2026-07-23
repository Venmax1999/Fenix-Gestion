$dir = 'C:\Users\Maxi\.gemini\antigravity\scratch\raices-tucuman\client\src'

$replacements = @(
  @('#3d2810', '#0d3d4a'),
  @('#5c3d1e', '#0d5f6e'),
  @('#4a3220', '#0f4a59'),
  @('#6b4e38', '#2d7a8a'),
  @('#8a6a50', '#4a8f9e'),
  @('#a08060', '#6ab3c0'),
  @('#c4a898', '#9dd4de'),
  @('#d9d0bc', '#b8e8f0'),
  @('#e8dece', '#cef0f8'),
  @('#f0e8dc', '#dff4f8'),
  @('#f5f0ea', '#f0f8fa'),
  @('#4e6339', '#0d7a8a'),
  @('#758a62', '#1a8fa6'),
  @('#8e9e7a', '#4dbfd4'),
  @('#5d714d', '#0d6e7e'),
  @('rgba(92,61,30', 'rgba(13,95,110'),
  @('rgba(142,158,122', 'rgba(77,191,212'),
  @('rgba(196,168,152', 'rgba(157,212,222'),
  @('rgba(217,208,188', 'rgba(184,232,240'),
  @('rgba(117,138,98', 'rgba(26,143,166'),
  @('rgba(97,122,72', 'rgba(13,122,138')
)

Get-ChildItem -Path $dir -Filter '*.jsx' -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  foreach ($pair in $replacements) {
    $content = $content.Replace($pair[0], $pair[1])
  }
  Set-Content $_.FullName $content -NoNewline
  Write-Host "Updated: $($_.Name)"
}
Write-Host "All done!"
