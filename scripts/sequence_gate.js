const noise_content = document.getElementById("noise_content");
const timer_chip = document.getElementById("timer_chip");
const state_chip = document.getElementById("state_chip");
const typed_command = document.getElementById("typed_command");
const response_box = document.getElementById("response_box");

let seconds_remaining = 0;
let typed_text = "";
let active_sequence = "";

const api_base_url = "https://s2crin9id1.execute-api.us-east-2.amazonaws.com";

function pick_random(source_text) {
  return source_text[Math.floor(Math.random() * source_text.length)];
}

function make_random_segment(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += pick_random(chars);
  }

  return output;
}

function make_random_line() {
  const labels = [
    "PROC_SCAN",
    "NODE_SYNC",
    "STACK_TRACE",
    "AUTH_FIELD",
    "NULL_FRAME",
    "GATE_SIGNAL",
    "VECTOR_PASS",
    "CACHE_RING",
    "KERNEL_EDGE",
    "ACCESS_FIELD"
  ];

  const label = labels[Math.floor(Math.random() * labels.length)];

  return (
    "[" +
    make_random_segment(2) +
    ":" +
    make_random_segment(2) +
    ":" +
    make_random_segment(2) +
    "] " +
    label +
    "  " +
    make_random_segment(4) +
    "_" +
    make_random_segment(3) +
    "  " +
    make_random_segment(6) +
    "  " +
    make_random_segment(5)
  );
}

function build_noise_block(sequence_value) {
  const line_list = [];
  const insert_index = Math.floor(Math.random() * 8) + 3;

  line_list.push(":: rotating sequence field ::");
  line_list.push("");

  for (let index = 0; index < 14; index += 1) {
    if (index === insert_index) {
      line_list.push(
        make_random_line() +
          "   <span class=\"active_sequence\">" +
          sequence_value +
          "</span>   " +
          make_random_segment(6)
      );
    } else {
      line_list.push(make_random_line());
    }
  }

  line_list.push("");
  line_list.push("hint> enter the visible active token");
  return line_list.join("\n");
}

function render_typed_command() {
  typed_command.textContent = typed_text;
}

function render_timer() {
  const safe_seconds = Number.isFinite(seconds_remaining) ? Math.max(seconds_remaining, 0) : 0;
  const minutes = Math.floor(safe_seconds / 60);
  const seconds = safe_seconds % 60;

  timer_chip.textContent =
    "window_sync::" + minutes + ":" + String(seconds).padStart(2, "0");

  seconds_remaining -= 1;
}

function set_state_text(value) {
  state_chip.textContent = "state::" + value;
}

function set_response_text(message, state_name = "") {
  response_box.className = "response_box";

  if (state_name === "error") {
    response_box.classList.add("error_state");
  }

  if (state_name === "success") {
    response_box.classList.add("success_state");
  }

  response_box.textContent = message;
}

async function refresh_sequence_state() {
  try {
    const response = await fetch(`${api_base_url}/api/sequence_state`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Sequence state request failed");
    }

    if (!data.active_sequence || typeof data.next_change_in !== "number") {
      throw new Error("API returned invalid sequence data");
    }

    active_sequence = data.active_sequence;
    seconds_remaining = data.next_change_in;

    noise_content.classList.add("fade_state");

    window.setTimeout(() => {
      noise_content.innerHTML = build_noise_block(active_sequence);
      noise_content.classList.remove("fade_state");
    }, 120);

    set_response_text("");
    set_state_text(typed_text ? "typing" : "awaiting_input");
  } catch (error) {
    set_response_text(`[ERROR] ${error.message}`, "error");
    set_state_text("offline");
  }
}

async function submit_sequence_gate() {
  const code = typed_text.trim();

  if (!code) {
    set_response_text("[WARN] no sequence entered", "error");
    set_state_text("input_required");
    return;
  }

  set_response_text("[CHECK] validating sequence...");
  set_state_text("verifying");

  try {
    const response = await fetch(`${api_base_url}/api/sequence_gate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Sequence validation failed");
    }

    if (data.success) {
      set_response_text("[OK] gate accepted\n[REDIRECT] opening admin login", "success");
      set_state_text("accepted");

      window.setTimeout(() => {
        window.location.href = data.redirect_to || "../pages/admin.html";
      }, 800);

      return;
    }

    set_response_text(data.message || "[DENIED] sequence rejected", "error");
    set_state_text("rejected");
  } catch (error) {
    set_response_text(`[ERROR] ${error.message}`, "error");
    set_state_text("error");
  }
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    submit_sequence_gate();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    typed_text = typed_text.slice(0, -1);
    render_typed_command();
    set_state_text(typed_text ? "typing" : "awaiting_input");
    return;
  }

  if (event.key === "Escape") {
    typed_text = "";
    render_typed_command();
    set_response_text("");
    set_state_text("awaiting_input");
    return;
  }

  if (event.key.length === 1) {
    typed_text += event.key;
    render_typed_command();
    set_state_text("typing");
  }
});

render_typed_command();
refresh_sequence_state();
window.setInterval(refresh_sequence_state, 30000);
window.setInterval(render_timer, 1000);