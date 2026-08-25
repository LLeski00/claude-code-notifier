Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

function RoundedRect([System.Drawing.RectangleF]$rect, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
  $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
  $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

$rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
$path = RoundedRect $rect 56

$c1 = [System.Drawing.Color]::FromArgb(255, 79, 70, 229)   # indigo
$c2 = [System.Drawing.Color]::FromArgb(255, 124, 58, 237)  # violet
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(0, 0)),
  (New-Object System.Drawing.Point($size, $size)),
  $c1, $c2
)
$g.FillPath($brush, $path)

$font = New-Object System.Drawing.Font("Segoe MDL2 Assets", 128, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$glyph = [string]([char]0xE7E7)  # bell / ringer glyph
$white = [System.Drawing.Brushes]::White

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$textRect = New-Object System.Drawing.RectangleF(0, -6, $size, $size)
$g.DrawString($glyph, $font, $white, $textRect, $sf)

# small accent dot (top-right) to suggest "active/on"
$dotColor = [System.Drawing.Color]::FromArgb(255, 74, 222, 128) # green
$dotBrush = New-Object System.Drawing.SolidBrush($dotColor)
$dotSize = 44
$g.FillEllipse($dotBrush, $size - $dotSize - 18, 18, $dotSize, $dotSize)
$g.DrawEllipse((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,79,70,229), 6)), $size - $dotSize - 18, 18, $dotSize, $dotSize)

$outPath = "c:\Dev\claude-code-notifier\resources\icon\icon.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
"saved: $outPath"
