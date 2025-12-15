# Fix Prisma Permission Error Script
# This script helps resolve EPERM errors when generating Prisma client

Write-Host "=== Prisma Permission Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for running Node processes
Write-Host "[1/4] Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"} -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found Node processes. Please stop your Next.js dev server first." -ForegroundColor Red
    Write-Host "Press Ctrl+C in the terminal running 'npm run dev' or 'next dev'" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Have you stopped the dev server? (y/n)"
    if ($response -ne "y") {
        Write-Host "Exiting. Please stop the dev server and try again." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "No Node processes found. Good!" -ForegroundColor Green
}

Write-Host ""

# Step 2: Try to unlock/delete the problematic file
Write-Host "[2/4] Attempting to unlock Prisma query engine file..." -ForegroundColor Yellow
$prismaEnginePath = "node_modules\.prisma\client\query_engine-windows.dll.node"

if (Test-Path $prismaEnginePath) {
    try {
        # Try to remove the file if it exists
        Remove-Item $prismaEnginePath -Force -ErrorAction SilentlyContinue
        Write-Host "Removed locked file." -ForegroundColor Green
    } catch {
        Write-Host "Could not remove file. This is okay, we'll try to generate anyway." -ForegroundColor Yellow
    }
} else {
    Write-Host "File doesn't exist yet. This is normal." -ForegroundColor Green
}

Write-Host ""

# Step 3: Clean Prisma cache
Write-Host "[3/4] Cleaning Prisma cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    try {
        Remove-Item "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Prisma cache cleaned." -ForegroundColor Green
    } catch {
        Write-Host "Could not clean cache completely. Continuing anyway..." -ForegroundColor Yellow
    }
} else {
    Write-Host "No Prisma cache found." -ForegroundColor Green
}

Write-Host ""

# Step 4: Generate Prisma client
Write-Host "[4/4] Generating Prisma client..." -ForegroundColor Yellow
Write-Host ""

try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next step: Run the migration:" -ForegroundColor Cyan
        Write-Host "  npx prisma migrate dev --name update_analysis_history_columns" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Generation failed. Try running as Administrator or restart your terminal." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try these solutions:" -ForegroundColor Yellow
    Write-Host "1. Close all terminals and VS Code" -ForegroundColor White
    Write-Host "2. Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "3. Restart your computer" -ForegroundColor White
    Write-Host "4. Check if antivirus is blocking the operation" -ForegroundColor White
}

Write-Host ""

