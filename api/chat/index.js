const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;

module.exports = async function (context, req) {
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

  const { messages } = req.body || {};
  if (!messages) {
    context.res = {
      status: 400,
      body: { error: "Missing messages." }
    };
    return;
  }

  try {
    const res = await fetch(FOUNDRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": FOUNDRY_API_KEY
      },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();

    // Adjust this based on your Foundry response shape
    const reply =
      data.output_text ||
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
