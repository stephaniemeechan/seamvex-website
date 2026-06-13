Add-Type -AssemblyName System.Drawing

function Remove-WhiteBackground {
  param(
    [string]$InPath,
    [string]$OutPath,
    [int]$Threshold = 250
  )
  $bmp = [System.Drawing.Bitmap]::FromFile($InPath)
  $out = New-Object System.Drawing.Bitmap $bmp.Width, $bmp.Height
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
      $p = $bmp.GetPixel($x, $y)
      if ($p.R -ge $Threshold -and $p.G -ge $Threshold -and $p.B -ge $Threshold) {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
      } elseif ($p.R -ge 240 -and $p.G -ge 240 -and $p.B -ge 240) {
        # Soften anti-alias fringe on edges
        $alpha = [Math]::Min(255, ($p.R + $p.G + $p.B) - 720)
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
      } else {
        $out.SetPixel($x, $y, $p)
      }
    }
  }
  $out.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose(); $out.Dispose()
}

$dir = 'c:\Seamvex-website\branding\logos'
Remove-WhiteBackground -InPath "$dir\seamcor-marketing.png" -OutPath "$dir\seamcor-marketing-transparent.png"
Remove-WhiteBackground -InPath "$dir\seamcor-legal.png" -OutPath "$dir\seamcor-legal-transparent.png"
Write-Output 'Transparent variants built.'
