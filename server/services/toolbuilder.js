const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to generate a project using OpenAI with retry logic
const generateProject = async (prompt, previousCode = null, retries = 2) => {
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    if (!process.env.ASSISTANT_ID) {
      throw new Error('ASSISTANT_ID is not set in environment variables');
    }

    // Craft the prompt for OpenAI with instructions for a single HTML file
    let openAiPrompt = `
You are an expert web developer specializing in vanilla HTML, CSS, and JavaScript. I want you to generate a complete web project based on the following prompt: "${prompt}". The project must consist of a single file named "index.html" that includes the HTML structure, CSS styles (inside a <style> tag in the <head>), and JavaScript code (inside a <script> tag in the <body>).

- **index.html**: The main HTML file with the structure of the app, embedded CSS in a <style> tag, and embedded JavaScript in a <script> tag.

For the file, provide the full code in a code block with the file name as the language identifier (e.g., \`\`\`index.html\n...\n\`\`\`). Ensure the project is fully functional and can be run in a StackBlitz environment using the "html" template.

### Specific Instructions:
- The file name must be exactly "index.html". Do not use generic names like "html".
- The code must match the user's request exactly. For example, if the prompt is "build a to-do list app," create a functional to-do list with an input field to add tasks, a list to display tasks, and a button to remove tasks.
- Use vanilla JavaScript (no frameworks like React) and DOM manipulation for interactivity.
- Ensure the styling in the <style> tag makes the app visually appealing and usable (e.g., for a to-do list, use a clean layout with proper spacing and colors).
- The <style> tag must include a background gradient or color for the body to enhance the app's appearance.
- If the prompt is unclear, make reasonable assumptions but prioritize functionality.
- Ensure that the JavaScript in the <script> tag interacts correctly with the HTML elements (e.g., use matching IDs and classes).
- Ensure that the CSS in the <style> tag styles the HTML elements correctly (e.g., use matching classes and IDs).
- Test that the entire project works as a single file: the HTML should render correctly, the CSS should style the elements, and the JavaScript should add interactivity.
`;

    // If previousCode is provided, instruct the assistant to modify the existing code
    if (previousCode) {
      openAiPrompt += `
### Additional Instructions for Modifying Existing Code:
I am providing the existing "index.html" code from a previous project below. Your task is to modify this code to incorporate the new functionality requested in the prompt: "${prompt}". Do not create a new project from scratch—update the existing code to add the requested features while preserving the existing functionality unless explicitly asked to remove it.

#### Existing index.html Code:
\`\`\`index.html
${previousCode}
\`\`\`

- Modify the existing HTML, CSS, and JavaScript in the "index.html" file to add the new functionality.
- Ensure that the modified code remains fully functional and can be run in a StackBlitz environment.
- Preserve the existing structure and styling unless the prompt explicitly asks for changes.
- If the prompt requests new features (e.g., adding multiplication and subtraction to an addition app), integrate these features seamlessly into the existing app.
- If there are conflicts or ambiguities, make reasonable assumptions to ensure the app remains functional and user-friendly.
`;
    }

    openAiPrompt += `
### Example for "build a calculator app":
If the prompt is "build a calculator app," the file should look like this:

**index.html**
\`\`\`index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calculator App</title>
    <style>
      .calculator {
        width: 300px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .display {
        background: #fff;
        padding: 10px;
        font-size: 24px;
        text-align: right;
        border-radius: 5px;
        margin-bottom: 10px;
      }

      .buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
      }

      button {
        padding: 15px;
        font-size: 18px;
        border: none;
        background: #e0e0e0;
        border-radius: 5px;
        cursor: pointer;
      }

      button:hover {
        background: #d0d0d0;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <div class="calculator">
      <div class="display" id="display">0</div>
      <div class="buttons">
        <button onclick="clearDisplay()">C</button>
        <button onclick="appendOperator('/')">/</button>
        <button onclick="appendOperator('*')">*</button>
        <button onclick="appendNumber('7')">7</button>
        <button onclick="appendNumber('8')">8</button>
        <button onclick="appendNumber('9')">9</button>
        <button onclick="appendOperator('-')">-</button>
        <button onclick="appendNumber('4')">4</button>
        <button onclick="appendNumber('5')">5</button>
        <button onclick="appendNumber('6')">6</button>
        <button onclick="appendOperator('+')">+</button>
        <button onclick="appendNumber('1')">1</button>
        <button onclick="appendNumber('2')">2</button>
        <button onclick="appendNumber('3')">3</button>
        <button onclick="calculate()">=</button>
        <button onclick="appendNumber('0')">0</button>
      </div>
    </div>
    <script>
      let equation = '';
      const display = document.getElementById('display');

      function appendNumber(num) {
        if (display.textContent === '0') {
          display.textContent = num;
        } else {
          display.textContent += num;
        }
        equation += num;
      }

      function appendOperator(operator) {
        equation += ' ' + operator + ' ';
        display.textContent = '0';
      }

      function calculate() {
        try {
          const result = eval(equation);
          display.textContent = result;
          equation = result.toString();
        } catch (error) {
          display.textContent = 'Error';
          equation = '';
        }
      }

      function clearDisplay() {
        display.textContent = '0';
        equation = '';
      }
    </script>
  </body>
</html>
\`\`\`

### Example for "build a to-do list app":
If the prompt is "build a to-do list app," the file should look like this:

**index.html**
\`\`\`index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>To-Do List App</title>
    <style>
      .todo-container {
        width: 400px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      h1 {
        text-align: center;
        color: #333;
      }

      .input-container {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      input {
        flex: 1;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 5px;
      }

      button {
        padding: 10px 20px;
        font-size: 16px;
        border: none;
        background: #007bff;
        color: white;
        border-radius: 5px;
        cursor: pointer;
      }

      button:hover {
        background: #0056b3;
      }

      ul {
        list-style: none;
        padding: 0;
      }

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #fff;
        border-radius: 5px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      li button {
        background: #dc3545;
      }

      li button:hover {
        background: #c82333;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <div class="todo-container">
      <h1>To-Do List</h1>
      <div class="input-container">
        <input type="text" id="taskInput" placeholder="Add a new task..." />
        <button onclick="addTask()">Add</button>
      </div>
      <ul id="taskList"></ul>
    </div>
    <script>
      const taskInput = document.getElementById('taskInput');
      const taskList = document.getElementById('taskList');

      function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const li = document.createElement('li');
        li.textContent = taskText;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => li.remove();

        li.appendChild(deleteButton);
        taskList.appendChild(li);

        taskInput.value = '';
      }

      taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addTask();
        }
      });
    </script>
  </body>
</html>
\`\`\`

Focus on clean, maintainable code with proper HTML, CSS, and JavaScript practices. Ensure the entire project works as a single file. Now, generate the project based on the prompt: "${prompt}".
`;

    // Create a thread and send the prompt to OpenAI
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: openAiPrompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID,
      stream: true,
    });

    let responseContent = '';
    for await (const event of run) {
      if (event.event === 'thread.message.delta' && event.data.delta.content) {
        responseContent += event.data.delta.content[0].text.value;
      }
    }

    console.log('OpenAI response:', responseContent);

    if (!responseContent) {
      throw new Error('OpenAI response is empty');
    }

    // Parse the response to extract the single file
    const files = {};
    const fileRegex = /```(\S+)\s*\n([\s\S]*?)\s*```/g;
    let match;
    while ((match = fileRegex.exec(responseContent)) !== null) {
      const fileName = match[1];
      let fileContent = match[2];
      fileContent = fileContent.trim();

      let correctedFileName = fileName;
      if (fileName === 'html') correctedFileName = 'index.html';

      if (correctedFileName === 'index.html') {
        files[correctedFileName] = fileContent;
      } else {
        console.warn(`Ignoring unexpected file: ${fileName}`);
      }
    }

    // Ensure the required file is present
    const requiredFiles = ['index.html'];
    requiredFiles.forEach((file) => {
      if (!files[file]) {
        throw new Error(`File ${file} not generated by OpenAI.`);
      }
    });

    console.log('Generated project files:', Object.keys(files));

    return {
      name: prompt.substring(0, 20),
      files,
    };
  } catch (error) {
    console.error('Error generating project with OpenAI:', error.message);
    if (retries > 0) {
      console.warn('Retrying OpenAI request...');
      return await generateProject(prompt, previousCode, retries - 1);
    }
    throw new Error('Failed to generate project after maximum retries: ' + error.message);
  }
};

module.exports = { generateProject };