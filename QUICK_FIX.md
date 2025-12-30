# 快速修复：启用真实后端 API

## 已完成的步骤

✅ 已创建 `.env` 文件，设置 `VITE_ENABLE_PROXY=true`

## 下一步操作

1. **重启管理后台服务**
   ```bash
   cd admin-web
   # 停止当前服务（按 Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

2. **验证是否连接到真实后端**
   - 打开浏览器开发者工具 -> Network
   - 在管理后台操作（如创建分类）
   - 查看网络请求，应该看到请求发送到 `http://localhost:3333/api/...`
   - 如果看到请求发送到 `http://localhost:3000/api/...`，说明还在使用 Mock

3. **在管理后台创建数据**
   - 打开"首页推荐管理"
   - 创建推荐版块（状态设置为"显示"）
   - 在版块中添加题库
   - 数据会保存到真实数据库中

4. **验证小程序端接口**
   ```bash
   curl http://localhost:3333/api/app/recommend/categories
   ```
   应该能看到数据了。

## 如果还是不行

如果重启后还是使用 Mock 数据，可以：
1. 检查 `.env` 文件内容：`cat admin-web/.env`
2. 确保后端服务正在运行：`curl http://localhost:3333/api/app/recommend/categories`
3. 清除浏览器缓存并重新加载页面

