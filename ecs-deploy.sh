#!/bin/bash

# 医疗AI项目 - ECS一键部署脚本

set -e  # 遇到错误立即退出

echo "================================"
echo "开始部署医疗AI项目"
echo "================================"

# 1. 配置Docker镜像加速
echo ">>> 配置Docker镜像加速..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live"
  ]
}
EOF

# 2. 重启Docker
echo ">>> 重启Docker服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. 检查Docker是否正常运行
echo ">>> 检查Docker状态..."
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker未正常运行，请检查安装"
    exit 1
fi

# 4. 拉取基础镜像
echo ">>> 拉取Docker镜像..."
docker pull node:18-alpine &
docker pull nginx:alpine &
docker pull mysql:8.0 &
wait

echo ">>> 镜像拉取完成"

# 5. 停止旧容器
echo ">>> 停止旧容器..."
docker-compose down 2>/dev/null || true

# 6. 构建并启动服务
echo ">>> 构建并启动服务..."
docker-compose up -d --build

# 7. 等待服务启动
echo ">>> 等待服务启动..."
sleep 30

# 8. 查看服务状态
echo ">>> 查看服务状态..."
docker-compose ps

# 9. 显示访问地址
echo ""
echo "================================"
echo "部署完成！"
echo "================================"
echo "前端访问: http://$(hostname -I | awk '{print $1}')"
echo "后端API: http://$(hostname -I | awk '{print $1}'):8080/api"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose stop"
echo "重启服务: docker-compose restart"
echo "================================"
