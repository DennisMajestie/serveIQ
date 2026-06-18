require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 4205;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client for Nemotron
const openai = new OpenAI({
  apiKey: process.env.NEMOTRON_API_KEY,
  baseURL: process.env.NEMOTRON_BASE_URL || 'https://integrate.api.nvidia.com/v1'
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nemotron-reasoning-api' });
});

// Streaming reasoning endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, temperature, top_p, max_tokens, reasoning_budget, chat_template_kwargs, stream } = req.body;

    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: model || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: temperature || 0.6,
        top_p: top_p || 0.95,
        max_tokens: max_tokens || 16384,
        reasoning_budget: reasoning_budget || 16384,
        chat_template_kwargs: chat_template_kwargs || { enable_thinking: true },
        stream: true
      });

      // Pipe the stream to response
      for await (const chunk of completion) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming request
      const completion = await openai.chat.completions.create({
        model: model || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: temperature || 0.6,
        top_p: top_p || 0.95,
        max_tokens: max_tokens || 16384,
        reasoning_budget: reasoning_budget || 16384,
        chat_template_kwargs: chat_template_kwargs || { enable_thinking: true },
        stream: false
      });
      res.json(completion);
    }
  } catch (error) {
    console.error('Error in Nemotron API:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Nemotron Reasoning API is running on http://localhost:${PORT}`);
});
