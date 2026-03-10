const jwt = require("jsonwebtoken");

// Simple allow-list for testing
const allowedTesters = [
  "harveywyche@gmail.com",
  "harvey@voxettalabs.com",
];

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_TTL_SECONDS = 60 * 60; // 1 hour

module.exports = async function (context, req) {
  context.log("BODY:", req.body);
  
  const { name, email } = req.body || {};

  if (!email) {
    context.res = {
      status: 400,
      body: { error: "Email is required." }
    };
    return;
  }

  const normalizedEmail = email.toLowerCase();

  if (!allowedTesters.map(e => e.toLowerCase()).includes(normalizedEmail)) {
    context.res = {
      status: 403,
      body: { error: "Access restricted during testing." }
    };
    return;
  }

  const token = jwt.sign(
    { email: normalizedEmail, name: name || "" },
    JWT_SECRET,
    { expiresIn: JWT_TTL_SECONDS }
  );

  context.res = {
    status: 200,
    body: { token }
  };
};
