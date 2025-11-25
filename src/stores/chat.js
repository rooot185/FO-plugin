import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [{ id: 1, text: '你好，我是财务处AI助手，有什么可以帮助您的吗？', sender: 'bot' }],
    newMessage: '',//用户正在输入的新消息
    showFeedbackInput: false,
    feedbackText: '',//用户输入的反馈
  }),
  actions: {
    async sendMessage() {
      if (this.newMessage.trim() === '') return;

      const userMessage = { id: Date.now(), text: this.newMessage, sender: 'user' };
      this.messages.push(userMessage);
      
      const prompt = this.newMessage;
      this.newMessage = '';
      this.showFeedbackInput = false;
      this.feedbackText = '';

      const botMessage = { id: Date.now() + 1, text: '', sender: 'bot' };
      this.messages.push(botMessage);

      try {
        // Simulate a POST request to a backend API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            history: this.messages.slice(0, -2).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
          }),
        });
        
        // This is a mock implementation of SSE streaming.
        // A real implementation would connect to an actual SSE endpoint.
        // For demonstration, we simulate a ReadableStream.
        const mockResponse = `这是一个模拟的流式响应 for: "${prompt}"`;
        const stream = new ReadableStream({
          start(controller) {
            let i = 0;
            const interval = setInterval(() => {
              if (i < mockResponse.length) {
                const chunk = mockResponse[i];
                controller.enqueue(`data: {"chunk": "${chunk}"}\n\n`);
                i++;
              } else {
                controller.enqueue('data: {"event": "done"}\n\n');
                clearInterval(interval);
                controller.close();
              }
            }, 50);
          }
        });

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value);
            const lines = chunkText.split('\n\n').filter(line => line.startsWith('data:'));

            for (const line of lines) {
              const jsonStr = line.replace('data: ', '');
              try {
                const data = JSON.parse(jsonStr);
                if (data.event === 'done') {
                  return;
                }
                botMessage.text += data.chunk;
              } catch (e) {
                // Ignore parsing errors for this mock
              }
            }
          }
        };
        await processStream();

      } catch (error) {
        botMessage.text = 'Error: Could not connect to the server.';
        console.error('API call failed:', error);
      }
    },

    rate(rating) {
      console.log(`Rated: ${rating}`);
      if (rating === 'down') {
        this.showFeedbackInput = true;
      } else {
        this.showFeedbackInput = false;
        // Submit positive rating immediately
        this._submitRating({ rating });
      }
    },
    
    submitFeedback() {
      if (this.feedbackText.trim() === '') return;
      
      const lastBotMessage = this.messages.filter(m => m.sender === 'bot').pop();
      if (!lastBotMessage) return;

      this._submitRating({
        rating: 'down',
        feedbackText: this.feedbackText,
        // Include the conversation context for better analysis
        history: this.messages
      });
      
      alert('感谢您的反馈！');
      this.showFeedbackInput = false;
      this.feedbackText = '';
    },

    async _submitRating(payload) {
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('Feedback submission success:', result);
      } catch (error) {
        console.error('Feedback submission failed:', error);
        // In a real app, you might want to show an error to the user
      }
    }
  },
});
