import { defineStore } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
    currentUser: 'testUser', // New: Placeholder for the current user's account
    currentConversationId: null, // New: Stores the ID of the current conversation
  }),
  actions: {
    async sendMessage() {
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
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                this.isTyping = false;
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              console.log('Received chunk:', chunk);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6); // Remove 'data: ' prefix
                  if (dataStr.trim() === '') continue;

                  console.log('Parsing data:', dataStr);
                  try {
                    const data = JSON.parse(dataStr);

                    switch (data.event) {
                      case 'message':
                        if (data.answer) {
                          message.answer += data.answer;
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
