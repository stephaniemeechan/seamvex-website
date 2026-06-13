Add-Type -AssemblyName System.Drawing

function Get-RowStats($bmp, $y) {
  $w = $bmp.Width
  $dark = 0; $grey = 0; $pink = 0
  for ($x = 0; $x -lt $w; $x += 4) {
    $p = $bmp.GetPixel($x, $y)
    if ($p.A -lt 20) { continue }
    if ($p.R -gt 180 -and $p.B -gt 100 -and $p.G -lt 120) { $pink++ }
    elseif ($p.R -lt 80 -and $p.G -lt 90 -and $p.B -gt 100) { $dark++ }
    elseif ($p.R -gt 70 -and $p.G -gt 70 -and $p.B -gt 70 -and $p.R -lt 180) { $grey++ }
  }
  return [PSCustomObject]@{ y = $y; dark = $dark; grey = $grey; pink = $pink; total = $dark + $grey + $pink }
}

$master = [System.Drawing.Bitmap]::FromFile('c:\Seamvex-website\public\seamcor-logo.png')
Write-Output 'MASTER row scan (every 10px):'
for ($y = 0; $y -lt $master.Height; $y += 10) {
  $s = Get-RowStats $master $y
  if ($s.total -gt 5) { Write-Output "y=$($s.y) dark=$($s.dark) grey=$($s.grey) pink=$($s.pink)" }
}

function Test-CropMatch($masterPath, $cropPath, $y, $h) {
  $m = [System.Drawing.Bitmap]::FromFile($masterPath)
  $c = [System.Drawing.Bitmap]::FromFile($cropPath)
  $mismatches = 0; $checked = 0
  for ($x = 0; $x -lt $c.Width; $x += 2) {
    for ($cy = 0; $cy -lt $c.Height; $cy += 2) {
      $my = $y + $cy
      $p1 = $m.GetPixel($x, $my)
      $p2 = $c.GetPixel($x, $cy)
      $checked++
      if ($p1.R -ne $p2.R -or $p1.G -ne $p2.G -or $p1.B -ne $p2.B -or $p1.A -ne $p2.A) { $mismatches++ }
    }
  }
  $m.Dispose(); $c.Dispose()
  Write-Output "Crop match $($cropPath): mismatches=$mismatches / $checked"
}

Test-CropMatch 'c:\Seamvex-website\public\seamcor-logo.png' 'c:\Seamvex-website\branding\logos\seamcor-marketing.png' 0 390
Test-CropMatch 'c:\Seamvex-website\public\seamcor-logo.png' 'c:\Seamvex-website\branding\logos\seamcor-icon.png' 0 235

$master.Dispose()
