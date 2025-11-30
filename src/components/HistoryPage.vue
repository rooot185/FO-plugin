<template>
  <div id="history-container">
    <header id="history-header">
      <button @click="goBack" class="back-button">← 返回</button>
      <h2>历史会话</h2>
    </header>
    <div id="history-list">
      <div v-if="loading" class="loading-indicator">加载中...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <ul v-else-if="conversations.length">
        <li v-for="conversation in conversations" :key="conversation.conversation_id" @click="selectConversation(conversation.conversation_id)" class="history-item">
          <h3>{{ conversation.title || '无标题会话' }}</h3>
          <!-- <p>最后更新: {{ new Date(conversation.lastUpdated).toLocaleString() }}</p> -->
        </li>
      </ul>
      <p v-else>没有历史会话记录。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat';
import { ElMessage } from 'element-plus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const router = useRouter();
const chatStore = useChatStore();

const conversations = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchConversations = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetch(`${API_BASE_URL}/api/history/conversations?user=${encodeURIComponent(chatStore.currentUser)}`); // Include user as query parameter
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.code === 0) {
      conversations.value = result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch conversations');
    }
  } catch (err) {
    console.error('Failed to fetch conversations:', err);
    error.value = '加载历史会话失败。';
    ElMessage.error('加载历史会话失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const selectConversation = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/history/conversations/${conversationId}?user=${encodeURIComponent(chatStore.currentUser)}`); // Include user as query parameter
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.code === 0) {
      chatStore.currentConversationId = conversationId;
      chatStore.messages = result.data; // Load historical messages into the chat store
    } else {
      throw new Error(result.message || 'Failed to load conversation history');
    }
    router.push('/'); // Navigate back to the main chat page
  } catch (err) {
    console.error('Failed to load conversation history:', err);
    ElMessage.error('加载会话历史失败，请稍后重试。');
  }
};

const goBack = () => {
  router.push('/');
};

onMounted(() => {
  fetchConversations();
});
</script>

<style scoped>
#history-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%; /* Ensure it takes full width */
  background-color: #f0f2f5;
}

#history-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  margin-right: 10px;
  color: #333;
}

#history-header h2 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
  flex-grow: 1;
  text-align: center;
}

#history-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
}

#history-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 15px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease-in-out;
}

.history-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-item h3 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 1em;
  color: #333;
}

.history-item p {
  margin: 0;
  font-size: 0.85em;
  color: #777;
}

.loading-indicator,
.error-message {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
