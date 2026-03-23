#!/bin/bash

echo "🚀 启动智慧医疗AI助手 - 后端服务"

# 进入后端目录
cd "$(dirname "$0")/backend" || exit 1

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告：.env文件不存在，请配置数据库密码"
fi

echo "🎯 启动服务..."
npm run dev
