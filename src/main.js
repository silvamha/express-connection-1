import './style.css'

// Initialize the app
function initializeApp() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="theme-toggle">
          <button id="themeToggle">
              <span class="light-icon">☀️</span>
              <span class="dark-icon">🌙</span>
          </button>
      </div>

      <div class="container">
          <div class="chat-container">
              <div class="agent-profile">
                  <div class="agent-image" id="agentImage">
                      <!-- Agent image will be set via JavaScript -->
                  </div>
                  <h2>Lauren AI</h2>
              </div>
              
              <div class="chat-messages" id="chatMessages">
                  <!-- Messages will be inserted here -->
              </div>

              <div class="chat-controls">
                  <div class="button-group">
                      <button id="clearChat" class="control-button">Clear Chat</button>
                      <button id="deleteAll" class="control-button">Delete All</button>
                  </div>
                  <div class="input-group">
                      <textarea id="messageInput" placeholder="Type your message..."></textarea>
                      <button id="sendMessage">Send</button>
                  </div>
              </div>
          </div>
      </div>
    `;

    // After HTML is inserted, initialize the rest
    initializeChat();
}

function initializeChat() {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const clearChatButton = document.getElementById('clearChat');
    const deleteAllButton = document.getElementById('deleteAll');

    // Chat history
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

    // Theme Management
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${currentTheme}-theme`;

    // Message Management
    function addMessage(content, role) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };
        
        chatHistory.push(message);
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        displayMessage(message);
    }

    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        messageElement.textContent = message.content;
        chatMessages?.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load chat history
    function loadChatHistory() {
        if (chatMessages) {
            chatMessages.innerHTML = '';
            chatHistory.forEach(message => displayMessage(message));
        }
    }

    // Send message
    async function sendMessage() {
        if (!messageInput) return;
        
        const content = messageInput.value.trim();
        if (!content) return;

        // Add user message
        addMessage(content, 'user');
        messageInput.value = '';

        try {
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: content,
                    history: chatHistory
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Add assistant message
            addMessage(data.message, 'assistant');
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    // Event Listeners
    themeToggle?.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.className = `${currentTheme}-theme`;
        localStorage.setItem('theme', currentTheme);
    });

    sendButton?.addEventListener('click', sendMessage);

    messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    clearChatButton?.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        chatHistory = [];
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    });

    deleteAllButton?.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
            localStorage.clear();
            chatHistory = [];
            loadChatHistory();
        }
    });

    // Initial load
    loadChatHistory();
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);
