<template>
  <div id="chat-container">
    <header id="chat-header">
      <h2>财务处 AI 助手</h2>
    </header>
    
    <div id="message-list" ref="messageList">
      <div v-for="(message, index) in chatStore.messages" :key="message.id" 
           class="message-wrapper" 
           :class="`message-${message.sender}`"
           @mouseenter="hoveredMessageId = message.id"
           @mouseleave="hoveredMessageId = null">
        <div class="message-bubble">
          <div v-if="message.sender === 'bot'" v-html="renderMarkdown(message.text)"></div>
          <p v-else>{{ message.text }}</p>
          
          <div v-if="message.sender === 'bot' && hoveredMessageId === message.id" class="feedback-controls-inline">
            <button @click="chatStore.rate('up', message, chatStore.messages[index - 1])" class="feedback-btn">👍</button>
            <button @click="chatStore.rate('down', message, chatStore.messages[index - 1])" class="feedback-btn">👎</button>
          </div>
        </div>
      </div>
      <div v-if="chatStore.isTyping" class="message-wrapper message-bot">
        <div class="message-bubble">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <footer id="chat-footer">
      <div id="input-area">
        <textarea 
          v-model="chatStore.newMessage" 
          @keydown="handleKeydown"
          placeholder="请输入您的问题 (Shift+Enter 换行)"
          rows="1"
        ></textarea>
        <button @click="sendMessage" :disabled="chatStore.newMessage.trim() === ''">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </footer>

          <el-dialog
            v-model="chatStore.showFeedbackDialog"
            title="提供反馈"
            width="90%"
            destroy-on-close
          >
            <span>请告诉我们哪里可以做得更好：</span>      <el-input
        v-model="chatStore.feedbackText"
        type="textarea"
        :rows="4"
        placeholder="请输入您的反馈意见..."
      ></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chatStore.showFeedbackDialog = false">取消</el-button>
          <el-button type="primary" @click="chatStore.submitFeedback">提交反馈</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from './stores/chat';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const chatStore = useChatStore();
const messageList = ref(null);
const hoveredMessageId = ref(null);

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-', // uses standard class prefix
  breaks: true, // adds <br> on single line breaks
});

const renderMarkdown = (text) => {
  return marked.parse(text);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  });
};

const sendMessage = () => {
  if (chatStore.newMessage.trim() === '') return;
  chatStore.sendMessage();
};

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

watch(() => chatStore.messages, scrollToBottom, { deep: true });
watch(() => chatStore.isTyping, scrollToBottom);

</script>

<style>
.feedback-controls-inline {
  display: flex;
  gap: 8px;
  margin-top: 5px;
  justify-content: flex-end; /* Align to the right of the bubble */
}

.message-bot .feedback-controls-inline {
  justify-content: flex-start; /* Align to the left for bot messages */
}

.el-dialog__footer {
  text-align: right;
}
</style>