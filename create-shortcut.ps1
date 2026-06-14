# Run this ONCE to create the Sudoku desktop shortcut with icon.
# Assumes sudokuBE is cloned in the same parent folder as sudokuFE.
$FE_PATH  = $PSScriptRoot
$PNG      = Join-Path $FE_PATH "public\sudoku-icon.png"
$ICO      = Join-Path $FE_PATH "sudoku.ico"
$LAUNCHER = Join-Path $FE_PATH "launch-sudoku.ps1"
$SHORTCUT = [Environment]::GetFolderPath('Desktop') + "\Sudoku.lnk"

# 1. Convert PNG -> ICO
if (Test-Path $PNG) {
    Add-Type -AssemblyName System.Drawing
    $bmp    = [System.Drawing.Bitmap]::new($PNG)
    $scaled = [System.Drawing.Bitmap]::new($bmp, [System.Drawing.Size]::new(256, 256))
    $hIcon  = $scaled.GetHicon()
    $icon   = [System.Drawing.Icon]::FromHandle($hIcon)
    $stream = [System.IO.FileStream]::new($ICO, [System.IO.FileMode]::Create)
    $icon.Save($stream)
    $stream.Dispose(); $icon.Dispose(); $scaled.Dispose(); $bmp.Dispose()
    Write-Host "ICO creato: $ICO" -ForegroundColor Green
} else {
    Write-Host "ATTENZIONE: icona non trovata in $PNG. Uso icona default." -ForegroundColor Yellow
    $ICO = ""
}

# 2. Create desktop shortcut
$WScript = New-Object -ComObject WScript.Shell
$lnk = $WScript.CreateShortcut($SHORTCUT)
$lnk.TargetPath       = "powershell.exe"
$lnk.Arguments        = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LAUNCHER`""
$lnk.WorkingDirectory = $FE_PATH
$lnk.Description      = "Avvia il gioco Sudoku"
if ($ICO) { $lnk.IconLocation = $ICO }
$lnk.Save()

Write-Host "Collegamento creato: $SHORTCUT" -ForegroundColor Green
Write-Host "Fai doppio click su 'Sudoku' sul Desktop per giocare."
