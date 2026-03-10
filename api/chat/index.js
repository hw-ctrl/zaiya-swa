const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const JWT_SECRET = process.env.JWT_SECRET;
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT; 
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;

// Your agent details
const AGENT_NAME = "PolicyAssistant";
const AGENT_VERSION = "18";

module.exports = async function (context, req) {
  // --- 1. AUTH CHECK ---
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    context.res = {
      status: 401,
      body: { error: "Missing token." }
    };
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (e) {
    context.res = {
      status: 401,
      body: { error: "Invalid or expired token." }
    };
    return;
  }

  // --- 2. VALIDATE INPUT ---
  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    context.res = {
      status: 400,
      body: { error: "Missing or invalid messages array." }
    };
    return;
  }

  // Convert OpenAI-style messages → AI Projects "input" format
  const input = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // --- 3. BUILD THE CORRECT AI PROJECTS ENDPOINT ---
  // FOUNDRY_ENDPOINT is your project endpoint:
  //   https://faq-agent-test-resource.services.ai.azure.com/api/projects/faq-agent-test
  //
  // We must append the responses API path:
  const url = `${FOUNDRY_ENDPOINT}/openai/deployments/${AGENT_NAME}/responses?api-version=2024-10-01-preview`;

  // --- 4. CALL THE AI PROJECTS RESPONSES API ---
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": FOUNDRY_API_KEY
      },
      body: JSON.stringify({
        input,
        agent: {
          name: AGENT_NAME,
          version: AGENT_VERSION,
          type: "agent_reference"
        }
      })
    });

    const data = await res.json();

    // Extract the agent's reply
    const reply =
      data.output_text ||
      data.output || 
      data.choices?.[0]?.message?.content ||
      JSON.stringify(data);

    context.res = {
      status: 200,
      body: { reply }
    };
  } catch (err) {
    context.log("Error calling Foundry:", err);
    context.res = {
      status: 500,
      body: { error: "Error calling agent." }
    };
  }
};
