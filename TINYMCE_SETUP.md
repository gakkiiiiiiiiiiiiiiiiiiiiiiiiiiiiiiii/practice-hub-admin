# TinyMCE 富文本编辑器配置说明

## 问题说明

TinyMCE 6.x 版本需要 API key 才能使用。如果看到 "A valid API key is required" 的警告，需要配置 API key。

## 解决方案

### 方案 1：使用 API Key（推荐用于生产环境）

1. **获取 API Key**
   - 访问 https://www.tiny.cloud/auth/signup/
   - 注册账号并获取免费的 API key

2. **配置环境变量**
   - 在项目根目录创建 `.env` 文件
   - 添加以下内容：
   ```env
   VITE_TINYMCE_API_KEY=your-api-key-here
   ```

3. **重启开发服务器**
   ```bash
   npm run dev
   ```

### 方案 2：降级到 TinyMCE 5.x（不需要 API Key）

如果不想使用 API key，可以降级到 TinyMCE 5.x 版本：

1. **卸载当前版本**
   ```bash
   npm uninstall tinymce @tinymce/tinymce-vue
   ```

2. **安装 5.x 版本**
   ```bash
   npm install tinymce@^5.10.9 @tinymce/tinymce-vue@^3.0.1
   ```

3. **导入样式文件**
   在 `src/main.ts` 中添加：
   ```typescript
   import 'tinymce/themes/silver/theme'
   import 'tinymce/skins/ui/oxide/skin.min.css'
   import 'tinymce/skins/content/default/content.min.css'
   ```

### 方案 3：使用其他富文本编辑器

如果不想使用 TinyMCE，可以考虑：

1. **Quill** - 轻量级，不需要 API key
   ```bash
   npm install quill vue-quill-editor
   ```

2. **CKEditor** - 功能强大，有免费版本
   ```bash
   npm install @ckeditor/ckeditor5-vue
   ```

## 当前配置

项目已配置支持 API key，只需在 `.env` 文件中设置 `VITE_TINYMCE_API_KEY` 即可。

如果暂时不想配置 API key，编辑器仍然可以使用，只是会显示警告提示。

