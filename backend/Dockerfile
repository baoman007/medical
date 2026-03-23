# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src ./src

# 生产阶段
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 从builder阶段复制
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

# 创建必要的目录
RUN mkdir -p logs uploads

# 设置环境
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "src/server.js"]
