# 后端 API 接口文档

本文档定义了AI侧边栏扩展程序与后端服务交互的API接口。所有接口的Content-Type均为 `application/json`。

## 1. 聊天接口

此接口用于接收用户的消息，并以流式响应返回AI的回答。推荐使用 Server-Sent Events (SSE) 来实现流式传输。

**Endpoint:** `/api/chat`

**Method:** `POST`

### 请求体 (Request Body)

请求体应包含当前用户发送的消息以及最近的对话历史，用于提供上下文。

```json
{
  "prompt": "你好，我想咨询一下最新的财务报销政策。",
  "history": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "您好，我是财务处AI助手，有什么可以帮助您的吗？"
    }
  ]
}
```

- `prompt` (string, **required**): 用户当前输入的消息。
- `history` (array of objects, optional): 历史对话记录。
  - `role` (string): 角色，`user` 或 `assistant`。
  - `content` (string): 消息内容。

### 响应 (Response - SSE Stream)

响应应为`text/event-stream`类型，持续推送事件。每个事件都是一个JSON对象，包含了回答文本的一部分。

**流式事件示例:** 

```
data: {"chunk": "关于最新的财务报销政策，"}

data: {"chunk": "我们有以下几点更新："}

data: {"chunk": "\n1. ..."}

data: {"chunk": "\n2. ..."}

data: {"event": "done"}
```

- `data`: 每个`data`事件代表AI回答的一部分文本(`chunk`)。
- `event: "done"`: 当回答全部发送完毕时，发送一个结束事件，告知客户端关闭连接。

---

## 2. 对话评级与反馈接口

此接口用于收集用户对某次AI回答的满意度评级（赞或踩）以及具体的反馈意见。

**Endpoint:** `/api/feedback`

**Method:** `POST`

### 请求体 (Request Body)

请求体根据用户操作分为两种情况：

**情况一：用户点“赞” (Upvote)**

```json
{
  "rating": "up"
}
```

- `rating` (string, **required**): 评级结果，固定为 `'up'`。

**情况二：用户点“踩”并提交反馈 (Downvote with feedback)**

```json
{
  "rating": "down",
  "feedbackText": "这个回答没有解决我的问题，信息太模糊了。",
  "history": [
     { "id": 1, "text": "你好", "sender": "user" },
     { "id": 2, "text": "您好，我是财务处AI助手...", "sender": "bot" },
     { "id": 3, "text": "最新的财务报销政策是什么？", "sender": "user"},
     { "id": 4, "text": "关于最新的财务报销政策...", "sender": "bot"}
  ]
}
```

- `rating` (string, **required**): 评级结果，固定为 `'down'`。
- `feedbackText` (string, **required**): 用户输入的具体反馈内容。
- `history` (array of objects, **required**): 触发本次反馈的完整对话历史，用于问题溯源。
  - `id` (number): 消息ID。
  - `text` (string): 消息文本。
  - `sender` (string): 发送者，`user` 或 `bot`。


### 响应 (Response)

**成功响应 (200 OK):**

```json
{
  "status": "success",
  "message": "Feedback received successfully."
}
```

**失败响应 (e.g., 400 Bad Request):**

```json
{
  "status": "error",
  "message": "Invalid request body. 'rating' is required."
}
```
