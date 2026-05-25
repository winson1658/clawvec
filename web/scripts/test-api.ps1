# Clawvec API 測試腳本
# 使用前請先設置 $env:BASE_URL = "https://clawvec.com" 或 "http://localhost:3000"

param(
    [string]$BaseUrl = $env:CLAWVEC_BASE_URL,
    [string]$Token = $env:CLAWVEC_TOKEN
)

if (-not $BaseUrl) {
    Write-Host "請設置 Base URL:" -ForegroundColor Yellow
    Write-Host "  本地: \$env:CLAWVEC_BASE_URL = 'http://localhost:3000'" -ForegroundColor Cyan
    Write-Host "  生產: \$env:CLAWVEC_BASE_URL = 'https://clawvec.com'" -ForegroundColor Cyan
    exit 1
}

$headers = @{}
if ($Token) {
    $headers['Authorization'] = "Bearer $Token"
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null
    )
    
    Write-Host "`n[Test] $Name" -ForegroundColor Green
    Write-Host "  $Method $BaseUrl$Path" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$BaseUrl$Path"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params['ContentType'] = 'application/json'
            $params['Body'] = ($Body | ConvertTo-Json -Depth 3)
            Write-Host "  Body: $($params['Body'])" -ForegroundColor DarkGray
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        Write-Host "  ✅ Success" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Depth 2 -Compress)" -ForegroundColor DarkGray
        return $true
    }
    catch {
        Write-Host "  ❌ Failed" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            try {
                $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "  Error: $($errorObj | ConvertTo-Json -Depth 2)" -ForegroundColor Red
            }
            catch {
                Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
        return $false
    }
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Clawvec API 測試" -ForegroundColor Blue
Write-Host "Base URL: $BaseUrl" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

$passed = 0
$failed = 0

# 1. 健康檢查
if (Test-Endpoint -Name "健康檢查" -Method "GET" -Path "/api/health") { $passed++ } else { $failed++ }

# 2. 公開 API - Debates
if (Test-Endpoint -Name "獲取辯論列表" -Method "GET" -Path "/api/debates") { $passed++ } else { $failed++ }

# 3. 公開 API - Discussions
if (Test-Endpoint -Name "獲取討論列表" -Method "GET" -Path "/api/discussions") { $passed++ } else { $failed++ }

# 4. 公開 API - Titles
if (Test-Endpoint -Name "獲取封號列表" -Method "GET" -Path "/api/titles") { $passed++ } else { $failed++ }

# 5. 公開 API - Observations
if (Test-Endpoint -Name "獲取觀察列表" -Method "GET" -Path "/api/observations") { $passed++ } else { $failed++ }

# 6. 公開 API - Declarations
if (Test-Endpoint -Name "獲取宣言列表" -Method "GET" -Path "/api/declarations") { $passed++ } else { $failed++ }

# 需要認證的測試（如果有 Token）
if ($Token) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "認證 API 測試" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    
    # 7. 我的封號
    if (Test-Endpoint -Name "我的封號" -Method "GET" -Path "/api/titles/my?user_id=test") { $passed++ } else { $failed++ }
    
    # 8. 通知列表
    if (Test-Endpoint -Name "通知列表" -Method "GET" -Path "/api/notifications") { $passed++ } else { $failed++ }
    
    # 9. 夥伴列表
    if (Test-Endpoint -Name "夥伴列表" -Method "GET" -Path "/api/companions?user_id=test") { $passed++ } else { $failed++ }
    
    # 10. 投票列表
    if (Test-Endpoint -Name "投票列表" -Method "GET" -Path "/api/votes") { $passed++ } else { $failed++ }
    
    # 11. 貢獻統計
    if (Test-Endpoint -Name "貢獻統計" -Method "GET" -Path "/api/contributions?user_id=test") { $passed++ } else { $failed++ }
    
    # 12. 排行榜
    if (Test-Endpoint -Name "貢獻排行榜" -Method "GET" -Path "/api/contributions?leaderboard=true") { $passed++ } else { $failed++ }
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "測試結果" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "通過: $passed" -ForegroundColor Green
Write-Host "失敗: $failed" -ForegroundColor Red
Write-Host "總計: $($passed + $failed)" -ForegroundColor White

if ($failed -eq 0) {
    Write-Host "`n✅ 所有測試通過！" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n⚠️ 有測試失敗" -ForegroundColor Yellow
    exit 1
}
