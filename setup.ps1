# ============================================================
#  setup.ps1 — One-shot project setup for eng-learn-platform
#  Run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "  4,000 Essential Words — Project Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host ""

# ── 1. Check Node.js ──────────────────────────────────────────
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "      ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "         → Download from: https://nodejs.org (choose LTS)" -ForegroundColor White
    Write-Host "         → After installing, close this terminal and re-run." -ForegroundColor White
    exit 1
}

# ── 2. Check .env file ────────────────────────────────────────
Write-Host "[2/6] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectDir\.env")) {
    if (Test-Path "$ProjectDir\.env.example") {
        Copy-Item "$ProjectDir\.env.example" "$ProjectDir\.env"
        Write-Host "      ⚠️  Created .env from .env.example" -ForegroundColor Yellow
        Write-Host "      → STOP: Open .env and fill in your DATABASE_URL and NEXTAUTH_SECRET" -ForegroundColor Red
        Write-Host "      → Then re-run this script." -ForegroundColor Red
        Start-Process notepad "$ProjectDir\.env"
        exit 0
    } else {
        Write-Host "      ❌ No .env or .env.example found!" -ForegroundColor Red
        exit 1
    }
} else {
    $envContent = Get-Content "$ProjectDir\.env" -Raw
    if ($envContent -match "your_password" -or $envContent -match "REPLACE_WITH") {
        Write-Host "      ⚠️  .env exists but still has placeholder values!" -ForegroundColor Yellow
        Write-Host "      → Open .env and replace: DATABASE_URL password, NEXTAUTH_SECRET" -ForegroundColor Red
        Start-Process notepad "$ProjectDir\.env"
        exit 0
    }
    Write-Host "      ✅ .env file found" -ForegroundColor Green
}

# ── 3. Install dependencies ───────────────────────────────────
Write-Host "[3/6] Installing npm dependencies..." -ForegroundColor Yellow
Set-Location $ProjectDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ npm install failed. Check your internet connection." -ForegroundColor Red
    exit 1
}
Write-Host "      ✅ Dependencies installed" -ForegroundColor Green

# ── 4. Generate Prisma client ─────────────────────────────────
Write-Host "[4/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ Prisma generate failed. Check your schema.prisma" -ForegroundColor Red
    exit 1
}
Write-Host "      ✅ Prisma client generated" -ForegroundColor Green

# ── 5. Run migrations ─────────────────────────────────────────
Write-Host "[5/6] Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ Migration failed!" -ForegroundColor Red
    Write-Host "         Common causes:" -ForegroundColor White
    Write-Host "           • PostgreSQL not running → Start it in Services (services.msc)" -ForegroundColor White
    Write-Host "           • Wrong DATABASE_URL → Check host, port, user, password in .env" -ForegroundColor White
    Write-Host "           • Database doesn't exist → Run: psql -U postgres -c 'CREATE DATABASE eng_learn_db;'" -ForegroundColor White
    exit 1
}
Write-Host "      ✅ Database tables created" -ForegroundColor Green

# ── 6. Seed database ──────────────────────────────────────────
Write-Host "[6/6] Seeding database (levels, units, admin user)..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ⚠️  Seed had warnings (may already be seeded — safe to continue)" -ForegroundColor Yellow
} else {
    Write-Host "      ✅ Database seeded" -ForegroundColor Green
}

# ── Done ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor DarkGreen
Write-Host "  ✅ Setup complete! Starting dev server..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  → Admin Upload:  http://localhost:3000/admin/upload" -ForegroundColor Cyan
    Write-Host "  Prisma Studio: run npx prisma studio to browse DB" -ForegroundColor Cyan
Write-Host ""

npm run dev
