# 阿里云ECS快速部署指南

## 📋 部署清单

在开始部署前，请确保已完成以下准备工作：

- [ ] 阿里云ECS实例已创建（推荐配置：4核8GB）
- [ ] 安全组已开放端口（22, 80, 443）
- [ ] 本地已安装SSH客户端
- [ ] 项目代码已准备好

## 🚀 快速部署（5步完成）

### 第1步：上传代码到ECS

```bash
# 在本地执行，打包项目
cd /Users/baozhen/CodeBuddy/medical
tar -czf medical-app.tar.gz --exclude='node_modules' --exclude='.git' --exclude='logs' --exclude='uploads' .

# 上传到ECS（替换your-ecs-ip为您的ECS公网IP）
scp medical-app.tar.gz root@your-ecs-ip:/root/
```

### 第2步：连接到ECS

```bash
# SSH连接到ECS
ssh root@your-ecs-ip

# 解压文件
cd /root
tar -xzf medical-app.tar.gz
cd medical
```

### 第3步：配置环境变量

```bash
# 复制环境变量模板
cp .env.production .env

# 生成强密码
openssl rand -base64 32

# 编辑.env文件，修改以下内容：
vim .env
```

**必须修改的配置：**
```env
MYSQL_ROOT_PASSWORD=<生成的强密码>
DB_PASSWORD=<生成的强密码>
JWT_SECRET=<生成的强密码>
API_BASE_URL=http://your-ecs-ip:8080/api
```

### 第4步：一键部署

```bash
# 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动完成：
- ✅ 检查并安装Docker
- ✅ 检查并安装Docker Compose
- ✅ 安装Ollama
- ✅ 构建并启动所有服务
- ✅ 初始化数据库

### 第5步：验证部署

```bash
# 检查服务状态
docker-compose ps

# 检查后端API
curl http://localhost:8080/api/health

# 在浏览器访问前端
# http://your-ecs-ip
```

## 🔧 手动部署（可选）

如果自动部署脚本出现问题，可以手动部署：

### 1. 安装Docker和Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 安装Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
sleep 3
ollama pull qwen2.5
```

### 3. 启动服务

```bash
# 配置好.env后
docker-compose up -d --build
```

### 4. 初始化数据库

```bash
docker-compose exec backend node init.js
```

## 📊 服务架构

```
┌─────────────────────────────────────────────┐
│           阿里云ECS                        │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Nginx (80, 443)                  │   │
│  │  ┌────────────────────────────┐    │   │
│  │  │  前端静态文件              │    │   │
│  │  │  API代理                   │    │   │
│  │  └────────────────────────────┘    │   │
│  └──────────────────────────────────────┘   │
│            ↓                                │
│  ┌──────────────────────────────────────┐   │
│  │  Backend (8080)                     │   │
│  │  - Express.js                       │   │
│  │  - MySQL连接                        │   │
│  │  - Ollama调用                       │   │
│  └──────────────────────────────────────┘   │
│            ↓            ↓                  │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ MySQL (3306) │  │ Ollama(11434)│       │
│  └──────────────┘  └──────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔐 安全配置

### 配置SSL证书（推荐）

```bash
# 安装certbot
apt-get update
apt-get install certbot

# 获取证书（替换your-domain.com为您的域名）
certbot certonly --standalone -d your-domain.com

# 复制证书
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 修改nginx.conf启用HTTPS
vim nginx/nginx.conf
```

### 配置防火墙

```bash
# Ubuntu
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# CentOS
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

## 📝 常用运维命令

### 服务管理

```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 停止所有服务
docker-compose stop

# 启动所有服务
docker-compose start
```

### 数据库管理

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u medical_user -p medical_ai > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u medical_user -p medical_ai < backup.sql

# 进入MySQL
docker-compose exec mysql mysql -u medical_user -p medical_ai
```

### 日志查看

```bash
# 查看后端日志
docker-compose logs -f backend

# 查看最近100行日志
docker-compose logs --tail=100 backend

# 查看所有日志
docker-compose logs
```

## 🐛 故障排查

### 问题1: 容器无法启动

```bash
# 查看容器日志
docker-compose logs backend

# 检查端口占用
netstat -tunlp | grep :8080

# 重新构建
docker-compose up -d --build
```

### 问题2: 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 测试数据库连接
docker-compose exec mysql mysql -u medical_user -p medical_ai
```

### 问题3: Ollama连接失败

```bash
# 检查Ollama服务
curl http://localhost:11434/api/tags

# 检查Docker网络
docker network inspect medical-network

# 修改.env中的OLLAMA_BASE_URL
```

### 问题4: 前端无法访问后端

检查 `nginx.conf` 中的API代理配置。

## 💡 性能优化

### 1. 配置MySQL参数

创建 `mysql.cnf`:

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
```

在 `docker-compose.yml` 中挂载:

```yaml
volumes:
  - ./mysql.cnf:/etc/mysql/conf.d/custom.cnf:ro
```

### 2. 使用CDN加速

将静态文件上传到阿里云OSS，配置CDN加速。

### 3. 开启Gzip压缩

已在 `nginx.conf` 中配置。

## 📦 备份策略

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR=/root/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u medical_user -p medical_ai > $BACKUP_DIR/db_$DATE.sql

# 清理7天前的备份
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

添加到crontab:

```bash
crontab -e

# 每天凌晨2点备份
0 2 * * * /root/medical/backup.sh
```

## 📞 技术支持

如遇到问题，请查看：

1. Docker日志：`docker-compose logs`
2. 应用日志：`./backend/logs/`
3. 详细文档：`DEPLOY.md`

## 🎉 部署完成

部署完成后，您可以通过以下地址访问：

- **前端**: `http://your-ecs-ip`
- **后端API**: `http://your-ecs-ip:8080/api`

记得修改 `frontend/src/services/api.js` 中的API地址为您的ECS IP！
