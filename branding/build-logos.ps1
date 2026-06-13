Add-Type -AssemblyName System.Drawing

# Crop heights derived from pixel audit of public/seamcor-logo.png:
# - Wordmark ends ~y=225; tagline runs ~y=300-370; legal footer ~y=460+
$MARKETING_H = 390
$ICON_H = 235
$LEGAL_HEADER_H = 40

function Save-Crop {
  param([string]$SrcPath, [string]$OutPath, [int]$Y, [int]$H)
  $src = [System.Drawing.Image]::FromFile($SrcPath)
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $H), (New-Object System.Drawing.Rectangle 0, $Y, $src.Width, $H), [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}

function Save-Legal {
  param([string]$SrcPath, [string]$OutPath)
  $src = [System.Drawing.Image]::FromFile($SrcPath)
  $totalH = $LEGAL_HEADER_H + $MARKETING_H
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $totalH
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $font = [System.Drawing.Font]::new('Arial', 18, [System.Drawing.FontStyle]::Regular)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))
  $text = 'Seamvex Data Systems Ltd - trading as'
  $size = $g.MeasureString($text, $font)
  $x = ($src.Width - $size.Width) / 2
  $g.DrawString($text, $font, $brush, $x, 8)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, $LEGAL_HEADER_H, $src.Width, $MARKETING_H), (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $MARKETING_H), [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose(); $font.Dispose(); $brush.Dispose()
}

$src = 'c:\Seamvex-website\public\seamcor-logo.png'
$out = 'c:\Seamvex-website\branding\logos'

Save-Crop -SrcPath $src -OutPath "$out\seamcor-marketing.png" -Y 0 -H $MARKETING_H
Save-Crop -SrcPath $src -OutPath "$out\seamcor-icon.png" -Y 0 -H $ICON_H
Save-Legal -SrcPath $src -OutPath "$out\seamcor-legal.png"

Write-Output "Built: marketing=${MARKETING_H}px icon=${ICON_H}px legal=$($LEGAL_HEADER_H + $MARKETING_H)px"
