require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const authMiddleware = require('./middleware/auth');
const Chat = require('./models/Chat');
const { OpenAI } = require('openai');
const { customsearch } = require('@googleapis/customsearch');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
let assistantId;

(async () => {
  try {
    const assistant = await openai.beta.assistants.create({
      name: 'AI Bot Assistant',
      instructions: 'You are a helpful AI assistant. Provide accurate and concise answers.',
      model: 'gpt-4o',
    });
    assistantId = assistant.id;
    console.log('Assistant created with ID:', assistantId);
  } catch (error) {
    console.error('Error creating assistant:', error.message);
  }
})();

const googleSearchClient = customsearch('v1');

io.on('connection', (socket) => {
  console.log('New client connected:', socket.userId);

  socket.on('message', async ({ chatId, content }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
      if (!chat) throw new Error('Chat not found or unauthorized');

      let threadId = chat.threadId;
      if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        chat.threadId = threadId;
      }

      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: content,
      });
      chat.messages.push({ role: 'user', content });
      if (chat.messages.length === 1) {
        const formattedContent = content.charAt(0).toUpperCase() + content.slice(1);
        chat.title = formattedContent.substring(0, 20);
      }

      await chat.save();

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        stream: true,
      });

      let assistantContent = '';
      for await (const event of run) {
        if (event.event === 'thread.message.delta' && event.data.delta.content) {
          assistantContent += event.data.delta.content[0].text.value;
          socket.emit('response', { chatId, content: assistantContent });
        }
      }

      if (assistantContent) {
        chat.messages.push({ role: 'assistant', content: assistantContent });
        chat.updatedAt = new Date();
        await chat.save();
      }
      socket.emit('end', { chatId });
    } catch (error) {
      console.error('Socket message error:', error.message);
      socket.emit('error', error.message);
      socket.emit('end', { chatId });
    }
  });

  // socket.on('internet-search', async ({ chatId, query }) => {
  //   try {
  //     const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
  //     if (!chat) throw new Error('Chat not found or unauthorized');

  //     // Perform Google Search
  //     const response = await googleSearchClient.cse.list({
  //       auth: GOOGLE_API_KEY,
  //       cx: GOOGLE_CSE_ID,
  //       q: query,
  //       num: 5, // Get top 5 results
  //     });

  //     const searchResults = response.data.items?.map((item) => ({
  //       title: item.title,
  //       link: item.link,
  //       snippet: item.snippet,
  //     })) || [];

  //     // Format the search results into a message
  //     let resultContent = '### Internet Search Results\n\n';
  //     searchResults.forEach((result, index) => {
  //       resultContent += `**${index + 1}. ${result.title}**\n${result.snippet}\n[Link](${result.link})\n\n`;
  //     });

  //     // Save the query and results to the chat
  //     chat.messages.push({ role: 'user', content: query });
  //     chat.messages.push({ role: 'internet', content: resultContent });
  //     chat.updatedAt = new Date();
  //     await chat.save();

  //     // Emit the search results back to the client
  //     socket.emit('internet-search-response', { chatId, content: resultContent });
  //     socket.emit('end', { chatId });
  //   } catch (error) {
  //     console.error('Internet search error:', error.message);
  //     socket.emit('error', error.message);
  //     socket.emit('end', { chatId });
  //   }
  // });

  socket.on('internet-search', async ({ chatId, query }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
      if (!chat) throw new Error('Chat not found or unauthorized');

      // Set the chat title if this is the first message
      if (chat.messages.length === 0) {
        // const formattedQuery = query.charAt(0).toUpperCase() + query.slice(1);
        chat.title = (query.charAt(0).toUpperCase() + query.slice(1)).substring(0, 20) +' ...';
      }

      // Perform Google Search
      const response = await googleSearchClient.cse.list({
        auth: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: 10, // Get top 5 results
      });

      const searchResults = response.data.items?.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })) || [];

      // Format the search results with HTML for better styling
      let resultContent = '<div class="search-results">';
      resultContent += `<h3 class="search-title">Internet Search Results for "${query}"</h3>`;
      resultContent += '<ul class="result-list">';
      searchResults.forEach((result, index) => {
        resultContent += `
        <li class="result-item">
          <h4 class="result-heading">${index + 1}. ${result.title}</h4>
          <p class="result-snippet">${result.snippet}</p>
          <a href="${result.link}" class="result-link" target="_blank" rel="noopener noreferrer">${result.link}</a>
        </li>
      `;
      });
      resultContent += '</ul></div>';

      // Save the query and results to the chat
      chat.messages.push({ role: 'user', content: query });
      chat.messages.push({ role: 'internet', content: resultContent });
      chat.updatedAt = new Date();
      await chat.save();

      // Emit the search results back to the client
      socket.emit('internet-search-response', { chatId, content: resultContent });
      socket.emit('end', { chatId });
    } catch (error) {
      console.error('Internet search error:', error.message);
      socket.emit('error', error.message);
      socket.emit('end', { chatId });
    }
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));