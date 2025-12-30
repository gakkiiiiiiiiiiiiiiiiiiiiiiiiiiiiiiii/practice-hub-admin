# ============================================
# 微信云托管 - 管理后台 Dockerfile
# ============================================
# 使用 Nginx 提供静态文件服务

# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件（利用 Docker 缓存层）
COPY package*.json ./

# 安装依赖
RUN npm ci --legacy-peer-deps

# 复制源代码
COPY . .

# 构建参数：API 基础地址（可通过 --build-arg 传入）
ARG VITE_API_BASE_URL=/api

# 设置环境变量（用于构建时）
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NODE_ENV=production
ENV VITE_ENABLE_PROXY=false

# 构建应用（生产环境）
# 跳过类型检查，直接构建（类型检查应在开发阶段完成）
# 使用 vite build 而不是 npm run build，避免 vue-tsc 在 Docker 环境中的兼容性问题
RUN npx vite build --mode production

# 生产阶段 - 使用 Nginx 提供静态文件服务
FROM nginx:alpine AS production

# 复制构建产物到 Nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口（微信云托管会自动映射）
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

