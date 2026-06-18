const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const http = require('http');

const API_KEY = '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';
const BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'meta/llama-3.1-70b-instruct';
const LOG_FILE = path.join(__dirname, 'agent-logs.json');
const PORT = 4242;

const openai = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

const state = { status: 'idle', task: '', steps: [], currentReasoning: '', currentResponse: '' };

function updateState(data) {
  Object.assign(state, data);
  fs.writeFileSync(LOG_FILE, JSON.stringify(state, null, 2));
}

function readFile(filePath) {
  try {
    const full = path.resolve(process.cwd(), filePath);
    return fs.readFileSync(full, 'utf8').slice(0, 8000);
  } catch (e) { return `ERROR: ${e.message}`; }
}

function writeFile(filePath, content) {
  try {
    const full = path.resolve(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    return `Written ${content.length} bytes to ${filePath}`;
  } catch (e) { return `ERROR: ${e.message}`; }
}

function listDir(dirPath) {
  try {
    const full = path.resolve(process.cwd(), dirPath);
    return fs.readdirSync(full).join('\n');
  } catch (e) { return `ERROR: ${e.message}`; }
}

const systemPrompt = `You are a high-capability Autonomous Coding Agent.

You operate in an agentic loop. Each turn you must either use a tool OR indicate you are done.

Available tools (use EXACTLY this format):
  CALL: read_file("path/to/file")
  CALL: write_file("path/to/file", "content")
  CALL: list_dir("path/to/dir")

When a task is complete, end your response with exactly: DONE

Rules:
- Always think step-by-step before acting
- Only use one tool call per response
- After a tool returns results, analyze them before acting again
- If you cannot complete the task, explain why and then write DONE`;

async function runAgent(userPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let step = 1;
  const stepsData = [];
  updateState({ status: 'running', task: userPrompt, steps: [], currentReasoning: '', currentResponse: '' });

  while (step <= 15) {
    console.log(`\n\x1b[36m--- STEP ${step} ---\x1b[0m`);
    const stepObj = { id: step, reasoning: '', response: '', tool: null, toolOutput: '' };

    try {
      console.log(`Sending request to NVIDIA API (Model: ${MODEL})...`);
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
        stream: false,
      });

      const fullResponse = completion.choices[0].message.content;
      console.log('\n\x1b[32m--- AGENT RESPONSE ---\x1b[0m');
      console.log(fullResponse);
      
      stepObj.response = fullResponse;
      updateState({ currentResponse: fullResponse });

      messages.push({ role: 'assistant', content: fullResponse });

      const toolMatch = fullResponse.match(/CALL:\s*(\w+)\(([^)]*)\)/s);
      if (toolMatch) {
        const toolName = toolMatch[1];
        const rawArgs = toolMatch[2].trim();
        const args = rawArgs.match(/"([^"]*)"/g)?.map(s => s.slice(1, -1)) || [];
        stepObj.tool = toolName;

        let toolOutput = '';
        if (toolName === 'read_file')  toolOutput = readFile(args[0]);
        else if (toolName === 'write_file') toolOutput = writeFile(args[0], args[1]);
        else if (toolName === 'list_dir')  toolOutput = listDir(args[0]);
        else toolOutput = `Unknown tool: ${toolName}`;

        stepObj.toolOutput = toolOutput;
        console.log(`\x1b[33m[TOOL: ${toolName}]\x1b[0m`, toolOutput.slice(0, 200));
        messages.push({ role: 'user', content: `Tool output for ${toolName}:\n${toolOutput}` });
      }

      if (fullResponse.includes('DONE')) {
        console.log('\x1b[32m✓ Agent signalled completion.\x1b[0m');
        stepsData.push(stepObj);
        updateState({ steps: stepsData, status: 'finished', currentReasoning: '', currentResponse: '' });
        break;
      }

      stepsData.push(stepObj);
      updateState({ steps: stepsData, currentReasoning: '', currentResponse: '' });
      step++;

    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.response ? `API Error: ${err.status} - ${JSON.stringify(err.response.data)}` : err.message;
      updateState({ status: 'error', error: errorMsg });
      break;
    }
  }

  if (state.status === 'running') {
    updateState({ status: 'finished' });
  }
}

// Server setup
const server = http.createServer((req, res) => {
  console.log('Incoming request:', req.method, req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve dashboard at root
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const dashboardPath = path.join(__dirname, 'nemotron-dashboard.html');
    console.log('Trying to read dashboard from:', dashboardPath);
    try {
      const html = fs.readFileSync(dashboardPath, 'utf8');
      console.log('Successfully read dashboard HTML, length:', html.length);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html, 'utf8')
      });
      res.end(html);
      return;
    } catch (e) {
      console.error('Error reading dashboard:', e);
      const errMsg = 'Not Found: ' + e.message;
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(errMsg, 'utf8')
      });
      res.end(errMsg);
      return;
    }
  }

  // GET request for state
  if (req.method === 'GET' && req.url === '/status') {
    const jsonData = JSON.stringify(state);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(jsonData, 'utf8')
    });
    res.end(jsonData);
    return;
  }

  // POST request to start a task
  if (req.method === 'POST' && req.url === '/task') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (data.task && state.status !== 'running') {
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'starting', task: data.task }));
          // Run agent asynchronously
          runAgent(data.task);
        } else if (state.status === 'running') {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Agent is already running' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing task' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => console.log(`\x1b[32m✓ Nemotron server listening on http://localhost:${PORT}\x1b[0m`));

const args = process.argv.slice(2).filter(a => a !== '--autopilot');
if (args.length > 0) {
  runAgent(args.join(' '));
}
