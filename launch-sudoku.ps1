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

# Backend: passa a develop, aggiorna, applica eventuali nuove migrations, poi avvia.
# (sequelize-cli db:migrate applica solo le migrations ancora non eseguite)
$beCmd = 'title Sudoku-BE && cd /d "' + $BE_PATH + '" && git checkout develop && git pull --ff-only && npx sequelize-cli db:migrate && npm run dev'
Start-Process "cmd.exe" -ArgumentList "/k", $beCmd -WindowStyle Minimized

# Frontend: passa a develop, aggiorna, poi avvia
$feCmd = 'title Sudoku-FE && cd /d "' + $FE_PATH + '" && git checkout develop && git pull --ff-only && npx ng serve --open=false'
Start-Process "cmd.exe" -ArgumentList "/k", $feCmd -WindowStyle Minimized

# Poll until Angular is ready (max 120s: include update + migrate + avvio)
Write-Host "Avvio Sudoku (aggiornamento develop + migrations + server)..." -ForegroundColor Blue
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
