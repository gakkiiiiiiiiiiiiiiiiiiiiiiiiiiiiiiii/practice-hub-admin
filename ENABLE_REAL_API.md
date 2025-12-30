# 启用真实后端 API

## 问题说明

管理后台默认使用 Mock 数据，需要启用真实后端 API 才能将数据保存到数据库。

## 解决步骤

### 1. 创建 .env 文件

在 `admin-web` 目录下创建 `.env` 文件：

```bash
cd admin-web
echo "VITE_ENABLE_PROXY=true" > .env
```

### 2. 重启管理后台服务

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
npm run dev
```

### 3. 验证

- 打开浏览器开发者工具 -> Network
- 在管理后台操作（如创建分类）
- 查看网络请求，应该看到请求发送到 `http://localhost:3333/api/...`
- 如果看到请求发送到 `http://localhost:3000/api/...`，说明还在使用 Mock

### 4. 在管理后台创建数据

启用真实 API 后，在管理后台的"首页推荐管理"中：
1. 创建推荐版块（状态设置为"显示"）
2. 在版块中添加题库

数据会保存到真实数据库中，小程序端接口就能获取到数据了。

## 临时方案：直接插入测试数据

如果暂时无法启用真实 API，可以直接在数据库中插入测试数据：

```sql
-- 1. 先查看是否有题库数据
SELECT id, name FROM subject LIMIT 5;

-- 2. 插入推荐分类（status=1 表示显示）
INSERT INTO `home_recommend_category` (`name`, `sort`, `status`, `create_time`, `update_time`) VALUES
('热门公共课', 0, 1, NOW(), NOW()),
('专业课推荐', 1, 1, NOW(), NOW()),
('真题专区', 2, 1, NOW(), NOW());

-- 3. 插入推荐项（根据实际的 subject_id 调整）
-- 假设 subject 表中有 id 为 1, 2, 3 的题库
INSERT INTO `home_recommend_item` (`category_id`, `subject_id`, `sort`, `create_time`) VALUES
(1, 1, 0, NOW()),
(1, 2, 1, NOW()),
(2, 3, 0, NOW());

-- 4. 验证数据
SELECT 
    c.id, c.name, c.status,
    i.subject_id, s.name as subject_name
FROM home_recommend_category c
LEFT JOIN home_recommend_item i ON c.id = i.category_id
LEFT JOIN subject s ON i.subject_id = s.id
WHERE c.status = 1;
```

