import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [{ id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }],
    newMessage: '',
  }),
  actions: {
    sendMessage() {
      if (this.newMessage.trim() === '') return;
      this.messages.push({ id: Date.now(), text: this.newMessage, sender: 'user' });
      const userMessage = this.newMessage;
      this.newMessage = '';
      
      // Simulate SSE connection and streaming response
      this.messages.push({ id: Date.now() + 1, text: '', sender: 'bot' });
      const botMessage = this.messages[this.messages.length - 1];
      
      const mockResponse = `This is a mock streamed response for the message: "${userMessage}"`;
      let i = 0;
      const interval = setInterval(() => {
        if (i < mockResponse.length) {
          botMessage.text += mockResponse[i];
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
    },
    rate(rating) {
      console.log(`Rated: ${rating}`);
    },
  },
});
