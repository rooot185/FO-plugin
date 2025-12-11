import { defineStore } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * 从Uint8Array缓冲区中提取所有完整的JSON事件字符串
 * @param {Uint8Array} buffer - 累积的二进制缓冲区
 * @param {TextDecoder} decoder - 用于解码字节为字符串的TextDecoder实例
 * @returns {Object} 包含两个属性:
 *   - eventStrings: Array<string> 提取出的完整JSON字符串数组
 *   - remainingBuffer: Uint8Array 未处理完的剩余缓冲区
 */
const extractCompleteEventsFromBuffer = (buffer, decoder) => {
  const PREFIX = new TextEncoder().encode('{"event":');
  const PREFIX_LEN = PREFIX.length;
  const SUFFIX = new TextEncoder().encode('"}'); // [34, 125]
  const SUFFIX_LEN = SUFFIX.length;

  const eventStrings = [];
  let currentIndex = 0;

  // 循环查找所有完整事件
  while (currentIndex <= buffer.length - PREFIX_LEN) {
    // 1. 查找事件前缀
    let prefixFound = false;
    for (let i = currentIndex; i <= buffer.length - PREFIX_LEN; i++) {
      let match = true;
      for (let j = 0; j < PREFIX_LEN; j++) {
        if (buffer[i + j] !== PREFIX[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        currentIndex = i;
        prefixFound = true;
        break;
      }
    }

    if (!prefixFound) {
      // 没有找到更多前缀，剩余部分全部保留
      break; // 直接退出循环，currentIndex就是未处理数据的起始位置
    }

    // 2. 查找事件结束标记
    let eventEnd = -1;
    const searchStart = currentIndex + PREFIX_LEN;
    for (let i = searchStart; i <= buffer.length - SUFFIX_LEN; i++) {
      let match = true;
      for (let j = 0; j < SUFFIX_LEN; j++) {
        if (buffer[i + j] !== SUFFIX[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        eventEnd = i + SUFFIX_LEN;
        break;
      }
    }

    if (eventEnd === -1) {
      // 找到了前缀但没有完整结束，保留从当前前缀开始的数据
      break; // 退出循环，currentIndex就是未处理数据的起始位置（包含这个不完整的前缀）
    }

    // 3. 提取并解码事件字符串
    const eventBytes = buffer.slice(currentIndex, eventEnd);
    try {
      const eventStr = decoder.decode(eventBytes);
      // 验证确实是有效的JSON格式（快速检查）
      if (eventStr.startsWith('{"event":') && eventStr.endsWith('"}')) {
        eventStrings.push(eventStr);
        currentIndex = eventEnd; // 关键：成功处理后，移动currentIndex到事件结束位置
      } else {
        // 解码出来的字符串不符合预期，跳过这个位置继续搜索
        currentIndex++;
      }
    } catch (e) {
      // 解码失败，跳过当前字节继续搜索
      console.warn('解码失败，跳过当前字节:', e);
      currentIndex++;
    }
  }

  // 计算剩余缓冲区：从currentIndex开始到最后
  const remainingBuffer = currentIndex < buffer.length
      ? buffer.slice(currentIndex)
      : new Uint8Array(0);

  console.log('提取到事件数量:', eventStrings.length, '剩余缓冲区大小:', remainingBuffer.length);

  return {
    eventStrings,
    remainingBuffer
  };
};

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [{ id: 1, query: '', answer: '你好，我是财务处AI助手，有什么可以帮助您的吗？' }],
    newMessage: '',//用户正在输入的新消息
    isTyping: false, // To show a typing indicator
    // showFeedbackInput: false, // Replaced by showFeedbackDialog
    feedbackText: '',//用户输入的反馈
    currentBotMessageForRating: null, // New: Stores the bot message being rated
    currentQuestionForRating: null, // New: Stores the user question associated with the bot message
    showFeedbackDialog: false, // New: Controls the visibility of the feedback dialog
    // ========== 用户认证相关状态 ==========
    currentUser: null, // 存储用户的 uid
    isAuthenticated: false,
    // ====================================
    currentConversationId: null, // New: Stores the ID of the current conversation
  }),
  actions: {
    // ==================== 登录方法 ====================
    async login(credentials) {
      try {
        console.log('发送登录请求:', credentials);

        const response = await fetch(`${API_BASE_URL}/user/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password
          }),
        });

        console.log('登录响应状态:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('登录失败:', errorText);
          throw new Error(`登录失败: ${response.status}`);
        }

        const result = await response.json();
        console.log('登录响应数据:', result);

        // 根据提供的接口文档：{ code: 200, msg: "成功", data: { uid: "sample_uid", ... } }
        if (result.code === 200) {
          // 获取用户 uid
          const uid = result.data?.username;

          if (!uid) {
            throw new Error('未能获取用户UID');
          }

          // 更新用户状态
          this.currentUser = uid;
          this.isAuthenticated = true;

          console.log('登录成功，当前用户UID:', this.currentUser);

          return true;
        } else {
          throw new Error(result.msg || '登录失败');
        }
      } catch (error) {
        console.error('登录错误:', error);
        throw error;
      }
    },

    // ==================== 注册方法 ====================
    async register(userData) {
      try {
        console.log('发送注册请求:', userData);

        const response = await fetch(`${API_BASE_URL}/user/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: userData.username,
            password: userData.password,
            role: "TEACHER", // 默认值
            department: null,
            majorName: null
          }),
        });

        console.log('注册响应状态:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('注册失败:', errorText);
          throw new Error(`注册失败: ${response.status}`);
        }

        const result = await response.json();
        console.log('注册响应数据:', result);

        // 根据提供的接口文档：{ code: 200, msg: "成功", data: "specified_uid" }
        if (result.code === 200) {
          // 注册成功，返回的 data 字段就是 uid
          const uid = result.data;

          if (!uid) {
            throw new Error('未能获取注册后的用户UID');
          }

          // 自动登录：设置当前用户状态
          this.currentUser = uid;
          this.isAuthenticated = true;

          console.log('注册并自动登录成功，用户UID:', this.currentUser);

          return true;
        } else {
          throw new Error(result.msg || '注册失败');
        }
      } catch (error) {
        console.error('注册错误:', error);
        throw error;
      }
    },

    // ==================== 登出方法 ====================
    logout() {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.clearMessages(); // 清空当前会话

      // 重定向到登录页
      if (window.location.hash !== '#/login') {
        window.location.hash = '/login';
      }
    },

    // ==================== 原有方法（保持不变） ====================
    async sendMessage() {
      // 在发送消息前检查用户是否登录
      if (!this.isAuthenticated) {
        ElMessage.warning('请先登录');
        window.location.hash = '/login';
        return;
      }

      if (this.newMessage.trim() === '') return;

      const prompt = this.newMessage;
      this.newMessage = '';
      this.feedbackText = '';

      // Create a single message object with query and an empty answer
      const message = { id: '', query: prompt, answer: '' };
      this.messages.push(message);
      
      // If no conversation ID exists, create a new one for this session
      if (!this.currentConversationId) {
        this.currentConversationId = "";
      }

      this.isTyping = true;

      try {
        // Use POST request with ReadableStream for SSE-like streaming
        console.log('Sending request to:', `${API_BASE_URL}/api/chat`);
        console.log('Request body:', {
          prompt: prompt,
          user: this.currentUser,
          conversationId: this.currentConversationId
        });

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            user: this.currentUser,
            conversationId: this.currentConversationId
          }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const processStream = async () => {
          try {

            let buffer = new Uint8Array(0);
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                this.isTyping = false;
                break;
              }

              // 1. 将新数据追加到缓冲区
              if (value && value.length) {
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;
              }
              // 2. 提取并处理所有完整事件
              const extracted = extractCompleteEventsFromBuffer(buffer, decoder);
              buffer = extracted.remainingBuffer;
              for(const dataStr of extracted.eventStrings){
                console.log('Parsing data:', dataStr);
                try {
                  const data = JSON.parse(dataStr);
                  switch (data.event) {
                    case 'message':
                      if (data.answer) {
                        message.answer += data.answer;
                        this.messages = [...this.messages];
                      }
                      // Update message ID with the one from the server for rating purposes
                      if (data.message_id) {
                        message.id = data.message_id;
                      }
                      if (data.conversation_id) {
                        this.currentConversationId = data.conversation_id;
                      }
                      break;

                      case 'message_end':
                        this.isTyping = false;
                        reader.cancel();
                        return;

                      case 'message_replace':
                        // Find the message being replaced and update its content
                        const messageToReplace = this.messages.find(m => m.id === data.message_id);
                        if (messageToReplace) {
                          messageToReplace.answer = data.answer;
                        }
                        break;

                      case 'error':
                        console.error('Received error event:', data);
                        message.answer = `Error: ${data.message}`;
                        this.isTyping = false;
                        reader.cancel();
                        return;

                      case 'ping':
                        // Keep-alive event, do nothing
                        break;

                      // Log workflow and other events for debugging
                      case 'workflow_started':
                      case 'node_started':
                      case 'node_finished':
                      case 'workflow_finished':
                      case 'message_file':
                      case 'tts_message':
                      case 'tts_message_end':
                        console.log('Received SSE Event:', data);
                        break;

                      default:
                        // Ignore unknown events
                        break;
                    }
                  } catch (e) {
                    console.error('Failed to parse SSE data:', dataStr, e);
                  }
                }
              }
          } catch (error) {
            console.error('Stream reading failed:', error);
            message.answer = 'Error: Could not connect to the server.';
            this.isTyping = false;
          }
        };

        processStream();
      } catch (error) {
        message.answer = 'Error: Could not connect to the server.';
        console.error('API call failed:', error);
        this.isTyping = false;
      }
    },

    clearMessages() {
      this.messages = [{ id:'', query: '', answer: '你好，我是财务处AI助手，有什么可以帮助您的吗？' }];
      this.newMessage = '';
      this.isTyping = false;
      this.feedbackText = '';
      this.currentBotMessageForRating = null;
      this.currentQuestionForRating = null;
      this.showFeedbackDialog = false;
      this.currentConversationId = null;
    },

    async rate(rating, message) {
      console.log(`Rated: ${rating}`);
      this.currentBotMessageForRating = message;
      // this.currentQuestionForRating can be removed as message.query holds the question

      if (rating === 'down') {
        this.showFeedbackDialog = true; // Show the feedback dialog
      } else {
        // Submit positive rating immediately
        await this._submitRating({ rating: 'up' });
      }
    },
    
    async submitFeedback() {
      if (this.feedbackText.trim() === '') {
        ElMessage({
          message: '反馈内容不能为空！',
          type: 'warning',
        });
        return;
      }
      
      await this._submitRating({
        rating: 'down',
        feedbackText: this.feedbackText,
      });
      
      this.showFeedbackDialog = false; // Close the dialog after submission
      this.feedbackText = '';
    },

    async _submitRating(payload) {
      try {
        if (!this.currentBotMessageForRating) {
          console.error('No bot message selected for rating.');
          ElMessage({
            message: '未能找到要评价的AI回复。请刷新页面重试。',
            type: 'error',
          });
          return;
        }

        const feedbackPayload = {
          ...payload,
          messageId: this.currentBotMessageForRating.id, // Send message ID
          conversationId: this.currentConversationId, // Send conversation ID
          user: this.currentUser, // Add user account information
        };

        const response = await fetch(`${API_BASE_URL}/api/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackPayload),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('Feedback submission success:', result);
        ElMessage({
          message: payload.rating === 'up' ? '感谢您的点赞！' : '感谢您的反馈！',
          type: 'success',
        });
      } catch (error) {
        console.error('Feedback submission failed:', error);
        ElMessage({
          message: '反馈提交失败，请稍后重试。',
          type: 'error',
        });
      }
    }
  },
});
