// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendMessage');
const clearChatButton = document.getElementById('clearChat');
const deleteAllButton = document.getElementById('deleteAll');
const agentImage = document.getElementById('agentImage');

// Chat history
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'dark';
document.body.className = `${currentTheme}-theme`;

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.className = `${currentTheme}-theme`;
    localStorage.setItem('theme', currentTheme);
});

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
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load chat history
function loadChatHistory() {
    chatMessages.innerHTML = '';
    chatHistory.forEach(message => displayMessage(message));
}

// Send message
async function sendMessage() {
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
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearChatButton.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    chatHistory = [];
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
});

deleteAllButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
        localStorage.clear();
        chatHistory = [];
        loadChatHistory();
    }
});

// Set agent image
const img = document.createElement('img');
img.src = 'agent-image.jpg'; // You'll need to add your agent image
img.alt = 'AI Agent Lauren';
agentImage.appendChild(img);

// Initial load
loadChatHistory();
