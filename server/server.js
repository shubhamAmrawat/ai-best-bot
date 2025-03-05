require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { OpenAI } = require('openai');
const Chat = require('./models/Chat');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let assistantId;
openai.beta.assistants.create({
  name: "Chatbot",
  instructions: "You are a helpful assistant that remembers conversation context.",
  model: "gpt-4o-mini"
}).then(res => {
  assistantId = res.id;
  console.log('Assistant created:', assistantId);
}).catch(err => console.error('Assistant creation error:', err));

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"]
}));
app.use(express.json());

// Routes
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);


// Socket.io with authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

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
        content: content
      });
      chat.messages.push({ role: 'user', content });
      if (chat.messages.length === 1) {
        chat.title = content.substring(0, 30);
      }
      await chat.save();

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        stream: true
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
    } catch (error) {
      console.error('Socket message error:', error.message);
      socket.emit('error', error.message);
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err);
});