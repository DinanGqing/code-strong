#!/bin/bash
# ============================================
# 码坚强 iOS 构建 + 签名打包脚本
# 运行环境：macOS + Xcode + Node.js
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
XCODE_PROJ="$SCRIPT_DIR/App/App.xcodeproj"
SCHEME="App"
EXPORT_OPTIONS="$SCRIPT_DIR/ExportOptions.plist"
ARCHIVE_PATH="$SCRIPT_DIR/build/App.xcarchive"
IPA_OUTPUT="$SCRIPT_DIR/build"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  码坚强 iOS 构建 + 签名打包${NC}"
echo -e "${GREEN}========================================${NC}"

# ── 1. 检查环境 ─────────────────────
echo -e "\n${YELLOW}[1/5] 检查构建环境...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：未找到 Node.js，请先安装${NC}"
    exit 1
fi

if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}错误：未找到 Xcode，请先安装${NC}"
    exit 1
fi

XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo -e "  ✓ Node.js $(node -v)"
echo -e "  ✓ $XCODE_VERSION"

# ── 2. 构建前端 ─────────────────────
echo -e "\n${YELLOW}[2/5] 构建前端资源...${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "  ✓ 前端构建完成"

# ── 3. 同步到 iOS ──────────────────
echo -e "\n${YELLOW}[3/5] 同步资源到 iOS 平台...${NC}"
npx cap sync ios
echo -e "  ✓ iOS 同步完成"

# ── 4. Archive ─────────────────────
echo -e "\n${YELLOW}[4/5] Xcode Archive（编译 + 签名）...${NC}"

# 检查 ExportOptions.plist 是否配置了 Team ID
if grep -q "YOUR_TEAM_ID_HERE" "$EXPORT_OPTIONS"; then
    echo -e "${RED}错误：ExportOptions.plist 中的 teamID 尚未配置！${NC}"
    echo -e "请编辑 $EXPORT_OPTIONS 填入你的 Apple Developer Team ID"
    echo -e "Team ID 可在 https://developer.apple.com/account 查看"
    exit 1
fi

# 清理旧的 Archive
rm -rf "$ARCHIVE_PATH"

xcodebuild archive \
    -project "$XCODE_PROJ" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates \
    | xcpretty || xcodebuild archive \
    -project "$XCODE_PROJ" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates

echo -e "  ✓ Archive 完成"

# ── 5. 导出 IPA ────────────────────
echo -e "\n${YELLOW}[5/5] 导出 IPA...${NC}"

rm -rf "$IPA_OUTPUT/App.ipa"

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$IPA_OUTPUT" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates \
    | xcpretty || xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$IPA_OUTPUT" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  IPA 已生成！${NC}"
echo -e "${GREEN}  路径：$IPA_OUTPUT/App.ipa${NC}"
echo -e "${GREEN}========================================${NC}"

# 显示 IPA 信息
if [ -f "$IPA_OUTPUT/App.ipa" ]; then
    echo -e "\nIPA 文件大小：$(du -sh "$IPA_OUTPUT/App.ipa" | cut -f1)"
fi
