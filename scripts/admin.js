const API_BASE = "https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod";
const COGNITO_DOMAIN = "https://us-east-2jfof4gtel.auth.us-east-2.amazoncognito.com";
const CLIENT_ID = "5iaear77vsftb0fupep3mics45";
const REDIRECT_URI = "https://nsportfolio.net/admin.html";
const ALLOWED_ADMIN_EMAIL = "nickysom@icloud.com";

const SESSION_TOKEN_KEY = "admin_id_token";
const SESSION_EMAIL_KEY = "admin_email";
const SESSION_TIMER_KEY = "admin_session_expires_at";
const PKCE_VERIFIER_KEY = "pkce_code_verifier";
const SESSION_MS = 5 * 60 * 1000;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const auth_status       = document.getElementById("auth_status");
const login_btn         = document.getElementById("login_btn");
const logout_btn        = document.getElementById("logout_btn");
const dashboard_shell   = document.getElementById("dashboard_shell");
const welcome_screen    = document.getElementById("welcome_screen");
const sidebar_auth_text = document.getElementById("sidebar_auth_text");
const toast_el          = document.getElementById("toast");
const search_input      = document.getElementById("search_input");
const search_results    = document.getElementById("search_results");

const nav_tabs       = document.querySelectorAll(".nav_tab");
const dashboard_tabs = document.querySelectorAll(".dashboard_tab");

const site_form   = document.getElementById("site_form");
const site_fields = {
  title:     document.getElementById("title_input"),
  subtitle:  document.getElementById("subtitle_input"),
  intro:     document.getElementById("intro_input"),
  about:     document.getElementById("about_input"),
  email:     document.getElementById("email_input"),
  linkedin:  document.getElementById("linkedin_input"),
  github:    document.getElementById("github_input"),
  instagram: document.getElementById("instagram_input"),
};

const projects_count = document.getElementById("projects_count");
const posts_count    = document.getElementById("posts_count");
const resumes_count  = document.getElementById("resumes_count");
const work_count     = document.getElementById("work_count");
const academia_count = document.getElementById("academia_count");
const awards_count   = document.getElementById("awards_count");

const projects_list = document.getElementById("projects_list");
const posts_list    = document.getElementById("posts_list");
const resumes_list  = document.getElementById("resumes_list");
const work_list     = document.getElementById("work_list");
const academia_list = document.getElementById("academia_list");
const awards_list   = document.getElementById("awards_list");

const new_project_btn  = document.getElementById("new_project_btn");
const new_post_btn     = document.getElementById("new_post_btn");
const new_resume_btn   = document.getElementById("new_resume_btn");
const new_work_btn     = document.getElementById("new_work_btn");
const new_academia_btn = document.getElementById("new_academia_btn");
const new_awards_btn   = document.getElementById("new_awards_btn");

const project_form   = document.getElementById("project_form");
const project_fields = {
  id:          document.getElementById("project_id"),
  title:       document.getElementById("project_title"),
  slug:        document.getElementById("project_slug"),
  category:    document.getElementById("project_category"),
  description: document.getElementById("project_description"),
  link:        document.getElementById("project_link"),
  image_url:   document.getElementById("project_image_url"),
  is_visible:  document.getElementById("project_is_visible"),
  is_featured: document.getElementById("project_is_featured"),
  sort_order:  document.getElementById("project_sort_order"),
};
const reset_project_btn = document.getElementById("reset_project_btn");

const post_form   = document.getElementById("post_form");
const post_fields = {
  id:              document.getElementById("post_id"),
  title:           document.getElementById("post_title"),
  slug:            document.getElementById("post_slug"),
  excerpt:         document.getElementById("post_excerpt"),
  content:         document.getElementById("post_content"),
  cover_image_url: document.getElementById("post_cover_image_url"),
  is_published:    document.getElementById("post_is_published"),
  sort_order:      document.getElementById("post_sort_order"),
};
const reset_post_btn = document.getElementById("reset_post_btn");

const resume_form   = document.getElementById("resume_form");
const resume_fields = {
  id:         document.getElementById("resume_id"),
  title:      document.getElementById("resume_title"),
  file_name:  document.getElementById("resume_file_name"),
  file_url:   document.getElementById("resume_file_url"),
  is_current: document.getElementById("resume_is_current"),
};
const reset_resume_btn = document.getElementById("reset_resume_btn");

const work_form   = document.getElementById("work_form");
const work_fields = {
  id:           document.getElementById("work_id"),
  title:        document.getElementById("work_title"),
  subtitle:     document.getElementById("work_subtitle"),
  organization: document.getElementById("work_organization"),
  date_range:   document.getElementById("work_date_range"),
  description:  document.getElementById("work_description"),
  link:         document.getElementById("work_link"),
  sort_order:   document.getElementById("work_sort_order"),
};
const reset_work_btn = document.getElementById("reset_work_btn");

const academia_form   = document.getElementById("academia_form");
const academia_fields = {
  id:           document.getElementById("academia_id"),
  title:        document.getElementById("academia_title"),
  subtitle:     document.getElementById("academia_subtitle"),
  organization: document.getElementById("academia_organization"),
  date_range:   document.getElementById("academia_date_range"),
  description:  document.getElementById("academia_description"),
  link:         document.getElementById("academia_link"),
  sort_order:   document.getElementById("academia_sort_order"),
};
const reset_academia_btn = document.getElementById("reset_academia_btn");

const awards_form   = document.getElementById("awards_form");
const awards_fields = {
  id:           document.getElementById("awards_id"),
  title:        document.getElementById("awards_title"),
  subtitle:     document.getElementById("awards_subtitle"),
  organization: document.getElementById("awards_organization"),
  date_range:   document.getElementById("awards_date_range"),
  description:  document.getElementById("awards_description"),
  link:         document.getElementById("awards_link"),
  sort_order:   document.getElementById("awards_sort_order"),
};
const reset_awards_btn = document.getElementById("reset_awards_btn");

// ── State ─────────────────────────────────────────────────────────────────────

let projects_cache = [];
let posts_cache    = [];
let resumes_cache  = [];
let work_cache     = [];
let academia_cache = [];
let awards_cache   = [];
let logout_timer   = null;

// ── Toast ─────────────────────────────────────────────────────────────────────

let toast_timeout = null;
const show_toast = (text, is_error = false) => {
  toast_el.textContent = text;
  toast_el.className = "show" + (is_error ? " error" : "");
  if (toast_timeout) clearTimeout(toast_timeout);
  toast_timeout = setTimeout(() => { toast_el.className = ""; }, 3000);
};

// ── DynamoDB unmarshaller ─────────────────────────────────────────────────────
// Your API returns raw DynamoDB JSON like {"S":"hello"} and {"N":"1"}.
// This converts it back into plain JS values.

const unmarshall = (obj) => {
  if (obj["S"]    !== undefined) return obj["S"];
  if (obj["N"]    !== undefined) return Number(obj["N"]);
  if (obj["BOOL"] !== undefined) return obj["BOOL"];
  if (obj["NULL"] !== undefined) return null;
  if (obj["L"]    !== undefined) return obj["L"].map(unmarshall);
  if (obj["M"]    !== undefined) {
    const result = {};
    for (const key of Object.keys(obj["M"])) {
      result[key] = unmarshall(obj["M"][key]);
    }
    return result;
  }
  return obj;
};

const unmarshall_response = (data) => {
  const id    = data.id    ? unmarshall(data.id)    : "";
  const items = data.items ? unmarshall(data.items) : [];
  return { id, items };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const switch_tab = (tab_id) => {
  nav_tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab_id));
  dashboard_tabs.forEach((s) => s.classList.toggle("active", s.id === tab_id));
};

nav_tabs.forEach((button) => {
  button.addEventListener("click", () => switch_tab(button.dataset.tab));
});

// ── Auth views ────────────────────────────────────────────────────────────────

const set_logged_out_view = () => {
  auth_status.textContent = "Not signed in";
  sidebar_auth_text.textContent = "Signed out";
  login_btn.style.display = "inline-block";
  logout_btn.style.display = "none";
  welcome_screen.style.display = "flex";
  dashboard_shell.style.display = "none";
};

const set_logged_in_view = (email = "") => {
  auth_status.textContent = email ? `Signed in as ${email}` : "Signed in";
  sidebar_auth_text.textContent = email ? `Signed in as ${email}` : "Signed in";
  login_btn.style.display = "none";
  logout_btn.style.display = "inline-block";
  welcome_screen.style.display = "none";
  dashboard_shell.style.display = "grid";
};

// ── Session ───────────────────────────────────────────────────────────────────

const clear_local_session = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_TIMER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  if (logout_timer) { clearTimeout(logout_timer); logout_timer = null; }
};

const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
};

const buildLogoutUrl = () =>
  `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;

const end_session = (message = "Signed out", redirectToCognito = false) => {
  clear_local_session();
  set_logged_out_view();
  show_toast(message);
  if (redirectToCognito) window.location.href = buildLogoutUrl();
};

const schedule_auto_logout = () => {
  if (logout_timer) clearTimeout(logout_timer);
  const expires_at = Number(sessionStorage.getItem(SESSION_TIMER_KEY) || 0);
  const remaining = expires_at - Date.now();
  if (remaining <= 0) { end_session("Session expired after 5 minutes", true); return; }
  logout_timer = setTimeout(() => end_session("Session expired after 5 minutes", true), remaining);
};

const start_session = (token, email) => {
  const expires_at = Date.now() + SESSION_MS;
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_EMAIL_KEY, email);
  sessionStorage.setItem(SESSION_TIMER_KEY, String(expires_at));
  set_logged_in_view(email);
  schedule_auto_logout();
};

const has_valid_session = () => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const email = sessionStorage.getItem(SESSION_EMAIL_KEY);
  const expires_at = Number(sessionStorage.getItem(SESSION_TIMER_KEY) || 0);
  if (!token || !email || expires_at <= Date.now()) return false;
  if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) return false;
  return true;
};

// ── PKCE ──────────────────────────────────────────────────────────────────────

const randomString = (length = 96) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join("");
};

const sha256 = async (plain) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));

const base64UrlEncode = (buf) => {
  let s = "";
  new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const createCodeChallenge = async (verifier) => base64UrlEncode(await sha256(verifier));

const exchangeCodeForTokens = async (code, verifier) => {
  const body = new URLSearchParams({ grant_type: "authorization_code", client_id: CLIENT_ID, code, redirect_uri: REDIRECT_URI, code_verifier: verifier });
  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!response.ok) { const text = await response.text(); throw new Error(text || "Token exchange failed"); }
  return response.json();
};

const handle_cognito_redirect = async () => {
  const url   = new URL(window.location.href);
  const code  = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const error_description = url.searchParams.get("error_description");

  console.log("handle_cognito_redirect running");

  if (error) { show_toast(error_description || error, true); return false; }
  if (!code) return false;

  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) { show_toast("Missing login verifier. Please try signing in again.", true); return false; }

  try {
    const tokens   = await exchangeCodeForTokens(code, verifier);
    const id_token = tokens.id_token;
    const decoded  = parseJwt(id_token);
    const email    = decoded?.email || "";

    window.history.replaceState({}, document.title, window.location.pathname);

    if (!email) { show_toast("Missing email in token", true); return false; }
    if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) { show_toast(`Wrong account: ${email}`, true); return false; }

    start_session(id_token, email);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    return true;
  } catch (err) {
    console.error("token exchange failed:", err);
    show_toast("Sign in failed", true);
    return false;
  }
};

// ── API ───────────────────────────────────────────────────────────────────────

const api_get = async (id) => {
  const response = await fetch(`${API_BASE}/content/${id}`);
  if (!response.ok) throw new Error(`Failed to load ${id}`);
  return response.json();
};

const api_put = async (id, payload) => {
  const response = await fetch(`${API_BASE}/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) { const text = await response.text(); throw new Error(text || `Failed to save ${id}`); }
  return response.json();
};

// ── Normalizers ───────────────────────────────────────────────────────────────

const normalize_projects = (items = []) =>
  items.map((item, i) => ({
    id:          item.project_id || "",
    title:       item.title || "",
    slug:        item.slug || "",
    category:    item.category || "",
    description: item.description || "",
    link:        item.link || "",
    image_url:   item.image_url || "",
    is_visible:  item.is_visible !== false,
    is_featured: !!item.is_featured,
    sort_order:  Number(item.sort_order ?? i + 1),
  }));

const normalize_posts = (items = []) =>
  items.map((item, i) => ({
    id:              item.post_id || "",
    title:           item.title || "",
    slug:            item.slug || "",
    excerpt:         item.excerpt || "",
    content:         item.content || "",
    cover_image_url: item.cover_image_url || "",
    is_published:    item.is_published !== false,
    sort_order:      Number(item.sort_order ?? i + 1),
  }));

const normalize_resumes = (items = []) =>
  items.map((item) => ({
    id:         item.resume_id || "",
    title:      item.title || "",
    file_name:  item.file_name || "",
    file_url:   item.file_url || "",
    is_current: !!item.is_current,
  }));

const normalize_entries = (items = [], id_key) =>
  items.map((item, i) => ({
    id:           item[id_key] || "",
    title:        item.title || "",
    subtitle:     item.subtitle || "",
    organization: item.organization || "",
    date_range:   item.date_range || "",
    description:  item.description || "",
    link:         item.link || "",
    sort_order:   Number(item.sort_order ?? i + 1),
  }));

// ── Render ────────────────────────────────────────────────────────────────────

const render_list = (container, items, type) => {
  if (!items.length) {
    container.innerHTML = `<div class='item_card'><p>No ${type} yet.</p></div>`;
    return;
  }

  container.innerHTML = items.map((item) => {
    const status_text =
      type === "projects" ? (item.is_visible  ? "Visible"   : "Hidden")   :
      type === "posts"    ? (item.is_published ? "Published" : "Draft")    :
      type === "resumes"  ? (item.is_current   ? "Current"   : "Archived") :
      item.date_range || "";

    const sort_label = item.sort_order != null
      ? `<span class='item_sort_badge'>#${item.sort_order}</span>`
      : "";

    return `
      <div class='item_card'>
        <div class='item_card_top'>
          <div>
            <h4>${item.title || "Untitled"}</h4>
            <p>${status_text} ${sort_label}</p>
          </div>
          <div class='item_actions'>
            <button type='button' data-action='edit'   data-type='${type}' data-id='${item.id}'>Edit</button>
            <button type='button' data-action='delete' data-type='${type}' data-id='${item.id}'>Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

const update_counts = () => {
  projects_count.textContent = String(projects_cache.length);
  posts_count.textContent    = String(posts_cache.length);
  resumes_count.textContent  = String(resumes_cache.length);
  work_count.textContent     = String(work_cache.length);
  academia_count.textContent = String(academia_cache.length);
  awards_count.textContent   = String(awards_cache.length);
};

// ── Clear forms ───────────────────────────────────────────────────────────────

const clear_project_form = () => {
  project_fields.id.value            = "";
  project_fields.title.value         = "";
  project_fields.slug.value          = "";
  project_fields.category.value      = "";
  project_fields.description.value   = "";
  project_fields.link.value          = "";
  project_fields.image_url.value     = "";
  project_fields.is_visible.checked  = true;
  project_fields.is_featured.checked = false;
  project_fields.sort_order.value    = projects_cache.length + 1;
};

const clear_post_form = () => {
  post_fields.id.value              = "";
  post_fields.title.value           = "";
  post_fields.slug.value            = "";
  post_fields.excerpt.value         = "";
  post_fields.content.value         = "";
  post_fields.cover_image_url.value = "";
  post_fields.is_published.checked  = true;
  post_fields.sort_order.value      = posts_cache.length + 1;
};

const clear_resume_form = () => {
  resume_fields.id.value            = "";
  resume_fields.title.value         = "";
  resume_fields.file_name.value     = "";
  resume_fields.file_url.value      = "";
  resume_fields.is_current.checked  = false;
};

const clear_entry_form = (fields, cache) => {
  fields.id.value           = "";
  fields.title.value        = "";
  fields.subtitle.value     = "";
  fields.organization.value = "";
  fields.date_range.value   = "";
  fields.description.value  = "";
  fields.link.value         = "";
  fields.sort_order.value   = cache.length + 1;
};

// ── Fill forms ────────────────────────────────────────────────────────────────

const fill_project_form = (item) => {
  project_fields.id.value            = item.id;
  project_fields.title.value         = item.title || "";
  project_fields.slug.value          = item.slug || "";
  project_fields.category.value      = item.category || "";
  project_fields.description.value   = item.description || "";
  project_fields.link.value          = item.link || "";
  project_fields.image_url.value     = item.image_url || "";
  project_fields.is_visible.checked  = !!item.is_visible;
  project_fields.is_featured.checked = !!item.is_featured;
  project_fields.sort_order.value    = item.sort_order ?? 1;
  switch_tab("projects_tab");
};

const fill_post_form = (item) => {
  post_fields.id.value              = item.id;
  post_fields.title.value           = item.title || "";
  post_fields.slug.value            = item.slug || "";
  post_fields.excerpt.value         = item.excerpt || "";
  post_fields.content.value         = item.content || "";
  post_fields.cover_image_url.value = item.cover_image_url || "";
  post_fields.is_published.checked  = !!item.is_published;
  post_fields.sort_order.value      = item.sort_order ?? 1;
  switch_tab("posts_tab");
};

const fill_resume_form = (item) => {
  resume_fields.id.value            = item.id;
  resume_fields.title.value         = item.title || "";
  resume_fields.file_name.value     = item.file_name || "";
  resume_fields.file_url.value      = item.file_url || "";
  resume_fields.is_current.checked  = !!item.is_current;
  switch_tab("resumes_tab");
};

const fill_entry_form = (fields, item, tab_id) => {
  fields.id.value           = item.id;
  fields.title.value        = item.title || "";
  fields.subtitle.value     = item.subtitle || "";
  fields.organization.value = item.organization || "";
  fields.date_range.value   = item.date_range || "";
  fields.description.value  = item.description || "";
  fields.link.value         = item.link || "";
  fields.sort_order.value   = item.sort_order ?? 1;
  switch_tab(tab_id);
};

// ── API save helpers ──────────────────────────────────────────────────────────

const save_projects = () =>
  api_put("projects", {
    id: "projects",
    items: [...projects_cache]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        project_id:  p.id,
        title:       p.title,
        slug:        p.slug,
        category:    p.category,
        description: p.description,
        link:        p.link,
        image_url:   p.image_url,
        is_visible:  p.is_visible,
        is_featured: p.is_featured,
        sort_order:  p.sort_order,
      })),
  });

const save_posts = () =>
  api_put("posts", {
    id: "posts",
    items: [...posts_cache]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        post_id:         p.id,
        title:           p.title,
        slug:            p.slug,
        excerpt:         p.excerpt,
        content:         p.content,
        cover_image_url: p.cover_image_url,
        is_published:    p.is_published,
        sort_order:      p.sort_order,
      })),
  });

const save_resumes = () =>
  api_put("resumes", {
    id: "resumes",
    items: resumes_cache.map((r) => ({
      resume_id:  r.id,
      title:      r.title,
      file_name:  r.file_name,
      file_url:   r.file_url,
      is_current: r.is_current,
    })),
  });

const save_entries = (section_key, cache, id_key) =>
  api_put(section_key, {
    id: section_key,
    items: [...cache]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((entry) => ({
        [id_key]:     entry.id,
        title:        entry.title,
        subtitle:     entry.subtitle,
        organization: entry.organization,
        date_range:   entry.date_range,
        description:  entry.description,
        link:         entry.link,
        sort_order:   entry.sort_order,
      })),
  });

// ── Load data ─────────────────────────────────────────────────────────────────

const load_site_content = async () => {
  const raw  = await api_get("site");
  const data = unmarshall_response(raw);
  Object.keys(site_fields).forEach((key) => {
    site_fields[key].value = data[key] || "";
  });
};

const load_dashboard_data = async () => {
  await load_site_content();

  const safe_get = async (id) => {
    try { return unmarshall_response(await api_get(id)); }
    catch { return { items: [] }; }
  };

  const [projects_data, posts_data, resumes_data, work_data, academia_data, awards_data] =
    await Promise.all([
      safe_get("projects"),
      safe_get("posts"),
      safe_get("resumes"),
      safe_get("work"),
      safe_get("academia"),
      safe_get("awards"),
    ]);

  projects_cache = normalize_projects(projects_data.items || []).sort((a, b) => a.sort_order - b.sort_order);
  posts_cache    = normalize_posts(posts_data.items || []).sort((a, b) => a.sort_order - b.sort_order);
  resumes_cache  = normalize_resumes(resumes_data.items || []);
  work_cache     = normalize_entries(work_data.items || [],     "work_id").sort((a, b) => a.sort_order - b.sort_order);
  academia_cache = normalize_entries(academia_data.items || [], "academia_id").sort((a, b) => a.sort_order - b.sort_order);
  awards_cache   = normalize_entries(awards_data.items || [],   "awards_id").sort((a, b) => a.sort_order - b.sort_order);

  render_list(projects_list, projects_cache, "projects");
  render_list(posts_list,    posts_cache,    "posts");
  render_list(resumes_list,  resumes_cache,  "resumes");
  render_list(work_list,     work_cache,     "work");
  render_list(academia_list, academia_cache, "academia");
  render_list(awards_list,   awards_cache,   "awards");
  update_counts();
};

// ── Form submissions ──────────────────────────────────────────────────────────

site_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api_put("site", {
      id:        "site",
      title:     site_fields.title.value.trim(),
      subtitle:  site_fields.subtitle.value.trim(),
      intro:     site_fields.intro.value.trim(),
      about:     site_fields.about.value.trim(),
      email:     site_fields.email.value.trim(),
      linkedin:  site_fields.linkedin.value.trim(),
      github:    site_fields.github.value.trim(),
      instagram: site_fields.instagram.value.trim(),
    });
    show_toast("Site content saved ✓");
    await load_dashboard_data();
  } catch (err) {
    console.error(err);
    show_toast("Failed to save site content", true);
  }
});

project_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = project_fields.id.value || `project_${Date.now()}`;
  const item = {
    id,
    title:       project_fields.title.value.trim(),
    slug:        project_fields.slug.value.trim() || slugify(project_fields.title.value),
    category:    project_fields.category.value.trim(),
    description: project_fields.description.value.trim(),
    link:        project_fields.link.value.trim(),
    image_url:   project_fields.image_url.value.trim(),
    is_visible:  project_fields.is_visible.checked,
    is_featured: project_fields.is_featured.checked,
    sort_order:  Number(project_fields.sort_order.value || 1),
  };
  const existing_index = projects_cache.findIndex((e) => e.id === id);
  if (existing_index >= 0) { projects_cache[existing_index] = { ...projects_cache[existing_index], ...item }; }
  else { projects_cache.push(item); }
  try {
    await save_projects();
    clear_project_form();
    show_toast(existing_index >= 0 ? "Project updated ✓" : "Project created ✓");
    await load_dashboard_data();
  } catch (err) {
    console.error(err);
    show_toast("Failed to save project", true);
  }
});

post_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = post_fields.id.value || `post_${Date.now()}`;
  const item = {
    id,
    title:           post_fields.title.value.trim(),
    slug:            post_fields.slug.value.trim() || slugify(post_fields.title.value),
    excerpt:         post_fields.excerpt.value.trim(),
    content:         post_fields.content.value.trim(),
    cover_image_url: post_fields.cover_image_url.value.trim(),
    is_published:    post_fields.is_published.checked,
    sort_order:      Number(post_fields.sort_order.value || 1),
  };
  const existing_index = posts_cache.findIndex((e) => e.id === id);
  if (existing_index >= 0) { posts_cache[existing_index] = { ...posts_cache[existing_index], ...item }; }
  else { posts_cache.push(item); }
  try {
    await save_posts();
    clear_post_form();
    show_toast(existing_index >= 0 ? "Post updated ✓" : "Post created ✓");
    await load_dashboard_data();
  } catch (err) {
    console.error(err);
    show_toast("Failed to save post", true);
  }
});

resume_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = resume_fields.id.value || `resume_${Date.now()}`;
  if (resume_fields.is_current.checked) {
    resumes_cache = resumes_cache.map((item) => ({ ...item, is_current: false }));
  }
  const item = {
    id,
    title:      resume_fields.title.value.trim(),
    file_name:  resume_fields.file_name.value.trim(),
    file_url:   resume_fields.file_url.value.trim(),
    is_current: resume_fields.is_current.checked,
  };
  const existing_index = resumes_cache.findIndex((e) => e.id === id);
  if (existing_index >= 0) { resumes_cache[existing_index] = item; }
  else { resumes_cache.push(item); }
  try {
    await save_resumes();
    clear_resume_form();
    show_toast(existing_index >= 0 ? "Resume updated ✓" : "Resume created ✓");
    await load_dashboard_data();
  } catch (err) {
    console.error(err);
    show_toast("Failed to save resume", true);
  }
});

const handle_entry_submit = async (event, fields, cache_ref, section_key, id_key) => {
  event.preventDefault();
  const id = fields.id.value || `${section_key}_${Date.now()}`;
  const item = {
    id,
    title:        fields.title.value.trim(),
    subtitle:     fields.subtitle.value.trim(),
    organization: fields.organization.value.trim(),
    date_range:   fields.date_range.value.trim(),
    description:  fields.description.value.trim(),
    link:         fields.link.value.trim(),
    sort_order:   Number(fields.sort_order.value || 1),
  };
  const existing_index = cache_ref.findIndex((e) => e.id === id);
  if (existing_index >= 0) { cache_ref[existing_index] = item; }
  else { cache_ref.push(item); }
  try {
    await save_entries(section_key, cache_ref, id_key);
    clear_entry_form(fields, cache_ref);
    show_toast(existing_index >= 0 ? `${section_key} entry updated ✓` : `${section_key} entry created ✓`);
    await load_dashboard_data();
  } catch (err) {
    console.error(err);
    show_toast(`Failed to save ${section_key} entry`, true);
  }
};

work_form.addEventListener("submit",     (e) => handle_entry_submit(e, work_fields,     work_cache,     "work",     "work_id"));
academia_form.addEventListener("submit", (e) => handle_entry_submit(e, academia_fields, academia_cache, "academia", "academia_id"));
awards_form.addEventListener("submit",   (e) => handle_entry_submit(e, awards_fields,   awards_cache,   "awards",   "awards_id"));

// ── New / reset buttons ───────────────────────────────────────────────────────

new_project_btn.addEventListener("click",  () => { clear_project_form();                             switch_tab("projects_tab"); });
new_post_btn.addEventListener("click",     () => { clear_post_form();                                switch_tab("posts_tab"); });
new_resume_btn.addEventListener("click",   () => { clear_resume_form();                              switch_tab("resumes_tab"); });
new_work_btn.addEventListener("click",     () => { clear_entry_form(work_fields,     work_cache);     switch_tab("work_tab"); });
new_academia_btn.addEventListener("click", () => { clear_entry_form(academia_fields, academia_cache); switch_tab("academia_tab"); });
new_awards_btn.addEventListener("click",   () => { clear_entry_form(awards_fields,   awards_cache);   switch_tab("awards_tab"); });

reset_project_btn.addEventListener("click",  clear_project_form);
reset_post_btn.addEventListener("click",     clear_post_form);
reset_resume_btn.addEventListener("click",   clear_resume_form);
reset_work_btn.addEventListener("click",     () => clear_entry_form(work_fields,     work_cache));
reset_academia_btn.addEventListener("click", () => clear_entry_form(academia_fields, academia_cache));
reset_awards_btn.addEventListener("click",   () => clear_entry_form(awards_fields,   awards_cache));

// ── Delegated click handler (edit / delete) ───────────────────────────────────

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, type, id } = button.dataset;

  if (action === "edit") {
    if (type === "projects") { const item = projects_cache.find((e) => e.id === id); if (item) fill_project_form(item); }
    if (type === "posts")    { const item = posts_cache.find((e) => e.id === id);    if (item) fill_post_form(item); }
    if (type === "resumes")  { const item = resumes_cache.find((e) => e.id === id);  if (item) fill_resume_form(item); }
    if (type === "work")     { const item = work_cache.find((e) => e.id === id);     if (item) fill_entry_form(work_fields,     item, "work_tab"); }
    if (type === "academia") { const item = academia_cache.find((e) => e.id === id); if (item) fill_entry_form(academia_fields, item, "academia_tab"); }
    if (type === "awards")   { const item = awards_cache.find((e) => e.id === id);   if (item) fill_entry_form(awards_fields,   item, "awards_tab"); }
    return;
  }

  if (action === "delete") {
    const ok = window.confirm("Are you sure you want to delete this item? This cannot be undone.");
    if (!ok) return;

    try {
      if (type === "projects") { projects_cache = projects_cache.filter((i) => i.id !== id); await save_projects(); }
      if (type === "posts")    { posts_cache    = posts_cache.filter((i) => i.id !== id);    await save_posts(); }
      if (type === "resumes")  { resumes_cache  = resumes_cache.filter((i) => i.id !== id);  await save_resumes(); }
      if (type === "work")     { work_cache     = work_cache.filter((i) => i.id !== id);     await save_entries("work",     work_cache,     "work_id"); }
      if (type === "academia") { academia_cache = academia_cache.filter((i) => i.id !== id); await save_entries("academia", academia_cache, "academia_id"); }
      if (type === "awards")   { awards_cache   = awards_cache.filter((i) => i.id !== id);   await save_entries("awards",   awards_cache,   "awards_id"); }

      show_toast("Item deleted ✓");
      await load_dashboard_data();
    } catch (err) {
      console.error(err);
      show_toast("Failed to delete item", true);
    }
  }
});

// ── Search ────────────────────────────────────────────────────────────────────

const get_all_searchable = () => [
  ...projects_cache.map((i) => ({ ...i, _type: "projects", _tab: "projects_tab" })),
  ...posts_cache.map((i)    => ({ ...i, _type: "posts",    _tab: "posts_tab" })),
  ...resumes_cache.map((i)  => ({ ...i, _type: "resumes",  _tab: "resumes_tab" })),
  ...work_cache.map((i)     => ({ ...i, _type: "work",     _tab: "work_tab" })),
  ...academia_cache.map((i) => ({ ...i, _type: "academia", _tab: "academia_tab" })),
  ...awards_cache.map((i)   => ({ ...i, _type: "awards",   _tab: "awards_tab" })),
];

search_input.addEventListener("input", () => {
  const query = search_input.value.trim().toLowerCase();
  if (!query) { search_results.classList.remove("visible"); return; }

  const matches = get_all_searchable().filter((item) =>
    (item.title        || "").toLowerCase().includes(query) ||
    (item.subtitle     || "").toLowerCase().includes(query) ||
    (item.organization || "").toLowerCase().includes(query) ||
    (item.description  || "").toLowerCase().includes(query) ||
    (item.category     || "").toLowerCase().includes(query)
  ).slice(0, 12);

  if (!matches.length) {
    search_results.innerHTML = `<div class='search_result_item'><strong>No results found</strong></div>`;
    search_results.classList.add("visible");
    return;
  }

  search_results.innerHTML = matches.map((item) => `
    <div class='search_result_item' data-tab='${item._tab}' data-id='${item.id}' data-type='${item._type}'>
      <strong>${item.title || "Untitled"}</strong>
      <span>${item._type}${item.organization ? " · " + item.organization : ""}</span>
    </div>
  `).join("");

  search_results.classList.add("visible");
});

search_results.addEventListener("click", (event) => {
  const result = event.target.closest(".search_result_item");
  if (!result || !result.dataset.tab) return;

  const { tab, id, type } = result.dataset;
  switch_tab(tab);
  search_input.value = "";
  search_results.classList.remove("visible");

  setTimeout(() => {
    const btn = document.querySelector(`[data-action='edit'][data-type='${type}'][data-id='${id}']`);
    if (btn) btn.closest(".item_card").scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
});

document.addEventListener("click", (event) => {
  if (!search_results.contains(event.target) && event.target !== search_input) {
    search_results.classList.remove("visible");
  }
});

// ── Auth buttons ──────────────────────────────────────────────────────────────

login_btn.addEventListener("click", async () => {
  clear_local_session();
  const verifier  = randomString(96);
  const challenge = await createCodeChallenge(verifier);
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const loginUrl =
    `${COGNITO_DOMAIN}/oauth2/authorize` +
    `?identity_provider=Google` +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code_challenge_method=S256` +
    `&code_challenge=${encodeURIComponent(challenge)}`;
  window.location.href = loginUrl;
});

logout_btn.addEventListener("click", () => {
  const confirmed = window.confirm("Are you sure you want to log out?");
  if (!confirmed) return;
  end_session("Signed out", true);
});

// ── Boot ──────────────────────────────────────────────────────────────────────

const boot = async () => {
  console.log("BOOT START");

  const just_logged_in = await handle_cognito_redirect();

  if (just_logged_in || has_valid_session()) {
    const email = sessionStorage.getItem(SESSION_EMAIL_KEY) || "";
    set_logged_in_view(email);
    schedule_auto_logout();
    try {
      await load_dashboard_data();
      show_toast("Dashboard loaded ✓");
    } catch (err) {
      console.error("dashboard load failed:", err);
      show_toast("Failed to load dashboard data", true);
    }
  } else {
    clear_local_session();
    set_logged_out_view();
  }
};

boot();