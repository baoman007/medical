# 阿里云ECS部署指南

## 部署架构

```
阿里云ECS
├── MySQL (3306)
├── Backend API (8080)
├── Frontend (80)
├── Nginx (443, 8081)
└── Ollama (11434) - 需单独安装
```

## 前提条件

### 1. ECS服务器配置要求

- **CPU**: 4核及以上
- **内存**: 8GB及以上
- **系统**: Ubuntu 20.04 / CentOS 7+
- **磁盘**: 50GB及以上

### 2. 阿里云安全组配置

需要开放以下端口：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 8080 | TCP | 后端API（可选，内网访问） |
| 3306 | TCP | MySQL（可选，内网访问） |

### 3. 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## 部署步骤

### 步骤1: 准备代码

```bash
# 在本地打包项目
cd /Users/baozhen/CodeBuddy/medical
tar -czf medical-app.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  --exclude='uploads' \
  .

# 上传到ECS
scp medical-app.tar.gz root@your-ecs-ip:/root/
```

### 步骤2: 在ECS上解压和配置

```bash
# SSH连接到ECS
ssh root@your-ecs-ip

# 解压文件
cd /root
tar -xzf medical-app.tar.gz
cd medical

# 修改环境变量配置
cp .env.production .env

# 编辑.env文件，修改以下配置：
# - MYSQL_ROOT_PASSWORD（强密码）
# - DB_PASSWORD（强密码）
# - JWT_SECRET（强密码）
# - API_BASE_URL（改为ECS的公网IP）
# - OLLAMA_BASE_URL（如果Ollama在同一台ECS，保持默认；否则改为Ollama服务器IP）
vim .env
```

**重要：生成强密码**

```bash
# 生成32位随机密码
openssl rand -base64 32
```

### 步骤3: 安装Ollama和下载模型

```bash
# 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 启动Ollama服务
ollama serve &

# 下载医疗模型（可选，如果需要）
ollama pull medical-v1
ollama pull qwen2.5

# 验证Ollama服务
curl http://localhost:11434/api/tags
```

### 步骤4: 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mysql
```

### 步骤5: 初始化数据库

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行初始化脚本
node init.js

# 退出容器
exit
```

### 步骤6: 验证部署

```bash
# 检查MySQL
docker-compose exec mysql mysql -u medical_user -p medical_ai -e "SHOW TABLES;"

# 检查后端API
curl http://localhost:8080/api/health

# 检查前端
curl http://localhost

# 测试AI接口
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"message":"我头疼怎么办？"}'
```

## 常用运维命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据
docker-compose down -v
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# 实时查看日志
docker-compose logs -f backend
docker-compose logs -f --tail=100 backend
```

### 数据库管理

```bash
# 进入MySQL容器
docker-compose exec mysql mysql -u medical_user -p medical_ai

# 备份数据库
docker-compose exec mysql mysqldump -u medical_user -p medical_ai > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u medical_user -p medical_ai < backup.sql
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像
docker image prune -a
```

## 性能优化

### 1. 配置MySQL参数

创建 `mysql.cnf` 配置文件：

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
```

在 `docker-compose.yml` 中挂载：

```yaml
volumes:
  - ./mysql.cnf:/etc/mysql/conf.d/custom.cnf:ro
```

### 2. 配置Nginx缓存

已在 `nginx.conf` 中启用Gzip压缩和静态资源缓存。

### 3. 使用CDN加速

建议将静态文件上传到阿里云OSS，并配置CDN。

## 安全加固

### 1. 配置防火墙

```bash
# Ubuntu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 2. 配置SSL证书

使用Let's Encrypt免费证书：

```bash
# 安装certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 复制到nginx目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/key.pem

# 修改nginx.conf启用HTTPS
# 取消注释HTTPS配置部分
```

### 3. 限制Docker资源

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 监控和告警

### 1. 安装监控工具

```bash
# 安装htop
sudo apt-get install htop

# 安装iotop
sudo apt-get install iotop

# 安装nethogs
sudo apt-get install nethogs
```

### 2. Docker监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a
```

### 3. 日志管理

```bash
# 配置日志轮转
sudo vim /etc/logrotate.d/docker-compose

# 内容：
/var/log/medical/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## 故障排查

### 问题1: 容器无法启动

```bash
# 查看容器日志
docker-compose logs backend

# 检查端口占用
sudo netstat -tunlp | grep :8080

# 检查磁盘空间
df -h
```

### 问题2: 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 进入MySQL容器
docker-compose exec mysql bash

# 测试连接
mysql -u medical_user -p medical_ai
```

### 问题3: Ollama连接失败

```bash
# 检查Ollama服务
curl http://localhost:11434/api/tags

# 检查Docker网络
docker network inspect medical-network

# 如果Ollama不在Docker网络中，修改.env:
# OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### 问题4: 前端无法访问后端

检查 `nginx.conf` 中的API代理配置是否正确。

## 备份策略

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR=/root/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u medical_user -p${DB_PASSWORD} medical_ai > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# 清理7天前的备份
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

添加到crontab：

```bash
crontab -e

# 每天凌晨2点备份
0 2 * * * /root/medical/backup.sh
```

## 成本优化

### 1. 使用阿里云抢占式实例

如果业务允许中断，可以使用抢占式实例节省成本。

### 2. 使用OSS存储

将文件上传到阿里云OSS，减少ECS存储压力。

### 3. 使用SLB负载均衡

如果需要高可用，可以使用阿里云SLB。

## 扩展阅读

- [Docker Compose官方文档](https://docs.docker.com/compose/)
- [阿里云ECS文档](https://help.aliyun.com/product/25365.html)
- [Nginx配置指南](https://nginx.org/en/docs/)

## 联系支持

如有问题，请查看：
1. Docker日志：`docker-compose logs`
2. 应用日志：`./backend/logs/`
3. MySQL日志：`docker-compose logs mysql`
