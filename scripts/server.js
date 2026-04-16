const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const sequence_list = [
  "GLASS_ROOM_17",
  "NOVA_LOCK_42",
  "STATIC_THREAD_8",
  "RIFT_ACCESS_91",
  "ECHO_KEY_33",
  "VOID_PULSE_74"
];

const rotation_ms = 3 * 60 * 1000;
const grace_ms = 30 * 1000;

const gate_sessions = new Map();

function get_sequence_index(timestamp) {
  return Math.floor(timestamp / rotation_ms) % sequence_list.length;
}

function get_active_sequence(timestamp = Date.now()) {
  return sequence_list[get_sequence_index(timestamp)];
}

function get_previous_sequence(timestamp = Date.now()) {
  return sequence_list[get_sequence_index(timestamp - grace_ms)];
}

function get_next_change_in_seconds(timestamp = Date.now()) {
  const elapsed = timestamp % rotation_ms;
  return Math.ceil((rotation_ms - elapsed) / 1000);
}

function parse_cookies(cookie_header = "") {
  const output = {};

  cookie_header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const equal_index = trimmed.indexOf("=");
    if (equal_index === -1) return;

    const key = trimmed.slice(0, equal_index).trim();
    const value = trimmed.slice(equal_index + 1).trim();

    output[key] = decodeURIComponent(value);
  });

  return output;
}

function create_gate_token() {
  return crypto.randomBytes(24).toString("hex");
}

function gate_cleanup() {
  const now = Date.now();

  for (const [token, expires_at] of gate_sessions.entries()) {
    if (expires_at <= now) {
      gate_sessions.delete(token);
    }
  }
}

function gate_middleware(req, res, next) {
  gate_cleanup();

  const cookies = parse_cookies(req.headers.cookie || "");
  const gate_token = cookies.gate_token;

  if (!gate_token) {
    return res.redirect("/test.html");
  }

  const expires_at = gate_sessions.get(gate_token);

  if (!expires_at || expires_at <= Date.now()) {
    gate_sessions.delete(gate_token);
    res.setHeader("Set_Cookie", "gate_token=; Max_Age=0; Path=/");
    return res.redirect("/test.html");
  }

  next();
}

app.get("/api/sequence_state", (req, res) => {
  const now = Date.now();

  res.json({
    active_sequence: get_active_sequence(now),
    next_change_in: get_next_change_in_seconds(now)
  });
});

app.post("/api/sequence_gate", (req, res) => {
  const code = String(req.body.code || "").trim();
  const now = Date.now();

  const active_sequence = get_active_sequence(now);
  const previous_sequence = get_previous_sequence(now);

  if (code === active_sequence || code === previous_sequence) {
    const gate_token = create_gate_token();
    const expires_at = Date.now() + 10 * 60 * 1000;

    gate_sessions.set(gate_token, expires_at);

    res.setHeader(
      "Set_Cookie",
      `gate_token=${gate_token}; HttpOnly; Path=/; SameSite=Lax; Max_Age=600`
    );

    return res.json({
      success: true,
      redirect_to: "../pages/admin.html"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Sequence rejected."
  });
});

app.get("../pages/admin.html", gate_middleware, (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/admin.html"));
});

app.get("/", (req, res) => {
  res.redirect("../pages/test.html");
});

app.listen(port, () => {
  console.log(`Open http://localhost:${port}`);
});