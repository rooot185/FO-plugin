# 南京大学财务处 AI 助手 Chrome 扩展

一个为南京大学财务处开发的 AI 助手 Chrome 扩展，提供智能问答、历史会话管理和反馈功能。

## 项目特性

- 🎯 **智能问答** - 基于 AI 的财务相关问题解答
- 💬 **实时对话** - 支持流式响应的打字机效果
- 📚 **会话管理** - 历史对话记录查看和恢复
- ⭐ **反馈系统** - 点赞/点踩评价机制
- 🔐 **南大认证** - 集成南京大学统一身份认证
- 🎨 **美观界面** - 基于 Element Plus 的现代化 UI

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **UI 框架**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **浏览器扩展**: Chrome Extension Manifest V3

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建扩展
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── ChatMain.vue     # 主聊天界面
│   └── HistoryPage.vue  # 历史会话页面
├── stores/              # 状态管理
│   └── chat.js          # 聊天状态和 API 逻辑
├── main.ts              # 应用入口
└── App.vue              # 根组件

public/
├── manifest.json        # Chrome 扩展清单
└── background.js        # 后台脚本
```

## API 接口

### 聊天接口
- `POST /api/chat` - 发送消息并接收流式响应
- `POST /api/feedback` - 提交消息评价和反馈
- `GET /api/history/conversations` - 获取历史会话列表
- `GET /api/history/conversations/{id}` - 获取特定会话详情

## 配置

### 环境变量
创建 `.env` 文件：
```
VITE_API_BASE_URL=http://localhost:8080
```

## TODO 

1. 需要接入南大登陆认证，用户登陆以后需要给chat.js中的currentUser变量赋值，该值需要唯一

2. 后端/history api需要删除掉request中多余字段（ChatStreamRequest中history相关内容）

2. 需要处理一下跨域问题（测试的时候是放开了所有请求）