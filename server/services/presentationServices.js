const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePresentation({ topic, numSlides, outline }) {
  const textPrompt = `
    You are a world-class presentation designer with a knack for creativity and storytelling. Create a high-quality, engaging, and professional presentation on the topic "${topic}".
    ${numSlides && numSlides > 0
      ? `The presentation must have exactly ${numSlides} slides.`
      : "The presentation should have a reasonable number of slides (between 5 and 10)."
    }
    ${outline && outline.trim()
      ? `Use the following outline to structure the presentation: ${outline}`
      : "Create a logical and compelling structure for the presentation, starting with an attention-grabbing title slide, followed by a mix of content slides (e.g., informational, data-driven, or quote slides), and ending with a memorable conclusion slide."
    }
    For each slide, provide:
    - A concise, captivating title (5-10 words) that grabs attention
    - A subtitle (3-8 words) that summarizes the slide's focus
    - A list of 3-5 detailed bullet points (each 15-25 words), blending facts, storytelling, examples, data points, or actionable insights to make the content engaging, informative, and professional
    - A description of a visual element (e.g., "A vibrant festival scene in India", "A serene Himalayan landscape") to complement the slide's content
    - Presenter notes (50-100 words) to guide the speaker on what to say during the slide, including context, transitions, or key points to emphasize
    Additionally, provide a "themeSuggestion" field at the root level to suggest a visual theme for the presentation (e.g., "modern blue", "vibrant orange", "minimalist white").
    Return the result as a JSON object with a "themeSuggestion" field and an array of slides, where each slide has a "title", "subtitle", "content" array, "visualDescription", and "notes" field.
    Example format:
    {
      "themeSuggestion": "modern blue",
      "slides": [
        {
          "title": "Welcome to Incredible India",
          "subtitle": "A Journey of Diversity",
          "content": [
            "India: a mosaic of 1.4 billion stories and cultures.",
            "From Himalayan peaks to Kerala's backwaters, diversity thrives.",
            "Ancient traditions meet modern innovation in perfect harmony."
          ],
          "visualDescription": "A vibrant collage of Indian culture and landscapes",
          "notes": "Start with a warm welcome, briefly introduce India's diversity, and set the tone for an exciting journey through the presentation."
        },
        {
          "title": "Festivals That Unite",
          "subtitle": "Celebrating Joy Across India",
          "content": [
            "Diwali lights up homes with joy and togetherness.",
            "Holi paints streets in colors of love and unity.",
            "Eid and Christmas reflect India's interfaith harmony."
          ],
          "visualDescription": "A colorful Holi festival celebration with people throwing colors",
          "notes": "Highlight the cultural significance of these festivals, share a personal anecdote if possible, and transition to the next topic."
        }
      ]
    }
    Ensure the response is a valid JSON string without any markdown formatting (e.g., do not wrap the JSON in \`\`\`json ... \`\`\`).
  `;

  let presentation;
  try {
    console.log("Generating presentation content for topic:", topic);
    const textResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a world-class presentation designer with a knack for creativity and storytelling." },
        { role: "user", content: textPrompt },
      ],
      max_tokens: 2500, // Increased to accommodate notes and theme suggestion
      temperature: 0.8,
    });

    let rawContent = textResponse.choices[0].message.content;
    console.log("Raw OpenAI text response:", rawContent);

    // Strip markdown code block if present (e.g., ```json ... ```)
    rawContent = rawContent.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

    try {
      presentation = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError.message);
      console.error("Raw content:", rawContent);
      throw new Error("Invalid response format from OpenAI. Expected JSON.");
    }

    if (!presentation.slides || !Array.isArray(presentation.slides)) {
      throw new Error("OpenAI response does not contain a valid slides array.");
    }
    if (!presentation.themeSuggestion) {
      presentation.themeSuggestion = "modern blue"; // Fallback theme
    }
  } catch (error) {
    console.error("Error generating presentation content:", error.message);
    throw new Error(`Failed to generate presentation content: ${error.message}`);
  }

  return presentation;
}

module.exports = { generatePresentation };