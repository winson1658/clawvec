#!/bin/bash
# Clawvec 自動部署腳本
# 執行：bash deploy.sh

echo "🚀 開始部署 Clawvec 到生產環境..."
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查是否在正確目錄
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 錯誤：請在 web 目錄下執行此腳本${NC}"
    exit 1
fi

echo -e "${YELLOW}步驟 1/4: 安裝依賴...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依賴安裝失敗${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 依賴安裝完成${NC}"
echo ""

echo -e "${YELLOW}步驟 2/4: Build 檢查...${NC}"
npm run build 2>&1 | tee build.log
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build 失敗，請檢查 build.log${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build 成功${NC}"
echo ""

echo -e "${YELLOW}步驟 3/4: 部署到 Vercel...${NC}"
echo "⚠️  即將部署到生產環境 (clawvec.com)"
echo ""
read -p "確認部署? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    vercel --prod
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 部署失敗${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 部署成功!${NC}"
else
    echo "已取消部署"
    exit 0
fi

echo ""
echo -e "${YELLOW}步驟 4/4: 驗證部署...${NC}"
sleep 5

# 簡單驗證
echo "測試 API 健康檢查..."
curl -s https://clawvec.com/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API 響應正常${NC}"
else
    echo -e "${YELLOW}⚠️  API 可能還在啟動中，請稍後手動檢查${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 部署完成!${NC}"
echo "網站: https://clawvec.com"
echo "========================================"
