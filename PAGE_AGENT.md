# PageAgent 接入说明

[PageAgent](https://alibaba.github.io/page-agent/) 是阿里开源的「页面内 AI 助手」，用户用自然语言下指令，AI 在当前页面执行点击、填表等操作。

## 当前接入方式（CDN 试用）

- **入口**：布局右上角「AI 助手」按钮，点击尝试打开 Agent 面板。
- **脚本**：`index.html` 中通过 CDN 引入 `page-agent.demo.js`，使用官方提供的**免费测试 LLM**，仅限技术评估，使用即表示同意其 [条款](https://github.com/alibaba/page-agent/blob/main/docs/terms-and-privacy.md#2-testing-api-and-demo-disclaimer--terms-of-use)。

### CDN 地址

| 环境 | URL |
|------|-----|
| 全球 | `https://cdn.jsdelivr.net/npm/page-agent@1.5.9/dist/iife/page-agent.demo.js` |
| 国内 | `https://registry.npmmirror.com/page-agent/1.5.9/files/dist/iife/page-agent.demo.js` |

国内部署可把 `index.html` 中的 script `src` 换成上表国内镜像。

## 使用自有模型（NPM）

若需接入自己的 API Key 或内网模型：

```bash
cd admin-web && npm install page-agent
```

在入口或布局中初始化并挂载 UI（具体 API 以 [官方文档](https://alibaba.github.io/page-agent/docs/introduction/overview) 为准）：

```ts
import { PageAgent } from 'page-agent'

const agent = new PageAgent({
  model: 'qwen3.5-plus',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: import.meta.env.VITE_PAGE_AGENT_API_KEY,
  language: 'zh-CN',
})
// 挂载到 DOM 或调用 agent 的 UI 方法
```

注意：API Key 不要提交到仓库，使用 `.env` / `.env.local` 配置 `VITE_PAGE_AGENT_API_KEY`。

## 参考

- 官网与 Demo：<https://alibaba.github.io/page-agent/>
- 文档：<https://alibaba.github.io/page-agent/docs/introduction/overview>
- 仓库：<https://github.com/alibaba/page-agent>
