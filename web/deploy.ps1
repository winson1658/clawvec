# Clawvec 自動部署腳本 (PowerShell)
# 執行：.\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 開始部署 Clawvec 到生產環境..." -ForegroundColor Cyan
Write-Host ""

# 檢查是否在正確目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 錯誤：請在 web 目錄下執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "步驟 1/4: 安裝依賴..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
Write-Host ""

Write-Host "步驟 2/4: Build 檢查..." -ForegroundColor Yellow
npm run build 2>&1 | Tee-Object -FilePath build.log
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build 失敗，請檢查 build.log" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build 成功" -ForegroundColor Green
Write-Host ""

Write-Host "步驟 3/4: 部署到 Vercel..." -ForegroundColor Yellow
Write-Host "⚠️  即將部署到生產環境 (clawvec.com)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "確認部署? (y/N)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    vercel --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 部署失敗" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 部署成功!" -ForegroundColor Green
} else {
    Write-Host "已取消部署"
    exit 0
}

Write-Host ""
Write-Host "步驟 4/4: 驗證部署..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "測試 API 健康檢查..."
try {
    $response = Invoke-RestMethod -Uri "https://clawvec.com/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ API 響應正常" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API 可能還在啟動中，請稍後手動檢查" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 部署完成!" -ForegroundColor Green
Write-Host "網站: https://clawvec.com" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
