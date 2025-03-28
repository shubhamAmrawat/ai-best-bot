const { OpenAI } = require("openai");
const Presentation = require("../models/Presentation"); // Import the Presentation model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePresentation({ userId, topic, numSlides, outline, theme }) {
  // Define the Assistant ID (replace with your Assistant's ID)
  const assistantId = process.env.PRESENTATION_ASSISTANT_ID; // Use the actual assistant_id

  // Create a thread for the conversation
  let thread;
  try {
    thread = await openai.beta.threads.create();
    console.log("Thread created with ID:", thread.id);
  } catch (error) {
    console.error("Failed to create thread:", error.message);
    throw new Error(`Failed to create thread: ${error.message}`);
  }

  // Construct the user message with dynamic input
  const userMessage = `
    Create a high-quality, engaging, and professional presentation on the topic "${topic}".
    ${numSlides && numSlides > 0
      ? `The presentation must have exactly ${numSlides} slides.`
      : "The presentation should have a reasonable number of slides (between 5 and 10)."
    }
    ${outline && outline.trim()
      ? `Use the following outline to structure the presentation: ${outline}`
      : "Create a logical and compelling structure for the presentation."
    }
    The user has selected the theme "${theme}", but do not include a theme suggestion in the response.
  `;

  // Add the user message to the thread
  try {
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage,
    });
    console.log("User message added to thread:", userMessage);
  } catch (error) {
    console.error("Failed to add message to thread:", error.message);
    throw new Error(`Failed to add message to thread: ${error.message}`);
  }

  // Run the Assistant on the thread
  let run;
  try {
    run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      max_completion_tokens: 2500,
      temperature: 0.8,
    });
    console.log("Assistant run started with ID:", run.id);
  } catch (error) {
    console.error("Failed to run Assistant:", error.message);
    throw new Error(`Failed to run Assistant: ${error.message}`);
  }

  // Poll for the run to complete and retrieve the response
  let runStatus;
  let presentation;
  try {
    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("Presentation Build Status :", runStatus.status);
      if (runStatus.status === "completed") {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data.find(
          (msg) => msg.role === "assistant"
        );

        if (!assistantMessage || !assistantMessage.content[0]?.text?.value) {
          throw new Error("No valid response from Assistant.");
        }

        let rawContent = assistantMessage.content[0].text.value;
        console.log("Raw Assistant response:", rawContent);

        // Strip markdown code block if present (e.g., ```json ... ```)
        rawContent = rawContent
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "")
          .trim();

        try {
          presentation = JSON.parse(rawContent);
        } catch (parseError) {
          console.error("Failed to parse Assistant response as JSON:", parseError.message);
          console.error("Raw content:", rawContent);
          throw new Error("Invalid response format from Assistant. Expected JSON.");
        }

        if (!presentation.slides || !Array.isArray(presentation.slides)) {
          throw new Error("Assistant response does not contain a valid slides array.");
        }

        break;
      } else if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (runStatus.status === "in_progress" || runStatus.status === "queued");
  } catch (error) {
    console.error("Error retrieving Assistant response:", error.message);
    throw new Error(`Failed to retrieve Assistant response: ${error.message}`);
  }

  // Save the presentation to the database
  try {
    const newPresentation = new Presentation({
      userId,
      title: presentation.slides[0]?.title || "Untitled Presentation",
      slides: presentation.slides,
      theme,
    });
    await newPresentation.save();
    console.log("Presentation saved to database with ID:", newPresentation._id);
  } catch (error) {
    console.error("Failed to save presentation to database:", error.message);
    throw new Error(`Failed to save presentation to database: ${error.message}`);
  }

  return presentation;
}

module.exports = { generatePresentation };