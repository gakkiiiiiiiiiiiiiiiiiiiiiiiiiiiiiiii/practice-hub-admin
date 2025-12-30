# 考研刷题小程序 - 后台管理系统

基于 Vue 3 + TypeScript + Ant Design Vue 开发的后台管理系统。

## 技术栈

- **前端框架**: Vue 3.x
- **开发语言**: TypeScript
- **UI 框架**: Ant Design Vue
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **构建工具**: Vite
- **网络请求**: Axios
- **富文本编辑器**: TinyMCE

## 功能模块

### 1. 登录与认证
- 用户名/密码登录
- 基于角色的权限控制（RBAC）
- Token 认证

### 2. 仪表盘
- **系统管理员视图**: 全局数据看板，包含用户增长、销售占比、代理商排名等
- **代理商视图**: 工作台，显示余额、激活码统计等

### 3. 题库管理
- **课程管理**: 课程的增删改查、上下架
- **章节管理**: 章节的增删改查，支持试读/VIP 标记
- **试题管理**: 
  - 题目的增删改查
  - 支持单选、多选、填空题
  - 富文本编辑器（支持 LaTeX 公式）
  - 批量导入（Excel/Word）

### 4. 代理商与激活码系统
- **激活码管理**:
  - 系统管理员：生成批次、查看所有激活码
  - 代理商：购买激活码、查看自己的激活码、导出未激活码
- **资金记录**: 充值、消费记录查询

### 5. 小程序用户管理
- 用户列表查看
- 用户详情（刷题统计、错题本）
- 封号/解封功能

### 6. 系统管理
- **账号管理**: 后台账号的增删改查
- **角色管理**: 角色定义及菜单权限分配
- **运营配置**:
  - 首页轮播图配置
  - 倒计时配置
  - AI 提示词配置

## 权限角色

系统预置三种角色：

1. **super_admin (系统管理员)**
   - 拥有所有菜单和按钮权限
   - 管理后台账号、分配权限、全局配置
   - 默认首页：`/dashboard/analysis`

2. **content_admin (题库管理员)**
   - 专注于内容的生产与维护
   - 管理课程、章节、试题录入、纠错处理
   - 默认首页：`/question/subject`

3. **agent (代理商)**
   - 商业化落地人员
   - 购买/生成激活码、分发激活码、查询激活状态
   - 默认首页：`/agent/dashboard`

## 项目结构

```
admin-web/
├── src/
│   ├── api/              # API 接口定义
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   ├── mock/             # Mock 数据
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── styles/           # 全局样式
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── dashboard/   # 仪表盘
│   │   ├── question/    # 题库管理
│   │   ├── agent/       # 代理商中心
│   │   ├── user/        # 小程序用户
│   │   ├── system/      # 系统管理
│   │   ├── login/       # 登录页
│   │   └── error/       # 错误页
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 安装与启动

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
cd admin-web
npm install
# 或
yarn install
```

### 开发环境启动

```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建产物在 `dist` 目录。

### 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

## Mock 数据

项目内置 Mock 数据，位于 `src/mock/` 目录。

### 测试账号

- **系统管理员**: `admin` / `123456`
- **题库管理员**: `content` / `123456`
- **代理商**: `agent` / `123456`

## 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 开发规范

### 代码规范

- 使用 ES6+ 语法
- 函数单一职责，超过 50 行考虑拆分
- 变量和函数命名语义化
- 复杂逻辑添加注释

### 组件规范

- 使用 `<script setup>` 语法
- 组件命名采用 PascalCase
- 样式使用 `scoped`

### API 规范

- 所有 API 请求统一使用 `src/utils/request.ts` 封装的 axios 实例
- API 接口定义统一放在 `src/api/` 目录
- 错误处理统一在响应拦截器中处理

## 部署

### 构建

```bash
npm run build
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name admin.example.com;
    root /path/to/admin-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 常见问题

### 1. 登录后跳转 404

检查路由配置和权限设置是否正确。

### 2. Mock 数据不生效

确保 `vite.config.ts` 中已配置 Mock 插件。

### 3. 富文本编辑器不显示

检查 TinyMCE 是否正确安装，并确认编辑器配置。

## 许可证

MIT

## 联系方式

如有问题，请联系开发团队。

