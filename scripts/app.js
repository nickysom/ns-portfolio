import { db } from "./firebase-config.js"
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"

function set_text(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value || ""
}

function escape_html(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

async function load_site_content() {
  const site_ref = doc(db, "siteContent", "main")
  const site_snap = await getDoc(site_ref)

  if (!site_snap.exists()) return

  const data = site_snap.data()

  set_text("title", data.title)
  set_text("subtitle", data.subtitle)
  set_text("intro", data.intro)
  set_text("about", data.about)
  set_text("academia", data.academia)
  set_text("work", data.work)
  set_text("awards", data.awards)
  set_text("email", data.email)
  set_text("linkedin", data.linkedin)
  set_text("github", data.github)
  set_text("instagram", data.instagram)
}

async function load_projects() {
  const grid = document.getElementById("projects_grid")
  if (!grid) return

  const snap = await getDocs(collection(db, "projects"))

  const items = snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))

  if (!items.length) {
    grid.innerHTML = `
      <article class="project_card">
        <h3>No projects yet</h3>
        <p>Projects you add in the dashboard will show up here.</p>
      </article>
    `
    return
  }

  grid.innerHTML = items.map((item) => {
    const link = item.link && item.link.trim() ? item.link.trim() : "#"
    const title = escape_html(item.title || "Untitled Project")
    const category = escape_html(item.category || "Project")
    const description = escape_html(item.description || "")
    const button_text = link === "#" ? "Coming Soon" : "View Project"

    return `
      <article class="project_card">
        <span class="project_tag">${category}</span>
        <h3>${title}</h3>
        <p>${description}</p>
        <a href="${link}" class="project_link" target="_blank" rel="noopener noreferrer">${button_text}</a>
      </article>
    `
  }).join("")
}

async function load_posts() {
  const grid = document.getElementById("posts_grid")
  if (!grid) return

  const snap = await getDocs(collection(db, "blogPost"))

  const items = snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.is_published !== false)
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))

  if (!items.length) {
    grid.innerHTML = `
      <article class="project_card">
        <h3>No posts yet</h3>
        <p>Posts you add in the dashboard will show up here.</p>
      </article>
    `
    return
  }

  grid.innerHTML = items.map((item) => {
    const title = escape_html(item.title || "Untitled Post")
    const excerpt = escape_html(item.excerpt || item.content || "")
    const short_excerpt = excerpt.length > 180 ? `${excerpt.slice(0, 180)}...` : excerpt

    return `
      <article class="project_card">
        <span class="project_tag">Post</span>
        <h3>${title}</h3>
        <p>${short_excerpt}</p>
      </article>
    `
  }).join("")
}

async function load_resume() {
  const wrap = document.getElementById("current_resume_wrap")
  const text = document.getElementById("current_resume_text")
  const link = document.getElementById("current_resume_link")

  if (!wrap || !text || !link) return

  const snap = await getDocs(collection(db, "resumes"))

  const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
  const current = items.find((item) => item.is_current) || items[0]

  if (!current) {
    text.textContent = "No resume available yet."
    link.style.display = "none"
    return
  }

  text.textContent = current.title || current.file_name || "Current Resume"
  link.href = current.file_url || "#"
  link.textContent = current.file_name ? `Open ${current.file_name}` : "View Resume"

  if (!current.file_url) {
    link.style.display = "none"
  } else {
    link.style.display = "inline-block"
  }
}

async function init() {
  try {
    await Promise.all([
      load_site_content(),
      load_projects(),
      load_posts(),
      load_resume()
    ])
  } catch (error) {
    console.error("Error loading site content:", error)
  }
}

init()