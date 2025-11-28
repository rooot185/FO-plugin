<template>
  <div id="chat-container">
    <header id="chat-header">
      <h2>财务处 AI 助手</h2>
      <div class="header-controls">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            <el-button :icon="MoreFilled" circle />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="newChat">创建新对话</el-dropdown-item>
              <el-dropdown-item command="history">历史会话</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    
    <div id="message-list" ref="messageList">
      <template v-for="message in chatStore.messages" :key="message.id">
        <!-- User Message -->
        <div v-if="message.query" class="message-wrapper message-user">
          <div class="message-bubble">
            <p>{{ message.query }}</p>
          </div>
        </div>

        <!-- Bot Message -->
        <div v-if="message.answer" 
             class="message-wrapper message-bot"
             @mouseenter="hoveredMessageId = message.id"
             @mouseleave="hoveredMessageId = null">
          <div class="message-bubble">
            <div v-html="renderMarkdown(message.answer)"></div>
            <div v-if="hoveredMessageId === message.id" class="feedback-controls-inline">
              <button @click="chatStore.rate('up', message)" class="feedback-btn">👍</button>
              <button @click="chatStore.rate('down', message)" class="feedback-btn">👎</button>
            </div>
          </div>
        </div>
      </template>
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
          placeholder="请输入您的问题"
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
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { MoreFilled } from '@element-plus/icons-vue';

const router = useRouter();
const chatStore = useChatStore();
const messageList = ref(null);
const hoveredMessageId = ref(null);

const handleCommand = (command) => {
  if (command === 'newChat') {
    startNewChat();
  } else if (command === 'history') {
    goToHistory();
  }
};

const goToHistory = () => {
  router.push('/history');
};

const startNewChat = () => {
  chatStore.clearMessages();
  router.push('/');
};

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
#chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f0f2f5;
}

#chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* Prevent header from shrinking */
}

#chat-header h2 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
  flex-grow: 1; /* Allow h2 to take available space */
  text-align: center; /* Center the text */
}

.header-controls {
  display: flex;
  gap: 10px; /* Space between controls */
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}

#message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
  -webkit-overflow-scrolling: touch;
}

.message-wrapper {
  display: flex;
  margin-bottom: 10px;
}

.message-user {
  justify-content: flex-end;
}

.message-bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 20px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap; /* Preserve whitespace and line breaks */
}

.message-user .message-bubble {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 2px;
}

.message-bot .message-bubble {
  background-color: #ffffff;
  color: #333;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 2px;
}

/* Markdown and code block styling */
.message-bot .message-bubble :deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  margin-top: 10px;
}

.message-bot .message-bubble :deep(code) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.message-bot .message-bubble :deep(pre code) {
  display: block;
  padding: 0;
}

.message-bot .message-bubble :deep(p) {
  margin-bottom: 10px;
}

.message-bot .message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px; /* Adjust height as needed */
}

.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #ccc;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

#chat-footer {
  padding: 10px 15px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
  flex-shrink: 0; /* Prevent footer from shrinking */
}

#input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background-color: #ffffff; /* Explicitly set background to white */
  color: #333; /* Ensure text is dark for readability */
}

#input-area textarea {
  flex-grow: 1;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  font-size: 1em;
  resize: none;
  overflow-y: hidden; /* Hide scrollbar but allow content to expand */
  min-height: 40px; /* Minimum height for one line */
  max-height: 120px; /* Max height before scrolling */
  background-color: #ffffff; /* Explicitly set background to white */
  color: #333; /* Ensure text is dark for readability */
}

#input-area textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

#input-area button {
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

#input-area button:hover:not(:disabled) {
  background-color: #66b1ff;
}

#input-area button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.feedback-controls-inline {
  display: flex;
  gap: 8px;
  margin-top: 5px;
  justify-content: flex-end; /* Align to the right of the bubble */
}

.message-bot .feedback-controls-inline {
  justify-content: flex-start; /* Align to the left for bot messages */
}

.feedback-btn {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.feedback-btn:hover {
  background-color: #f0f2f5;
  border-color: #c0c4cc;
}

.el-dialog__footer {
  text-align: right;
}
</style>
