#!/bin/bash

# =====================================================
# 智慧医疗AI助手 - 一键部署脚本
# =====================================================

set -e

echo "🚀 智慧医疗AI助手 - 阿里云ECS一键部署"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker
echo -e "${YELLOW}检查Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker未安装，正在安装...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker已安装${NC}"
fi

# 检查Docker Compose
echo -e "${YELLOW}检查Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose未安装，正在安装...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker Compose已安装${NC}"
fi

# 检查.env文件
echo -e "${YELLOW}检查环境变量配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}.env文件不存在${NC}"
    echo "请复制.env.production为.env并修改配置："
    echo "  cp .env.production .env"
    echo "  vim .env"
    exit 1
fi

echo -e "${GREEN}✅ 环境配置文件存在${NC}"

# 检查Ollama
echo -e "${YELLOW}检查Ollama服务...${NC}"
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${RED}Ollama服务未运行${NC}"
    echo -e "${YELLOW}是否安装Ollama？(y/n)${NC}"
    read -r install_ollama

    if [ "$install_ollama" = "y" ]; then
        echo -e "${YELLOW}安装Ollama...${NC}"
        curl -fsSL https://ollama.ai/install.sh | sh

        echo -e "${YELLOW}下载医疗模型（可能需要较长时间）...${NC}"
        ollama pull qwen2.5

        echo -e "${YELLOW}启动Ollama服务...${NC}"
        ollama serve &
        sleep 5

        echo -e "${GREEN}✅ Ollama安装完成${NC}"
    else
        echo -e "${YELLOW}请手动安装Ollama：${NC}"
        echo "  curl -fsSL https://ollama.ai/install.sh | sh"
        echo "  ollama serve &"
    fi
else
    echo -e "${GREEN}✅ Ollama服务已运行${NC}"
fi

# 停止旧容器
echo -e "${YELLOW}停止旧容器...${NC}"
docker-compose down 2>/dev/null || true

# 构建并启动服务
echo -e "${YELLOW}构建并启动服务...${NC}"
docker-compose up -d --build

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker-compose ps

# 初始化数据库
echo -e "${YELLOW}是否初始化数据库？(y/n)${NC}"
read -r init_db

if [ "$init_db" = "y" ]; then
    echo -e "${YELLOW}初始化数据库...${NC}"
    docker-compose exec -T backend node init.js
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
fi

# 显示访问信息
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}访问地址：${NC}"
echo -e "  前端: http://$(curl -s ifconfig.me):80"
echo -e "  后端API: http://$(curl -s ifconfig.me):8080/api"
echo -e "${YELLOW}常用命令：${NC}"
echo -e "  查看日志: docker-compose logs -f"
echo -e "  重启服务: docker-compose restart"
echo -e "  停止服务: docker-compose stop"
echo -e "  删除容器: docker-compose down"
echo -e "${YELLOW}详细文档：${NC} DEPLOY.md"
