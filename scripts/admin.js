import { auth, db, provider } from "./firebase-config.js"
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"

const allowed_admin_email = "nickysom@icloud.com"

const COLLECTIONS = {
  site: "siteContent",
  projects: "projects",
  posts: "blogPost",
  resumes: "resumes"
}

const auth_status = document.getElementById("auth_status")
const login_btn = document.getElementById("login_btn")
const logout_btn = document.getElementById("logout_btn")
const admin_content = document.getElementById("admin_content")
const save_message = document.getElementById("save_message")

const nav_tabs = document.querySelectorAll(".nav_tab")
const dashboard_tabs = document.querySelectorAll(".dashboard_tab")

const site_form = document.getElementById("site_form")
const site_fields = {
  title: document.getElementById("title_input"),
  subtitle: document.getElementById("subtitle_input"),
  intro: document.getElementById("intro_input"),
  about: document.getElementById("about_input"),
  academia: document.getElementById("academia_input"),
  work: document.getElementById("work_input"),
  awards: document.getElementById("awards_input"),
  email: document.getElementById("email_input"),
  linkedin: document.getElementById("linkedin_input"),
  github: document.getElementById("github_input"),
  instagram: document.getElementById("instagram_input")
}

const projects_count = document.getElementById("projects_count")
const posts_count = document.getElementById("posts_count")
const resumes_count = document.getElementById("resumes_count")

const projects_list = document.getElementById("projects_list")
const posts_list = document.getElementById("posts_list")
const resumes_list = document.getElementById("resumes_list")

const new_project_btn = document.getElementById("new_project_btn")
const new_post_btn = document.getElementById("new_post_btn")
const new_resume_btn = document.getElementById("new_resume_btn")

const project_form = document.getElementById("project_form")
const project_fields = {
  id: document.getElementById("project_id"),
  title: document.getElementById("project_title"),
  slug: document.getElementById("project_slug"),
  category: document.getElementById("project_category"),
  description: document.getElementById("project_description"),
  link: document.getElementById("project_link"),
  image_url: document.getElementById("project_image_url"),
  is_visible: document.getElementById("project_is_visible"),
  is_featured: document.getElementById("project_is_featured"),
  sort_order: document.getElementById("project_sort_order")
}
const reset_project_btn = document.getElementById("reset_project_btn")

const post_form = document.getElementById("post_form")
const post_fields = {
  id: document.getElementById("post_id"),
  title: document.getElementById("post_title"),
  slug: document.getElementById("post_slug"),
  excerpt: document.getElementById("post_excerpt"),
  content: document.getElementById("post_content"),
  cover_image_url: document.getElementById("post_cover_image_url"),
  is_published: document.getElementById("post_is_published"),
  sort_order: document.getElementById("post_sort_order")
}
const reset_post_btn = document.getElementById("reset_post_btn")

const resume_form = document.getElementById("resume_form")
const resume_fields = {
  id: document.getElementById("resume_id"),
  title: document.getElementById("resume_title"),
  file_name: document.getElementById("resume_file_name"),
  file_url: document.getElementById("resume_file_url"),
  is_current: document.getElementById("resume_is_current")
}
const reset_resume_btn = document.getElementById("reset_resume_btn")

let projects_cache = []
let posts_cache = []
let resumes_cache = []

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function get_collection_name(type) {
  if (type === "projects") return COLLECTIONS.projects
  if (type === "posts") return COLLECTIONS.posts
  if (type === "resumes") return COLLECTIONS.resumes
  return type
}

function set_logged_out_view() {
  auth_status.textContent = "Not signed in"
  admin_content.style.display = "none"
  login_btn.style.display = "inline-block"
  logout_btn.style.display = "none"
}

function set_logged_in_view(user) {
  auth_status.textContent = `Signed in as ${user.email}`
  admin_content.style.display = "block"
  login_btn.style.display = "none"
  logout_btn.style.display = "inline-block"
}

function set_message(text) {
  save_message.textContent = text
}

function switch_tab(tab_id) {
  nav_tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab_id)
  })

  dashboard_tabs.forEach((section) => {
    section.classList.toggle("active", section.id === tab_id)
  })
}

nav_tabs.forEach((button) => {
  button.addEventListener("click", () => switch_tab(button.dataset.tab))
})

function render_list(container, items, type) {
  if (!items.length) {
    container.innerHTML = `<div class="item_card"><p>No ${type} yet.</p></div>`
    return
  }

  container.innerHTML = items
    .map((item) => {
      const status_text =
        type === "projects"
          ? item.is_visible ? "Visible" : "Hidden"
          : type === "posts"
          ? item.is_published ? "Published" : "Draft"
          : item.is_current ? "Current" : "Archived"

      return `
        <div class="item_card">
          <div class="item_card_top">
            <div>
              <h4>${item.title || "Untitled"}</h4>
              <p>${status_text}</p>
            </div>
            <div class="item_actions">
              <button type="button" data_action="edit" data_type="${type}" data_id="${item.id}">Edit</button>
              <button type="button" data_action="delete" data_type="${type}" data_id="${item.id}" class="danger_btn">Delete</button>
            </div>
          </div>
        </div>
      `
    })
    .join("")
}

function update_counts() {
  projects_count.textContent = String(projects_cache.length)
  posts_count.textContent = String(posts_cache.length)
  resumes_count.textContent = String(resumes_cache.length)
}

function clear_project_form() {
  project_fields.id.value = ""
  project_fields.title.value = ""
  project_fields.slug.value = ""
  project_fields.category.value = ""
  project_fields.description.value = ""
  project_fields.link.value = ""
  project_fields.image_url.value = ""
  project_fields.is_visible.checked = true
  project_fields.is_featured.checked = false
  project_fields.sort_order.value = 1
}

function clear_post_form() {
  post_fields.id.value = ""
  post_fields.title.value = ""
  post_fields.slug.value = ""
  post_fields.excerpt.value = ""
  post_fields.content.value = ""
  post_fields.cover_image_url.value = ""
  post_fields.is_published.checked = true
  post_fields.sort_order.value = 1
}

function clear_resume_form() {
  resume_fields.id.value = ""
  resume_fields.title.value = ""
  resume_fields.file_name.value = ""
  resume_fields.file_url.value = ""
  resume_fields.is_current.checked = false
}

function fill_project_form(item) {
  project_fields.id.value = item.id
  project_fields.title.value = item.title || ""
  project_fields.slug.value = item.slug || ""
  project_fields.category.value = item.category || ""
  project_fields.description.value = item.description || ""
  project_fields.link.value = item.link || ""
  project_fields.image_url.value = item.image_url || ""
  project_fields.is_visible.checked = !!item.is_visible
  project_fields.is_featured.checked = !!item.is_featured
  project_fields.sort_order.value = item.sort_order ?? 1
  switch_tab("projects_tab")
}

function fill_post_form(item) {
  post_fields.id.value = item.id
  post_fields.title.value = item.title || ""
  post_fields.slug.value = item.slug || ""
  post_fields.excerpt.value = item.excerpt || ""
  post_fields.content.value = item.content || ""
  post_fields.cover_image_url.value = item.cover_image_url || ""
  post_fields.is_published.checked = !!item.is_published
  post_fields.sort_order.value = item.sort_order ?? 1
  switch_tab("posts_tab")
}

function fill_resume_form(item) {
  resume_fields.id.value = item.id
  resume_fields.title.value = item.title || ""
  resume_fields.file_name.value = item.file_name || ""
  resume_fields.file_url.value = item.file_url || ""
  resume_fields.is_current.checked = !!item.is_current
  switch_tab("resumes_tab")
}

async function load_site_content() {
  const site_ref = doc(db, COLLECTIONS.site, "main")
  const site_snap = await getDoc(site_ref)

  if (!site_snap.exists()) return

  const data = site_snap.data()

  Object.keys(site_fields).forEach((key) => {
    site_fields[key].value = data[key] || ""
  })
}

async function load_collection(name) {
  const snap = await getDocs(collection(db, name))
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
}

async function load_dashboard_data() {
  await load_site_content()

  projects_cache = await load_collection(COLLECTIONS.projects)
  posts_cache = await load_collection(COLLECTIONS.posts)
  resumes_cache = await load_collection(COLLECTIONS.resumes)

  render_list(projects_list, projects_cache, "projects")
  render_list(posts_list, posts_cache, "posts")
  render_list(resumes_list, resumes_cache, "resumes")
  update_counts()
}

site_form.addEventListener("submit", async (event) => {
  event.preventDefault()

  await setDoc(
    doc(db, COLLECTIONS.site, "main"),
    {
      title: site_fields.title.value.trim(),
      subtitle: site_fields.subtitle.value.trim(),
      intro: site_fields.intro.value.trim(),
      about: site_fields.about.value.trim(),
      academia: site_fields.academia.value.trim(),
      work: site_fields.work.value.trim(),
      awards: site_fields.awards.value.trim(),
      email: site_fields.email.value.trim(),
      linkedin: site_fields.linkedin.value.trim(),
      github: site_fields.github.value.trim(),
      instagram: site_fields.instagram.value.trim(),
      updated_at: serverTimestamp()
    },
    { merge: true }
  )

  set_message("Site content saved")
})

project_form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const payload = {
    title: project_fields.title.value.trim(),
    slug: project_fields.slug.value.trim() || slugify(project_fields.title.value),
    category: project_fields.category.value.trim(),
    description: project_fields.description.value.trim(),
    link: project_fields.link.value.trim(),
    image_url: project_fields.image_url.value.trim(),
    is_visible: project_fields.is_visible.checked,
    is_featured: project_fields.is_featured.checked,
    sort_order: Number(project_fields.sort_order.value || 1),
    updated_at: serverTimestamp()
  }

  if (!project_fields.id.value) {
    payload.created_at = serverTimestamp()
    await addDoc(collection(db, COLLECTIONS.projects), payload)
    set_message("Project created")
  } else {
    await updateDoc(doc(db, COLLECTIONS.projects, project_fields.id.value), payload)
    set_message("Project updated")
  }

  clear_project_form()
  await load_dashboard_data()
})

post_form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const payload = {
    title: post_fields.title.value.trim(),
    slug: post_fields.slug.value.trim() || slugify(post_fields.title.value),
    excerpt: post_fields.excerpt.value.trim(),
    content: post_fields.content.value.trim(),
    cover_image_url: post_fields.cover_image_url.value.trim(),
    is_published: post_fields.is_published.checked,
    sort_order: Number(post_fields.sort_order.value || 1),
    updated_at: serverTimestamp()
  }

  if (!post_fields.id.value) {
    payload.created_at = serverTimestamp()
    await addDoc(collection(db, COLLECTIONS.posts), payload)
    set_message("Post created")
  } else {
    await updateDoc(doc(db, COLLECTIONS.posts, post_fields.id.value), payload)
    set_message("Post updated")
  }

  clear_post_form()
  await load_dashboard_data()
})

resume_form.addEventListener("submit", async (event) => {
  event.preventDefault()

  if (resume_fields.is_current.checked && resumes_cache.length) {
    await Promise.all(
      resumes_cache.map((item) =>
        updateDoc(doc(db, COLLECTIONS.resumes, item.id), { is_current: false })
      )
    )
  }

  const payload = {
    title: resume_fields.title.value.trim(),
    file_name: resume_fields.file_name.value.trim(),
    file_url: resume_fields.file_url.value.trim(),
    is_current: resume_fields.is_current.checked,
    updated_at: serverTimestamp()
  }

  if (!resume_fields.id.value) {
    payload.created_at = serverTimestamp()
    await addDoc(collection(db, COLLECTIONS.resumes), payload)
    set_message("Resume created")
  } else {
    await updateDoc(doc(db, COLLECTIONS.resumes, resume_fields.id.value), payload)
    set_message("Resume updated")
  }

  clear_resume_form()
  await load_dashboard_data()
})

new_project_btn.addEventListener("click", () => {
  clear_project_form()
  switch_tab("projects_tab")
})

new_post_btn.addEventListener("click", () => {
  clear_post_form()
  switch_tab("posts_tab")
})

new_resume_btn.addEventListener("click", () => {
  clear_resume_form()
  switch_tab("resumes_tab")
})

reset_project_btn.addEventListener("click", clear_project_form)
reset_post_btn.addEventListener("click", clear_post_form)
reset_resume_btn.addEventListener("click", clear_resume_form)

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data_action]")
  if (!button) return

  const { action, type, id } = button.dataset

  if (action === "edit") {
    if (type === "projects") {
      const item = projects_cache.find((entry) => entry.id === id)
      if (item) fill_project_form(item)
    }

    if (type === "posts") {
      const item = posts_cache.find((entry) => entry.id === id)
      if (item) fill_post_form(item)
    }

    if (type === "resumes") {
      const item = resumes_cache.find((entry) => entry.id === id)
      if (item) fill_resume_form(item)
    }
  }

  if (action === "delete") {
    const ok = window.confirm("Delete this item?")
    if (!ok) return

    const collection_name = get_collection_name(type)
    await deleteDoc(doc(db, collection_name, id))
    set_message("Item deleted")
    await load_dashboard_data()
  }
})

login_btn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    if (user.email !== allowed_admin_email) {
      await signOut(auth)
      auth_status.textContent = "This account is not allowed"
      return
    }

    set_logged_in_view(user)
    await load_dashboard_data()
    set_message("Signed in")
  } catch (error) {
    console.error(error)
    auth_status.textContent = error.message || "Sign in failed"
  }
})

logout_btn.addEventListener("click", async () => {
  try {
    await signOut(auth)
    set_message("Signed out")
  } catch (error) {
    console.error(error)
    auth_status.textContent = "Sign out failed"
  }
})

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    set_logged_out_view()
    return
  }

  if (user.email !== allowed_admin_email) {
    await signOut(auth)
    set_logged_out_view()
    auth_status.textContent = "This account is not allowed"
    return
  }

  set_logged_in_view(user)
  await load_dashboard_data()
})

set_logged_out_view()