const express = require("express");
const router = express.Router();
const { generatePresentation } = require("../services/presentationServices");
const auth = require("../middleware/auth");

// Generate a presentation
router.post("/generate", auth, async (req, res) => {
  const { topic, numSlides, outline } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ message: "Topic is required." });
  }

  try {
    const presentation = await generatePresentation({ topic, numSlides, outline });
    res.json(presentation);
  } catch (error) {
    console.error("Error in /generate route:", error.message);
    res.status(500).json({ message: `Failed to generate presentation: ${error.message}` });
  }
});

module.exports = router;