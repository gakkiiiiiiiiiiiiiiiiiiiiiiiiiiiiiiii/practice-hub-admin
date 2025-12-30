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
# 注意：ARG 必须在使用之前声明
# 如果微信云托管通过构建参数传入，ARG 会接收该值
ARG VITE_API_BASE_URL

# 设置环境变量（用于构建时）
# 注意：Vite 的环境变量必须以 VITE_ 开头，且需要在构建时可用
# 优先使用 ARG 的值（构建参数），如果没有则使用默认值 /api
# 如果微信云托管在构建时设置了系统环境变量，需要在构建命令中通过 --build-arg 传入
ENV VITE_API_BASE_URL=https://express-aug7-210395-7-1392943725.sh.run.tcloudbase.com
ENV NODE_ENV=production
ENV VITE_ENABLE_PROXY=false

# 构建应用（生产环境）
# 跳过类型检查，直接构建（类型检查应在开发阶段完成）
# 使用 vite build 而不是 npm run build，避免 vue-tsc 在 Docker 环境中的兼容性问题
# ENV 设置的环境变量会被 vite.config.ts 中的 loadEnv 读取
# 打印环境变量用于调试
# 注意：这些日志会在构建日志中显示，需要在微信云托管控制台的"构建日志"中查看
RUN echo "===========================================" && \
    echo "🔍 Docker Build Environment Debug Info" && \
    echo "===========================================" && \
    echo "ARG VITE_API_BASE_URL=${VITE_API_BASE_URL:-'(not set)'}" && \
    echo "ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}" && \
    echo "System env VITE_API_BASE_URL=$(printenv VITE_API_BASE_URL || echo 'not set')" && \
    echo "Final VITE_API_BASE_URL=${VITE_API_BASE_URL}" && \
    echo "===========================================" && \
    npx vite build --mode production

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

