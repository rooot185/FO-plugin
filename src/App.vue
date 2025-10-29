<template>
  <div id="chat-container">
    <div id="message-list">
      <div v-for="message in chatStore.messages" :key="message.id" class="message" :class="message.sender">
        <p>{{ message.text }}</p>
      </div>
    </div>
    <div id="input-area">
      <textarea v-model="chatStore.newMessage" @keyup.enter="chatStore.sendMessage" placeholder="Type your message..."></textarea>
      <button @click="chatStore.sendMessage">Send</button>
    </div>
    <div id="rating-area">
      <button @click="chatStore.rate('up')">👍</button>
      <button @click="chatStore.rate('down')">👎</button>
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
}

#message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 10px;
}

.message {
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  max-width: 80%;
}

.message.user {
  background-color: #DCF8C6;
  align-self: flex-end;
}

.message.bot {
  background-color: #E5E5EA;
  align-self: flex-start;
}

#input-area {
  display: flex;
  padding-top: 10px;
  border-top: 1px solid #ccc;
}

#input-area textarea {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
  resize: none;
}

#input-area button {
  margin-left: 10px;
  padding: 8px 12px;
  border: none;
  background-color: #007BFF;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

#rating-area {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #ccc;
}

#rating-area button {
  margin: 0 5px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}
</style>
