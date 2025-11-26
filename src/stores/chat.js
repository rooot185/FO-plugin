import { defineStore } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [{ id: 1, text: '你好，我是财务处AI助手，有什么可以帮助您的吗？', sender: 'bot' }],
    newMessage: '',//用户正在输入的新消息
    isTyping: false, // To show a typing indicator
    // showFeedbackInput: false, // Replaced by showFeedbackDialog
    feedbackText: '',//用户输入的反馈
    currentBotMessageForRating: null, // New: Stores the bot message being rated
    currentQuestionForRating: null, // New: Stores the user question associated with the bot message
    showFeedbackDialog: false, // New: Controls the visibility of the feedback dialog
    currentUser: 'testUser', // New: Placeholder for the current user's account
  }),
  actions: {
    async sendMessage() {
      if (this.newMessage.trim() === '') return;

      const userMessage = { id: Date.now(), text: this.newMessage, sender: 'user' };
      this.messages.push(userMessage);
      
      const prompt = this.newMessage;
      this.newMessage = '';
      this.feedbackText = '';

      const botMessage = { id: Date.now() + 1, text: '', sender: 'bot' };
      this.messages.push(botMessage);

      this.isTyping = true;

      try {
        const eventSource = new EventSource(`/api/chat?prompt=${encodeURIComponent(prompt)}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle message chunks
            if (data.event === 'message' && data.answer) {
              botMessage.text += data.answer;
            }

            // Handle end of message stream
            if (data.event === 'message_end') {
              eventSource.close();
              this.isTyping = false;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', event.data, e);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource failed:', error);
          botMessage.text = 'Error: Could not connect to the server.';
          eventSource.close();
          this.isTyping = false;
        };
      } catch (error) {
        botMessage.text = 'Error: Could not connect to the server.';
        console.error('API call failed:', error);
        this.isTyping = false;
      }
    },

    clearMessages() {
      this.messages = [{ id: Date.now(), text: '你好，我是财务处AI助手，有什么可以帮助您的吗？', sender: 'bot' }];
      this.newMessage = '';
      this.isTyping = false;
      this.feedbackText = '';
      this.currentBotMessageForRating = null;
      this.currentQuestionForRating = null;
      this.showFeedbackDialog = false;
    },

    async rate(rating, botMessage, userQuestion) {
      console.log(`Rated: ${rating}`);
      this.currentBotMessageForRating = botMessage;
      this.currentQuestionForRating = userQuestion;

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
          botReply: this.currentBotMessageForRating.text,
          userQuestion: this.currentQuestionForRating ? this.currentQuestionForRating.text : 'N/A',
          user: this.currentUser, // Add user account information
        };

        const response = await fetch('/api/feedback', {
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
