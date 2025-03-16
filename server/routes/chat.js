const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // Protect all chat routes

router.post('/new', async (req, res) => {
  try {
    const chat = new Chat({ userId: req.userId });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    console.log("Attempting to delete chat with ID:", req.params.id);
    console.log("User ID from token:", req.userId); // Changed from req.user.userId
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId }); // Changed from req.user.userId
    if (!chat) {
      console.log("Chat not found or unauthorized for ID:", req.params.id);
      throw new Error('Chat not found or unauthorized');
    }
    console.log("Chat deleted successfully:", chat);
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error("Delete chat error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;