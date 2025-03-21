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
const { OAuth2Client } = require('google-auth-library');
const { generateProject } = require('./services/toolbuilder');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ASSISTANT_ID = process.env.ASSISTANT_ID; // Use the ASSISTANT_ID from .env

if (!ASSISTANT_ID) {
  console.error('ASSISTANT_ID is not set in environment variables');
  process.exit(1); // Exit the process if ASSISTANT_ID is not set
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Mount existing routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// Google Login Endpoint
app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name.split(" ")[0].toLowerCase() + Math.floor(Math.random() * 1000),
        email,
        googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: jwtToken, username: user.username });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(400).json({ error: 'Google login failed' });
  }
});

// Google Signup Endpoint
app.post('/api/auth/google-signup', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = new User({
      username: name.split(" ")[0].toLowerCase() + Math.floor(Math.random() * 1000),
      email,
      googleId,
    });
    await user.save();

    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: jwtToken, username: user.username });
  } catch (error) {
    console.error('Google Signup Error:', error.message);
    res.status(400).json({ error: 'Google signup failed' });
  }
});

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
        assistant_id: ASSISTANT_ID, // Use the ASSISTANT_ID from .env
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

  socket.on('internet-search', async ({ chatId, query }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
      if (!chat) throw new Error('Chat not found or unauthorized');

      if (chat.messages.length === 0) {
        chat.title = (query.charAt(0).toUpperCase() + query.slice(1)).substring(0, 20) + ' ...';
      }

      const response = await googleSearchClient.cse.list({
        auth: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        num: 10,
      });

      const searchResults = response.data.items?.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })) || [];

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

      chat.messages.push({ role: 'user', content: query });
      chat.messages.push({ role: 'internet', content: resultContent });
      chat.updatedAt = new Date();
      await chat.save();

      socket.emit('internet-search-response', { chatId, content: resultContent });
      socket.emit('end', { chatId });
    } catch (error) {
      console.error('Internet search error:', error.message);
      socket.emit('error', error.message);
      socket.emit('end', { chatId });
    }
  });

  socket.on('tool-build', async ({ chatId, prompt, previousCode }) => {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
      if (!chat) throw new Error('Chat not found or unauthorized');

      if (chat.messages.length === 0) {
        chat.title = (prompt.charAt(0).toUpperCase() + prompt.slice(1)).substring(0, 20) + ' ...';
      }

      chat.messages.push({ role: 'user', content: prompt });
      chat.updatedAt = new Date();
      await chat.save();

      const project = await generateProject(prompt, previousCode);

      console.log('Emitting project:', project);
      console.log('Is project.files an object?', typeof project.files === 'object' && !Array.isArray(project.files));

      socket.emit('tool-build', { chatId, project });

      chat.messages.push({
        role: 'assistant',
        content: `I've generated the project "${project.name}" for you. You can now edit the code and preview the result in the StackBlitz IDE.`,
        project,
      });
      await chat.save();

      socket.emit('end', { chatId });
    } catch (error) {
      console.error('Tool build error:', error.message);
      socket.emit('tool-build', { chatId, error: error.message });
      socket.emit('end', { chatId });
    }
  });
 

  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));