# ECS Docker部署完整指南

## 一、前期准备

### 1. 登录ECS服务器
```bash
ssh root@your-ecs-ip
```

### 2. 安装Docker和Docker Compose（如果未安装）

#### 安装Docker
```bash
# 卸载旧版本（如果有）
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加Docker仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker CE
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

#### 安装Docker Compose
```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 配置阿里云镜像加速（可选，推荐）
```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 编辑daemon.json
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 二、部署应用

### 方式一：使用部署脚本（推荐）

```bash
# 1. 克隆代码
cd /root
git clone git@github.com:baoman007/medical.git
cd medical

# 2. 修改环境变量
cp .env.production .env
vim .env

# 3. 修改以下配置：
# MYSQL_ROOT_PASSWORD=your_strong_password
# DB_PASSWORD=your_db_password
# JWT_SECRET=your_jwt_secret
# OLLAMA_BASE_URL=http://host.docker.internal:11434  # 如果本地有Ollama

# 4. 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

#### 1. 克隆代码
```bash
cd /root
git clone git@github.com:baoman007/medical.git
cd medical
```

#### 2. 配置环境变量
```bash
cp .env.production .env
vim .env
```

**必须修改的配置**：
```env
# 数据库密码
MYSQL_ROOT_PASSWORD=YourStrongRootPassword123!
DB_PASSWORD=YourDBPassword123!

# JWT密钥
JWT_SECRET=YourJWTSecretKey12345678

# API地址
API_BASE_URL=http://your-ecs-ip:8080/api

# Ollama地址（如果使用本地Ollama）
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

**生成强密码**：
```bash
openssl rand -base64 32
```

#### 3. 构建并启动服务
```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## 三、初始化数据库

```bash
# 等待MySQL完全启动（约30秒）
sleep 30

# 初始化数据库和数据
docker-compose exec mysql mysql -uroot -p$MYSQL_ROOT_PASSWORD medical_ai < /app/database/schema.sql

# 运行初始化脚本
docker-compose exec backend node init.js
```

---

## 四、验证部署

### 1. 检查服务状态
```bash
docker-compose ps
```

**预期输出**：
```
NAME                STATUS              PORTS
medical_backend_1   Up (healthy)        0.0.0.0:8080->8080/tcp
medical_frontend_1  Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
medical_mysql_1    Up (healthy)        3306/tcp
medical_nginx_1    Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 2. 检查服务健康
```bash
# 后端健康检查
curl http://localhost:8080/api/health

# 前端访问
curl http://localhost
```

### 3. 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f nginx
```

---

## 五、常用管理命令

### 服务管理
```bash
# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷
docker-compose down -v
```

### 更新应用
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

### 数据库管理
```bash
# 进入MySQL容器
docker-compose exec mysql mysql -uroot -p

# 备份数据库
docker-compose exec mysql mysqldump -u medical_user -p medical_ai > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T mysql mysql -u medical_user -p medical_ai < backup.sql

# 查看数据库文件
docker-compose exec mysql ls -lh /var/lib/mysql/
```

### 清理空间
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune
```

---

## 六、配置防火墙

### 1. 开放端口（阿里云安全组）
需要在阿里云控制台配置安全组规则，开放以下端口：
- **80** (HTTP)
- **443** (HTTPS，如果需要)
- **8080** (后端API，可选，建议只通过Nginx访问)

### 2. ECS内部防火墙（firewalld）
```bash
# 检查防火墙状态
sudo firewall-cmd --state

# 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp

# 重载防火墙
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-ports
```

---

## 七、配置SSL证书（可选）

### 1. 使用Let's Encrypt免费证书

```bash
# 安装certbot
sudo yum install -y certbot python2-certbot-nginx

# 获取证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com

# 证书自动续期
sudo certbot renew --dry-run
```

### 2. 修改Nginx配置
```bash
# 编辑nginx配置
vim nginx/nginx.conf

# 修改为HTTPS
# server {
#     listen 443 ssl;
#     server_name your-domain.com;
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     ...
# }

# 重启Nginx
docker-compose restart nginx
```

---

## 八、故障排查

### 1. 服务启动失败
```bash
# 查看详细日志
docker-compose logs backend

# 查看容器状态
docker-compose ps

# 进入容器排查
docker-compose exec backend sh
```

### 2. 数据库连接失败
```bash
# 检查MySQL是否健康
docker-compose ps mysql

# 检查数据库日志
docker-compose logs mysql

# 验证数据库连接
docker-compose exec backend node -e "console.log('test')"
```

### 3. 端口被占用
```bash
# 查看端口占用
netstat -tunlp | grep :80
netstat -tunlp | grep :8080

# 杀掉占用进程
kill -9 <PID>
```

### 4. Ollama连接失败
如果使用本地Ollama，需要配置host.docker.internal：

```bash
# 修改.env
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Linux上需要手动添加host解析
sudo tee -a /etc/hosts <<-'EOF'
127.0.0.1 host.docker.internal
EOF
```

---

## 九、性能优化

### 1. 调整Docker资源限制
编辑 `docker-compose.yml`，添加资源限制：

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

### 2. 数据库优化
编辑 `docker-compose.yml`，调整MySQL配置：

```yaml
services:
  mysql:
    command: --default-authentication-plugin=mysql_native_password
               --character-set-server=utf8mb4
               --collation-server=utf8mb4_unicode_ci
               --max-connections=500
               --innodb-buffer-pool-size=512M
```

### 3. 启用Nginx缓存
编辑 `nginx/nginx.conf`，添加缓存配置：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

server {
    location / {
        proxy_cache my_cache;
        proxy_cache_valid 200 10m;
        ...
    }
}
```

---

## 十、监控与日志

### 1. 实时监控
```bash
# 实时查看资源使用
docker stats

# 查看容器日志
docker-compose logs -f --tail=100
```

### 2. 日志管理
```bash
# 配置日志轮转
# 编辑 /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启Docker
sudo systemctl restart docker
```

---

## 快速启动命令总结

```bash
# 一键部署
cd /root/medical
./deploy.sh

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 完全清理
docker-compose down -v
```

---

## 访问地址

- **前端**: http://your-ecs-ip
- **后端API**: http://your-ecs-ip:8080/api

## 技术支持

如有问题，请查看：
1. `docker-compose logs` 查看日志
2. `docker-compose ps` 查看服务状态
3. 项目文档：`README.md`, `DEPLOY.md`, `QUICK_START_ECS.md`
