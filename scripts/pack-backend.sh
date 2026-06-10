#!/bin/bash
# 打包可独立部署的后端为 backend.zip（上传到腾讯云 SCF Web 函数 / 阿里云 FC）。
# zip 内结构（包根）：
#   scf_bootstrap        SCF 启动文件（可执行）
#   package.json         最小 package.json（type:module，无依赖）
#   server/index.mjs     HTTP 服务（CORS + 路由）
#   api/**               两个 handler + _lib + rag/chunks.json
set -e
cd "$(dirname "$0")/.."
OUT=backend.zip
rm -rf .backend_build "$OUT"
mkdir -p .backend_build/server

cp -R api .backend_build/api
rm -f .backend_build/api/README.md
rm -f .backend_build/api/_lib/*.test.js   # 测试文件无需进部署包
cp server/index.mjs .backend_build/server/index.mjs
cp server/package.backend.json .backend_build/package.json
cp server/scf_bootstrap .backend_build/scf_bootstrap
chmod +x .backend_build/scf_bootstrap

( cd .backend_build && zip -r -q -X "../$OUT" . -x '*.DS_Store' )
rm -rf .backend_build
echo "✅ 已生成 $OUT"
unzip -l "$OUT"
