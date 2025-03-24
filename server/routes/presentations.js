const express = require("express");
const router = express.Router();
const { generatePresentation } = require("../services/presentationServices");
const Presentation = require("../models/Presentation"); // Import the Presentation model
const auth = require("../middleware/auth");

// Generate a presentation
router.post("/generate", auth, async (req, res) => {
  const { topic, numSlides, outline, theme } = req.body;
  const userId = req.userId; // From auth middleware

  if (!topic || !topic.trim()) {
    return res.status(400).json({ message: "Topic is required." });
  }
  if (!theme || !theme.trim()) {
    return res.status(400).json({ message: "Theme is required." });
  }

  try {
    const presentation = await generatePresentation({ userId, topic, numSlides, outline, theme });
    res.json(presentation);
  } catch (error) {
    console.error("Error in /generate route:", error.message);
    res.status(500).json({ message: `Failed to generate presentation: ${error.message}` });
  }
});

// Retrieve all presentations for the authenticated user
router.get("/history", auth, async (req, res) => {
  const userId = req.userId; // From auth middleware

  try {
    const presentations = await Presentation.find({ userId })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean(); // Convert to plain JavaScript objects
    res.json(presentations);
  } catch (error) {
    console.error("Error in /history route:", error.message);
    res.status(500).json({ message: `Failed to retrieve presentations: ${error.message}` });
  }
});

module.exports = router;