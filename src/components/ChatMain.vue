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
              <button @click="chatStore.rate('up', message)" class="feedback-btn">
                <font-awesome-icon :icon="['fas', 'thumbs-up']" />
              </button>
              <button @click="chatStore.rate('down', message)" class="feedback-btn">
                <font-awesome-icon :icon="['fas', 'thumbs-down']" />
              </button>
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
  padding: 15px 20px; /* Increased padding for better spacing */
  background-color: var(--background-secondary); /* Use background-secondary (white) */
  border-bottom: 1px solid var(--border-color); /* Use border color variable */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* Slightly stronger, softer shadow */
  flex-shrink: 0;
  z-index: 10; /* Ensure header is above other content */
}

#chat-header h2 {
  margin: 0;
  font-size: 1.3em; /* Slightly larger font for title */
  color: var(--text-primary); /* Use primary text color */
  flex-grow: 1;
  text-align: center;
  font-weight: 600; /* Make title bolder */
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--brand-accent); /* Use brand accent color for dropdown icon */
  display: flex;
  align-items: center;
}

.el-button.is-circle {
  border: none; /* Remove default border for circle button */
  background-color: transparent; /* Transparent background */
  color: var(--text-secondary); /* Secondary text color for icon */
  transition: color 0.2s ease, background-color 0.2s ease;
}

.el-button.is-circle:hover {
  color: var(--brand-accent); /* Accent color on hover */
  background-color: var(--background-tertiary); /* Subtle background on hover */
}

#message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px; /* Slightly more padding */
  -webkit-overflow-scrolling: touch;
  background-color: var(--background-primary); /* Use primary background color */
}

.message-wrapper {
  display: flex;
  margin-bottom: 15px; /* Increased margin for better separation */
}

.message-user {
  justify-content: flex-end;
}

.message-bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%; /* Slightly smaller max-width */
  padding: 12px 18px; /* Adjusted padding */
  border-radius: 18px; /* More rounded corners */
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 0.95em; /* Slightly smaller font size */
}

.message-user .message-bubble {
  background-color: var(--brand-accent); /* Use brand accent color */
  color: white;
  border-top-right-radius: 2px; /* Keep a slight corner for user message */
  border-bottom-right-radius: 18px; /* Make the bottom right round */
}

.message-bot .message-bubble {
  background-color: var(--background-secondary); /* Use background-secondary (white) */
  color: var(--text-primary); /* Use primary text color */
  border: 1px solid var(--border-color); /* Use border color variable */
  border-top-left-radius: 2px; /* Keep a slight corner for bot message */
  border-bottom-left-radius: 18px; /* Make the bottom left round */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); /* Subtle shadow for bot messages */
}

/* Markdown and code block styling */
.message-bot .message-bubble :deep(pre) {
  background-color: #f8f8f8; /* Lighter background for code blocks */
  color: #333; /* Darker text for code blocks */
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin-top: 10px;
  border: 1px solid #e0eeef; /* Subtle border for code blocks */
}

.message-bot .message-bubble :deep(code) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: inherit;
}

.message-bot .message-bubble :deep(pre code) {
  display: block;
  padding: 0;
}

.message-bot .message-bubble :deep(p) {
  margin-bottom: 8px; /* Adjusted margin for paragraphs */
}

.message-bot .message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

/* Typing indicator for bot message */
.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Align left with bot messages */
  height: 20px;
}

.typing-indicator span {
  display: inline-block;
  width: 7px; /* Slightly larger dots */
  height: 7px;
  background-color: var(--text-secondary); /* Use secondary text color for dots */
  border-radius: 50%;
  margin: 0 3px; /* Adjusted margin */
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
  padding: 15px 20px; /* Increased padding */
  border-top: 1px solid var(--border-color); /* Use border color variable */
  background-color: var(--background-secondary); /* Use background-secondary (white) */
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow on top */
  position: relative; /* For z-index if needed */
  z-index: 10;
}

#input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background-color: var(--background-secondary); /* Use background-secondary */
  color: var(--text-primary); /* Use primary text color */
  border: 1px solid var(--border-color); /* Add a border to the input area */
  border-radius: 10px; /* Rounded corners for the whole input area */
  padding: 8px; /* Padding inside the input area border */
}

#input-area textarea {
  flex-grow: 1;
  border: none; /* Remove individual textarea border */
  background-color: transparent; /* Transparent background */
  color: var(--text-primary);
  padding: 10px; /* Padding inside textarea */
  font-size: 1em;
  resize: none;
  overflow-y: auto; /* Allow scrollbar to show when content overflows */
  min-height: 44px; /* Minimum height for one line with padding */
  max-height: 150px; /* Increased max height before scrolling */
  line-height: 1.5; /* Ensure consistent line height */
}

#input-area textarea::placeholder {
  color: var(--text-secondary); /* Use secondary text color for placeholder */
}

#input-area textarea:focus {
  outline: none;
  /* Border and shadow moved to parent #input-area */
}

#input-area button {
  background-color: var(--brand-accent); /* Use brand accent color */
  color: white;
  border: none;
  border-radius: 8px; /* Rounded corners for button */
  padding: 10px 14px; /* Adjusted padding for button */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

#input-area button:hover:not(:disabled) {
  background-color: var(--brand-accent-hover); /* Use brand accent hover color */
}

#input-area button:disabled {
  background-color: var(--background-tertiary); /* Lighter disabled background */
  color: var(--text-secondary); /* Lighter text color for disabled state */
  cursor: not-allowed;
  opacity: 0.7; /* Slightly more opaque disabled state */
}

#input-area button svg {
  fill: currentColor; /* Ensure SVG icon color matches button text color */
  width: 20px;
  height: 20px;
}

.feedback-controls-inline {
  display: flex;
  gap: 6px; /* Slightly smaller gap */
  margin-top: 8px; /* Adjusted margin */
  justify-content: flex-end;
  opacity: 0; /* Initially hidden */
  transition: opacity 0.2s ease;
}

/* Show feedback controls on message bubble hover */
.message-bot:hover .feedback-controls-inline {
  opacity: 1;
}

.message-bot .feedback-controls-inline {
  justify-content: flex-start;
}

.feedback-btn {
  background-color: var(--background-tertiary); /* Use tertiary background for subtle look */
  border: 1px solid var(--border-color); /* Use border color variable */
  color: var(--text-secondary); /* Secondary text color */
  border-radius: 6px; /* Slightly more rounded */
  padding: 6px 8px; /* Adjusted padding for icons */
  cursor: pointer;
  display: flex; /* Add flex to center icon */
  align-items: center; /* Center icon vertically */
  justify-content: center; /* Center icon horizontally */
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.feedback-btn:hover {
  background-color: var(--background-primary); /* Primary background on hover */
  border-color: var(--brand-accent); /* Accent border on hover */
  color: var(--brand-accent); /* Accent color on hover */
}

.el-dialog__footer {
  text-align: right;
}

/* Element Plus Dialog Overrides */
.el-dialog {
  border-radius: 12px; /* Rounded corners for the dialog */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15); /* More prominent shadow */
}

.el-dialog__header {
  padding: 20px 25px 10px; /* Adjusted padding */
  border-bottom: 1px solid var(--border-color); /* Use border color variable */
}

.el-dialog__title {
  color: var(--text-primary); /* Primary text color for title */
  font-weight: 600;
  font-size: 1.15em;
}

.el-dialog__body {
  padding: 20px 25px; /* Adjusted padding */
  color: var(--text-primary); /* Primary text color for body */
}

.el-dialog__body span {
  display: block;
  margin-bottom: 15px; /* Spacing for the prompt text */
  font-size: 0.95em;
  color: var(--text-secondary); /* Secondary text color */
}

.el-dialog__footer {
  padding: 15px 25px 20px; /* Adjusted padding */
  border-top: 1px solid var(--border-color); /* Use border color variable */
}

.el-input__inner {
  background-color: var(--background-primary); /* Match primary background */
  border-color: var(--border-color); /* Match border color */
  color: var(--text-primary); /* Match primary text color */
}

.el-textarea__inner {
  background-color: var(--background-primary) !important; /* Force background for textarea */
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
  padding: 10px 15px !important;
  border-radius: 8px !important;
  resize: vertical !important; /* Allow vertical resize */
  min-height: 80px !important;
}

.el-textarea__inner::placeholder {
  color: var(--text-secondary) !important;
}

.dialog-footer .el-button {
  border-radius: 8px; /* Rounded buttons */
  padding: 10px 20px;
  font-size: 0.95em;
  font-weight: 500;
}

.dialog-footer .el-button--primary {
  background-color: var(--brand-accent); /* Use brand accent for primary button */
  border-color: var(--brand-accent);
}

.dialog-footer .el-button--primary:hover {
  background-color: var(--brand-accent-hover); /* Use brand accent hover */
  border-color: var(--brand-accent-hover);
}

.dialog-footer .el-button:not(.el-button--primary) {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.dialog-footer .el-button:not(.el-button--primary):hover {
  background-color: var(--background-tertiary);
  border-color: var(--brand-accent);
  color: var(--brand-accent);
}
</style>
