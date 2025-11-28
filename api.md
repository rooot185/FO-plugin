# AI Assistant Backend API Specification

This document outlines the required backend API endpoints for the AI Assistant frontend application.

## 1. Chat API

Handles real-time chat interactions using Server-Sent Events (SSE).

- **Endpoint**: `/api/chat`
- **Method**: `GET`
- **Response Format**: `text/event-stream`

### Request

The client initiates a connection with the following query parameters:

| Parameter        | Type     | Required | Description                                                  |
|------------------|----------|----------|--------------------------------------------------------------|
| `prompt`         | `string` | Yes      | The user's message or question.                              |
| `user`           | `string` | Yes      | The unique identifier for the current user.                  |
| `conversationId` | `string` | Yes      | The ID for the current conversation session.                 |

### Response (SSE Stream)

The server streams back events, each formatted as `data: <JSON_STRING>\n\n`. The frontend expects the following event types:

- **`event: message`**: A piece of the response text.
  - **Payload**: `{ "event": "message", "answer": "text chunk", "message_id": "unique-msg-id", "conversation_id": "current-conv-id" }`
  - *The `message_id` should be consistent for all chunks of a single response.*

- **`event: message_end`**: Signals the end of a complete response.
  - **Payload**: `{ "event": "message_end", "message_id": "unique-msg-id", "conversation_id": "current-conv-id" }`

- **`event: message_replace`**: Replaces a previous message's content (e.g., for content moderation).
  - **Payload**: `{ "event": "message_replace", "answer": "new full text", "message_id": "unique-msg-id-to-replace" }`

- **`event: error`**: Indicates an error occurred. The connection should be closed after this event.
  - **Payload**: `{ "event": "error", "message": "Error description text" }`

- **`event: ping`**: A keep-alive signal that can be ignored by the frontend.

- Other events (e.g., `workflow_started`, `node_finished`) can be sent for logging/debugging purposes and will be logged to the console by the frontend.

## 2. Feedback API

Receives user feedback on AI responses.

- **Endpoint**: `/api/feedback`
- **Method**: `POST`
- **Request Body Format**: `application/json`

### Request Body

| Field            | Type     | Required | Description                                                    |
|------------------|----------|----------|----------------------------------------------------------------|
| `rating`         | `string` | Yes      | User's rating. Must be either `'up'` or `'down'`.              |
| `messageId`      | `string` | Yes      | The unique ID of the message being rated.                      |
| `conversationId` | `string` | Yes      | The ID of the conversation where the message appeared.         |
| `user`           | `string` | Yes      | The unique identifier for the user submitting the feedback.    |
| `feedbackText`   | `string` | No       | Optional text feedback, provided when `rating` is `'down'`.    |

### Success Response

- **Status Code**: `200 OK`
- **Body**: `{ "status": "success", "message": "Feedback received" }`

## 3. History API

Provides access to past conversation history.

### 3.1. List User Conversations

- **Endpoint**: `/api/history/conversations`
- **Method**: `GET`

#### Request

| Parameter | Location | Type     | Required | Description                                 |
|-----------|----------|----------|----------|---------------------------------------------|
| `user`    | Query    | `string` | Yes      | The unique identifier for the user.         |

#### Success Response

- **Status Code**: `200 OK`
- **Body**: An array of conversation objects.
  ```json
  [
    {
      "id": "conv-id-1",
      "title": "Conversation Title 1"
    },
    {
      "id": "conv-id-2",
      "title": "Conversation Title 2"
    }
  ]
  ```

### 3.2. Get a Specific Conversation

- **Endpoint**: `/api/history/conversations/:conversationId`
- **Method**: `GET`

#### Request

| Parameter        | Location | Type     | Required | Description                                       |
|------------------|----------|----------|----------|---------------------------------------------------||
| `conversationId` | Path     | `string` | Yes      | The unique ID of the conversation to retrieve.    |
| `user`           | Query    | `string` | Yes      | The unique identifier for the user.               |

#### Success Response

- **Status Code**: `200 OK`
- **Body**: An array of message objects, structured for direct display in the chat interface.
  ```json
  [
    { 
      "id": "msg-id-1", 
      "query": "Hello", 
      "answer": "Hi, how can I help you?" 
    },
    { 
      "id": "msg-id-2", 
      "query": "What is the policy?", 
      "answer": "The policy is detailed in the document XYZ..." 
    }
  ]
  ```
