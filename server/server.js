// ========== IMPORTS ==========
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

// ========== INITIALIZATION ==========
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, '../public')));

// ========== ROUTES ==========
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Agent route using MistralAI
app.post('/api/agent', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        timestamp: new Date().toISOString()
      });
    }

    // Convert chat history to MistralAI format
    const messages = history ? history.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Add the current message
    messages.push({ role: 'user', content: message });

    const requestBody = {
      agent_id: process.env.MISTRAL_AI_AGENT_ID.replace(/['"]/g, ''),
      messages
    };

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.mistral.ai/v1/agents/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_AI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('MistralAI Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestBody
      });
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    
    res.json({
      message: data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Request Error:', error);
    res.status(500).json({
      error: 'Failed to communicate with MistralAI',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/agent');
});
