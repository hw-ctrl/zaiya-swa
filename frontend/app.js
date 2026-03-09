let authToken = null;

async function login() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const errorEl = document.getElementById("auth-error");

  errorEl.textContent = "";

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Access denied.";
    return;
  }

  authToken = data.token;

  document.getElementById("auth-section").style.display = "none";
  document.getElementById("chat-section").style.display = "block";
}

async function send() {
  const msgInput = document.getElementById("msg");
  const msg = msgInput.value.trim();
  if (!msg) return;

  const log = document.getElementById("chat-log");
  log.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  msgInput.value = "";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + authToken
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: msg }]
    })
  });

  const data = await res.json();

  if (!res.ok) {
    log.innerHTML += `<p style="color:red;"><b>Error:</b> ${data.error || "Request failed"}</p>`;
    return;
  }

  const reply = data.reply || JSON.stringify(data);
  log.innerHTML += `<p><b>Zaiya:</b> ${reply}</p>`;
}
