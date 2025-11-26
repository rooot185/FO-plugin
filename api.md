# 后端 API 接口文档

本文档为财务处 AI 助手插件的后端接口提供了详细的规范，以确保前后端顺利对接。

## 1. 聊天接口 (`/api/chat`)

该接口负责接收用户的提问和对话历史，并以流式响应的方式返回 AI 的回答。

- **URL**: `/api/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`

### 请求体 (Request Body)

请求体是一个 JSON 对象，包含以下字段：

| 字段名    | 类型           | 描述                                       | 示例                                                               |
| --------- | -------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `prompt`  | `string`       | 用户当前发送的最新问题。                   | `"你好，请问最新的报销政策是什么？"`                               | 
| `history` | `Array<Object>`| 截止到当前问题之前的对话历史，用于提供上下文。 | `[{"role": "user", "content": "去年的报销标准是什么？"}, {"role": "assistant", "content": "去年的标准是..."}]` | 

`history` 数组中每个对象的结构如下：

| 字段名    | 类型     | 描述                               | 
| --------- | -------- | ---------------------------------- | 
| `role`    | `string` | 消息发送者的角色，`'user'` 或 `'assistant'`。 | 
| `content` | `string` | 消息的具体文本内容。               | 

**请求示例:** 
```json
{
  "prompt": "今年的差旅补贴标准是多少？",
  "history": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好，我是财务处AI助手，有什么可以帮助您的吗？"
    }
  ]
}
```

### 响应 (Response)

后端需要以 **Server-Sent Events (SSE)** 的方式进行流式响应，以实现打字机效果。

- **Content-Type**: `text/event-stream`

每个事件都应遵循 `data: <JSON_STRING>\n\n` 的格式。

1.  **数据块 (Chunk)**: 在生成回答的过程中，后端应持续发送包含部分文本的 JSON 对象。
    ```
    data: {"chunk": "今年的"}\n\n
    data: {"chunk": "差旅补"}\n\n
    data: {"chunk": "贴标准"}\n\n
    data: {"chunk": "是..."}\n\n
    ```

2.  **结束信号 (Done Signal)**: 当回答全部发送完毕后，必须发送一个包含 `event: "done"` 的特殊事件来通知前端停止接收。
    ```
    data: {"event": "done"}\n\n
    ```

## 2. 反馈接口 (`/api/feedback`)

该接口用于接收用户对某条 AI 回答的评价（点赞或点踩），以及具体的反馈意见。

- **URL**: `/api/feedback`
- **Method**: `POST`
- **Content-Type**: `application/json`

### 请求体 (Request Body)

请求体是一个 JSON 对象，包含以下字段：

| 字段名         | 类型     | 描述                                                       | 示例                                     |
| -------------- | -------- | ---------------------------------------------------------- | ---------------------------------------- |
| `rating`       | `string` | 评价类型，`'up'` 代表点赞，`'down'` 代表点踩。             | `"down"`                                 |
| `botReply`     | `string` | 被评价的 AI 回复的完整文本。                               | `"今年的差旅补贴标准是..."`           |
| `userQuestion` | `string` | 触发该 AI 回复的用户提问。                                 | `"今年的差旅补贴标准是多少？"`         |
| `feedbackText` | `string` | **可选字段**。仅在 `rating` 为 `'down'` 时存在，包含用户的具体反馈意见。 | `"这个回答没有提到具体的金额，不够清晰。"` |

**请求示例 (点赞):** 
```json
{
  "rating": "up",
  "botReply": "今年的差旅补贴标准是...",
  "userQuestion": "今年的差旅补贴标准是多少？"
}
```

**请求示例 (点踩并提交反馈):** 
```json
{
  "rating": "down",
  "botReply": "今年的差旅补贴标准是...",
  "userQuestion": "今年的差旅补贴标准是多少？",
  "feedbackText": "这个回答没有提到具体的金额，不够清晰。"
}
```

### 响应 (Response)

后端在成功接收到反馈后，应返回一个标准的成功响应。

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

**响应示例:** 
```json
{
  "status": "success",
  "message": "Feedback received successfully"
}
```