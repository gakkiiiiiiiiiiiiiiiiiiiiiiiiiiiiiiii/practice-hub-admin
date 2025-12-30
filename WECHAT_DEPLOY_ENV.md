# 微信云托管环境变量配置说明

## 问题说明

如果发现生产环境中 `import.meta.env.VITE_API_BASE_URL` 的值不正确（例如显示 `/api` 而不是实际配置的值），这是因为：

**Vite 的环境变量必须在构建时注入，无法在运行时修改。**

## 解决方案

### 方式一：通过构建参数配置（推荐）

在微信云托管控制台配置**构建参数**（不是运行时环境变量）：

1. 进入服务管理页面
2. 找到"构建配置"或"构建参数"设置
3. 添加构建参数：
   ```
   VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
   ```
   注意：需要包含完整的 URL，包括协议（https://）和路径（/api）

### 方式二：通过环境变量文件配置

如果微信云托管支持在构建时读取环境变量文件，可以创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
```

## 验证方法

### 1. 检查构建日志（重要！）

**这些日志在构建阶段输出，需要在微信云托管控制台的"构建日志"中查看，不是在运行时日志中。**

查看步骤：
1. 进入微信云托管控制台
2. 选择对应的服务
3. 点击"构建记录"或"部署记录"
4. 查看最新的构建日志
5. 搜索 "Docker Build Environment" 或 "Vite Config"

构建时应该看到以下日志：

```
===========================================
🔍 Docker Build Environment Debug Info
===========================================
ARG VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
ENV VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
System env VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
Final VITE_API_BASE_URL=https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
===========================================
🔍 Vite Config - Environment Variables:
  process.env.VITE_API_BASE_URL: https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
  env.VITE_API_BASE_URL: https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
  Final apiBaseUrl: https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
```

**如果构建日志中没有这些信息，说明构建参数没有正确传入。**

### 2. 检查构建后的代码

构建完成后，检查 `dist` 目录中的 JS 文件，搜索 `VITE_API_BASE_URL`，应该能看到正确的值。

### 3. 检查运行时请求（运行时验证）

打开浏览器开发者工具：
1. 打开管理后台页面
2. 按 F12 打开开发者工具
3. 查看 Console 标签，应该能看到：
   ```
   🔗 API Base URL: https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api
   📦 import.meta.env: { VITE_API_BASE_URL: "https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api", ... }
   ```
4. 查看 Network 标签，确认请求的 baseURL 是否正确

**注意**：如果 Console 中显示的是 `/api` 而不是完整的 URL，说明构建时环境变量没有正确传入。

## 常见错误

### ❌ 错误：在运行时环境变量中配置

如果在"运行时环境变量"中配置了 `VITE_API_BASE_URL`，这个值**不会**被使用，因为：
- Vite 在构建时会将环境变量打包到静态文件中
- 运行时环境变量只在容器运行时可用，构建时不可用

### ✅ 正确：在构建参数中配置

必须在"构建参数"或"构建时环境变量"中配置，这样构建时才能读取到。

## 微信云托管配置步骤

1. **登录微信云托管控制台**
2. **选择对应的服务**
3. **进入"构建配置"或"部署配置"**
4. **找到"构建参数"或"Build Args"设置**
5. **添加构建参数**：
   - 参数名：`VITE_API_BASE_URL`
   - 参数值：`https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api`
6. **保存并重新部署**

## 注意事项

1. **URL 格式**：确保包含完整的 URL（协议 + 域名 + 路径）
   - ✅ 正确：`https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api`
   - ❌ 错误：`dayysptc.express-aug7.3150qyq2.q1w701n5.com/api`（缺少协议）
   - ❌ 错误：`dayysptc.express-aug7.3150qyq2.q1w701n5.com`（缺少路径）

2. **重新构建**：修改构建参数后，必须重新构建镜像才会生效

3. **调试**：如果仍然不生效，检查构建日志中的环境变量输出

## 相关文件

- `Dockerfile` - 构建配置
- `vite.config.ts` - Vite 配置，包含环境变量处理逻辑
- `src/utils/request.ts` - 使用环境变量的地方

