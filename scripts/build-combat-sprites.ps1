$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $root 'assets\pokemon\combat'
$temporaryDirectory = Join-Path $env:TEMP ('pokemon-combat-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $outputDirectory, $temporaryDirectory -Force | Out-Null
Add-Type -AssemblyName System.Drawing

$pokemon = @(
  @{ id = 'bulbasaur'; dex = '0001' }, @{ id = 'venusaur'; dex = '0003' },
  @{ id = 'charmander'; dex = '0004' }, @{ id = 'charizard'; dex = '0006' },
  @{ id = 'squirtle'; dex = '0007' }, @{ id = 'blastoise'; dex = '0009' },
  @{ id = 'chikorita'; dex = '0152' }, @{ id = 'meganium'; dex = '0154' },
  @{ id = 'cyndaquil'; dex = '0155' }, @{ id = 'typhlosion'; dex = '0157' },
  @{ id = 'totodile'; dex = '0158' }, @{ id = 'feraligatr'; dex = '0160' },
  @{ id = 'treecko'; dex = '0252' }, @{ id = 'sceptile'; dex = '0254' },
  @{ id = 'torchic'; dex = '0255' }, @{ id = 'blaziken'; dex = '0257' },
  @{ id = 'mudkip'; dex = '0258' }, @{ id = 'swampert'; dex = '0260' },
  @{ id = 'turtwig'; dex = '0387' }, @{ id = 'torterra'; dex = '0389' },
  @{ id = 'chimchar'; dex = '0390' }, @{ id = 'infernape'; dex = '0392' },
  @{ id = 'piplup'; dex = '0393' }, @{ id = 'empoleon'; dex = '0395' }
)

foreach ($monster in $pokemon) {
  $source = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/$($monster.dex)/0000/0001"
  [xml]$animationData = (Invoke-WebRequest -UseBasicParsing -Uri "$source/AnimData.xml").Content

  foreach ($animationName in @('Attack', 'Hurt')) {
    $animation = @($animationData.AnimData.Anims.Anim | Where-Object Name -eq $animationName)[0]
    if (-not $animation) { throw "$($monster.id): $animationName animation is missing." }

    $frameWidth = [int]$animation.FrameWidth
    $frameHeight = [int]$animation.FrameHeight
    $sheetPath = Join-Path $temporaryDirectory "$($monster.id)-$animationName.png"
    Invoke-WebRequest -UseBasicParsing -Uri "$source/$animationName-Anim.png" -OutFile $sheetPath

    $sheet = [Drawing.Image]::FromFile($sheetPath)
    $frameCount = [math]::Floor($sheet.Width / $frameWidth)
    if ($frameCount -lt 1 -or $sheet.Height -lt $frameHeight) { throw "$($monster.id): $animationName sheet is invalid." }

    $frameDirectory = Join-Path $temporaryDirectory "$($monster.id)-$animationName-frames"
    New-Item -ItemType Directory -Path $frameDirectory -Force | Out-Null
    for ($frameIndex = 0; $frameIndex -lt $frameCount; $frameIndex += 1) {
      $frame = New-Object Drawing.Bitmap $frameWidth, $frameHeight
      $canvas = [Drawing.Graphics]::FromImage($frame)
      $canvas.DrawImage(
        $sheet,
        [Drawing.Rectangle]::new(0, 0, $frameWidth, $frameHeight),
        [Drawing.Rectangle]::new($frameIndex * $frameWidth, 0, $frameWidth, $frameHeight),
        [Drawing.GraphicsUnit]::Pixel
      )
      $canvas.Dispose()
      $frame.Save((Join-Path $frameDirectory ('{0:D3}.png' -f $frameIndex)), [Drawing.Imaging.ImageFormat]::Png)
      $frame.Dispose()
    }
    $sheet.Dispose()

    $resultPath = Join-Path $outputDirectory "$($monster.id)-$($animationName.ToLower()).gif"
    & ffmpeg -hide_banner -loglevel error -y -framerate 18 -i (Join-Path $frameDirectory '%03d.png') -vf 'scale=iw*2:ih*2:flags=neighbor' -loop 0 $resultPath
    if ($LASTEXITCODE -ne 0) { throw "$($monster.id): $animationName GIF conversion failed." }
  }
}

Write-Output "Created $((Get-ChildItem $outputDirectory -Filter '*.gif').Count) combat GIFs in $outputDirectory"
