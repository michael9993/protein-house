# PowerShell script to publish saleor-platform to GitHub
# This script helps you safely initialize and push to GitHub

param(
    [string]$GitHubUsername = "",
    [string]$RepositoryName = "saleor-platform",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

Write-Header "Saleor Platform - GitHub Publishing"

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Success "Git is installed: $gitVersion"
}
catch {
    Write-Error "Git is not installed. Please install Git first."
    exit 1
}

# Check if already a git repository
if (Test-Path ".git") {
    Write-Warning "Git repository already initialized"
    $continue = Read-Host "Do you want to continue? (y/N)"
    if ($continue -ne "y") {
        exit 0
    }
}
else {
    Write-Host "`nInitializing git repository..." -ForegroundColor Yellow
    git init
    Write-Success "Git repository initialized"
}

# Check for .env files that might be committed (excluding .example and .template files)
Write-Host "`nChecking for sensitive files..." -ForegroundColor Yellow

# Find .env files (excluding examples and templates)
$allEnvFiles = Get-ChildItem -Path . -Filter ".env*" -Recurse -ErrorAction SilentlyContinue | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.Name -notmatch "\.example$" -and
    $_.Name -notmatch "\.template$" -and
    $_.Name -notmatch "\.test\.example$"
}

# Check which ones git would actually track (not ignored)
$envFilesToWarn = @()
foreach ($file in $allEnvFiles) {
    # Get relative path from repo root
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    
    # Check if git would ignore this file
    $gitCheck = git check-ignore -v $relativePath 2>&1
    
    # If git check-ignore returns nothing, the file is NOT ignored (problem!)
    if ([string]::IsNullOrWhiteSpace($gitCheck)) {
        $envFilesToWarn += $file
    }
}

if ($envFilesToWarn.Count -gt 0) {
    Write-Warning "Found .env files that are NOT ignored by git (these will be committed!):"
    foreach ($file in $envFilesToWarn) {
        Write-Host "  - $($file.FullName)" -ForegroundColor Red
    }
    Write-Host "`n⚠️  WARNING: These files contain secrets and will be committed!" -ForegroundColor Red
    Write-Host "Please add them to .gitignore before continuing." -ForegroundColor Yellow
    Write-Host "Continue anyway? (y/N): " -NoNewline -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "y") {
        Write-Host "`nPlease update .gitignore to exclude these files before committing." -ForegroundColor Yellow
        exit 0
    }
}
else {
    Write-Success "All sensitive .env files are properly ignored by git"
    if ($allEnvFiles.Count -gt 0) {
        Write-Host "  (Found $($allEnvFiles.Count) .env files, all properly ignored)" -ForegroundColor Gray
    }
}

# Check .gitignore exists
if (-not (Test-Path ".gitignore")) {
    Write-Error ".gitignore file not found! This is required."
    exit 1
}
Write-Success ".gitignore file found"

# Stage all files
Write-Host "`nStaging files..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  [DRY RUN] Would run: git add ." -ForegroundColor Gray
}
else {
    git add .
    Write-Success "Files staged"
}

# Show what will be committed
Write-Host "`nFiles to be committed:" -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  [DRY RUN] Would show: git status --short" -ForegroundColor Gray
}
else {
    git status --short | Select-Object -First 20
    $total = (git status --short | Measure-Object).Count
    if ($total -gt 20) {
        Write-Host "  ... and $($total - 20) more files" -ForegroundColor Gray
    }
}

# Create commit
Write-Host "`nCreating initial commit..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Saleor platform with Stripe integration"
if ($DryRun) {
    Write-Host "  [DRY RUN] Would run: git commit -m '$commitMessage'" -ForegroundColor Gray
}
else {
    git commit -m $commitMessage
    Write-Success "Commit created"
}

# Set up GitHub remote
if ([string]::IsNullOrEmpty($GitHubUsername)) {
    $GitHubUsername = Read-Host "`nEnter your GitHub username"
}

$remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
Write-Host "`nGitHub repository URL: $remoteUrl" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Create a new repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host "   Repository name: $RepositoryName" -ForegroundColor Gray
Write-Host "   Visibility: Private (recommended) or Public" -ForegroundColor Gray
Write-Host "   DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. After creating the repository, run:" -ForegroundColor White
Write-Host "   git remote add origin $remoteUrl" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n[DRY RUN] No changes were made." -ForegroundColor Yellow
}
else {
    Write-Host "`n✅ Repository is ready to push to GitHub!" -ForegroundColor Green
    Write-Host "`nTo push now, run:" -ForegroundColor Cyan
    Write-Host "   git remote add origin $remoteUrl" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
}

Write-Host ""

