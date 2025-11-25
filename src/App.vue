<template>
  <div id="chat-container">
    <div id="message-list">
      <div v-for="message in chatStore.messages" :key="message.id" class="message" :class="message.sender">
        <p>{{ message.text }}</p>
      </div>
    </div>
    <div id="input-area">
      <textarea v-model="chatStore.newMessage" @keyup.enter="chatStore.sendMessage" placeholder="请输入你的问题..."></textarea>
      <button @click="chatStore.sendMessage">发送</button>
    </div>
    <div id="rating-area">
      <button @click="chatStore.rate('up')">👍</button>
      <button @click="chatStore.rate('down')">👎</button>
    </div>
    <div v-if="chatStore.showFeedbackInput" id="feedback-area">
      <textarea v-model="chatStore.feedbackText" placeholder="请输入你的反馈..."></textarea>
      <button @click="chatStore.submitFeedback">提交反馈</button>
    </div>
  </div>
</template>

<script setup>
import { useChatStore } from './stores/chat';

const chatStore = useChatStore();
</script>

<style scoped>
#chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  background-color: #242424;
}

#message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.message {
  padding: 10px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  max-width: 80%;
  line-height: 1.4;
  color: #ffffff;
}

.message.user {
  background-color: #0055ff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.message.bot {
  background-color: #3a3a3a;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

#input-area {
  display: flex;
  padding-top: 10px;
  border-top: 1px solid #444;
}

#input-area textarea {
  flex-grow: 1;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  resize: none;
  background-color: #3a3a3a;
  color: #ffffff;
  border: none;
}

#input-area textarea::placeholder {
  color: #888;
}

#input-area button {
  margin-left: 10px;
  padding: 10px 15px;
  border: none;
  background-color: #0055ff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

#input-area button:hover {
  background-color: #0044cc;
}

#rating-area {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #444;
}

#rating-area button {
  margin: 0 5px;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 5px;
  cursor: pointer;
  background-color: #3a3a3a;
  color: #ffffff;
  transition: background-color 0.3s;
}

#rating-area button:hover {
  background-color: #4a4a4a;
}

#feedback-area {
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #444;
}

#feedback-area textarea {
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  resize: none;
  margin-bottom: 10px;
  background-color: #3a3a3a;
  color: #ffffff;
  border: none;
}

#feedback-area textarea::placeholder {
  color: #888;
}

#feedback-area button {
  padding: 10px 15px;
  border: none;
  background-color: #28a745;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

#feedback-area button:hover {
  background-color: #218838;
}
</style>
