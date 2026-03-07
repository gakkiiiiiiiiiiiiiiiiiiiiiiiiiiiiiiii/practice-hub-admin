# Nginx 代理配置说明

## 配置概述

管理后台使用 Nginx 作为反向代理，将 `/api` 请求转发到后端 API 服务。

## 工作原理

1. **前端请求**：前端使用相对路径 `/api` 作为 baseURL
2. **Nginx 代理**：Nginx 拦截 `/api` 请求，转发到后端服务
3. **后端处理**：后端接收请求并返回响应

## 请求流程

```
前端请求: /api/users
    ↓
Nginx 代理: https://dayysptc.express-aug7.3150qyq2.q1w701n5.com/api/users
    ↓
后端处理: /api/users (后端已设置全局前缀 'api')
    ↓
返回响应
```

## 配置说明

### Nginx 配置 (`nginx.conf`)

```nginx
location /api {
    proxy_pass https://dayysptc.express-aug7.3150qyq2.q1w701n5.com;

    # 大文件上传必须设置，否则超过 1MB 会返回 413 Request Entity Too Large（如 JSON 导入-上传 PDF）
    client_max_body_size 100m;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    # 大文件上传与长任务需更长超时
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    proxy_buffering off;
    proxy_request_buffering off;
}
```

### 前端配置

前端使用默认的 `/api` 作为 baseURL，不需要在构建时配置环境变量：

```typescript
// src/utils/request.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

## 优势

1. **无需构建时配置**：前端始终使用 `/api`，不需要在构建时传入环境变量
2. **灵活配置**：可以通过修改 Nginx 配置动态更改后端地址，无需重新构建
3. **统一管理**：所有 API 请求都通过 Nginx 代理，便于统一管理和监控

## 修改后端地址

如果需要修改后端 API 地址，只需修改 `nginx.conf` 中的 `proxy_pass` 值：

```nginx
proxy_pass https://new-backend-domain.com;
```

然后重新构建和部署镜像即可。

## 验证方法

**说明**：Nginx 运行在**部署环境**（如 Docker 容器或服务器），不在本机。下面的命令需在**运行 Nginx 的那台机器/容器内**执行，本机没有安装 nginx 时会报 `command not found`，属正常。

1. **检查 Nginx 配置**：
   ```bash
   # 在容器内或服务器上执行
   nginx -t
   ```

2. **重载 Nginx**（修改配置后）：
   ```bash
   # 在容器内：docker exec <容器名> nginx -s reload
   # 或直接重启容器：docker restart <容器名>
   nginx -s reload
   ```

3. **测试代理**：
   ```bash
   # 在容器内测试
   curl http://localhost/api
   ```

4. **浏览器验证**：
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 确认请求路径为 `/api/xxx`
   - 确认请求成功

## 注意事项

1. **后端地址格式**：`proxy_pass` 后面不要包含 `/api` 路径，Nginx 会自动追加
2. **HTTPS 支持**：如果后端使用 HTTPS，确保 Nginx 支持 SSL 证书验证
3. **超时设置**：根据实际需求调整超时时间
4. **CORS**：CORS 由后端处理，不需要在 Nginx 中配置

## 故障排查

### 问题：代理返回 502 Bad Gateway

**可能原因**：
- 后端服务未启动
- 后端地址配置错误
- 网络连接问题

**解决方法**：
1. 检查后端服务状态
2. 验证后端地址是否正确
3. 检查网络连接

### 问题：代理返回 404 Not Found

**可能原因**：
- 后端路径不匹配
- 后端未设置全局前缀

**解决方法**：
1. 确认后端设置了全局前缀 `api`
2. 检查请求路径是否正确

### 问题：代理超时

**可能原因**：
- 后端响应时间过长
- 超时设置过短

**解决方法**：
1. 增加超时时间
2. 优化后端性能

### 问题：上传大文件返回 413 Request Entity Too Large

**原因**：Nginx 默认 `client_max_body_size` 为 **1MB**，请求体超过即直接返回 413，请求不会到达后端。

**解决方法**：
1. 在 `location /api` 内增加：`client_max_body_size 100m;`（与上面示例一致）
2. 重载 Nginx：`nginx -s reload` 或重启容器
3. 若使用微信云托管等云网关，413 可能来自**接入层限制**（约 20MB），需在控制台查找「请求体/上传大小」配置或参考后端 `WECHAT_CLOUDBASE_BODY_SIZE.md`

