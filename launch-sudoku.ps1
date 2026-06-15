# Sudoku Launcher
# Assumes sudokuBE is cloned in the same parent folder as sudokuFE.
# To override, change BE_PATH below.
$FE_PATH = $PSScriptRoot
$BE_PATH = Join-Path (Split-Path $PSScriptRoot -Parent) "sudokuBE"
$URL     = "http://localhost:4200"

if (-not (Test-Path $BE_PATH)) {
    Write-Host "Backend non trovato in: $BE_PATH" -ForegroundColor Red
    Write-Host "Modifica la variabile BE_PATH nello script."
    Read-Host "Premi Invio per uscire"
    exit 1
}

# If already running, just open browser
try {
    $null = Invoke-WebRequest -Uri $URL -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
    Start-Process $URL
    exit
} catch {}

# --- Backend: pull + npm install se package.json cambiato ---
Write-Host "Aggiornamento BE..." -ForegroundColor Blue
Push-Location $BE_PATH
git checkout develop 2>$null | Out-Null
$bePkgBefore = git hash-object package.json 2>$null
git pull --ff-only
$bePkgAfter = git hash-object package.json 2>$null
if (-not (Test-Path "node_modules") -or $bePkgBefore -ne $bePkgAfter) {
    Write-Host "  Dipendenze BE aggiornate, npm install..." -ForegroundColor Yellow
    npm install
}
Pop-Location

# --- Frontend: pull + npm install se package.json cambiato ---
Write-Host "Aggiornamento FE..." -ForegroundColor Blue
Push-Location $FE_PATH
git checkout develop 2>$null | Out-Null
$fePkgBefore = git hash-object package.json 2>$null
git pull --ff-only
$fePkgAfter = git hash-object package.json 2>$null
if (-not (Test-Path "node_modules") -or $fePkgBefore -ne $fePkgAfter) {
    Write-Host "  Dipendenze FE aggiornate, npm install..." -ForegroundColor Yellow
    npm install
}
Pop-Location

# Backend: applica migrations e avvia (pull gia' fatto sopra)
$beCmd = 'title Sudoku-BE && cd /d "' + $BE_PATH + '" && npx sequelize-cli db:migrate && npm run dev'
Start-Process "cmd.exe" -ArgumentList "/k", $beCmd -WindowStyle Minimized

# Frontend: avvia direttamente (pull + install gia' fatto sopra)
$feCmd = 'title Sudoku-FE && cd /d "' + $FE_PATH + '" && npx ng serve --open=false'
Start-Process "cmd.exe" -ArgumentList "/k", $feCmd -WindowStyle Minimized

# Poll until Angular is ready (max 120s)
Write-Host "Avvio server..." -ForegroundColor Blue
$timeout = 120
$elapsed = 0
$ready   = $false

while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 3
    $elapsed += 3
    try {
        $null = Invoke-WebRequest -Uri $URL -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
        break
    } catch {}
    Write-Host "  attesa... ($elapsed s)" -ForegroundColor DarkGray
}

if ($ready) {
    Write-Host "Pronto! Apertura browser..." -ForegroundColor Green
    Start-Process $URL
} else {
    Write-Host "Timeout: il frontend non e' partito in $timeout s." -ForegroundColor Red
    Write-Host "Controlla le finestre Sudoku-BE e Sudoku-FE."
}
