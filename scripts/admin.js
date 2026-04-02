import { auth, db, provider } from "./firebase-config.js"
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"

const allowed_admin_email = "nickysom@icloud.com"

const login_btn = document.getElementById("login_btn")
const logout_btn = document.getElementById("logout_btn")
const auth_status = document.getElementById("auth_status")
const admin_content = document.getElementById("admin_content")
const form = document.getElementById("site_content_form")
const save_message = document.getElementById("save_message")

const fields = {
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

const project_fields = {
  nsportfolio_game: {
    title: document.getElementById("nsportfolio_game_title"),
    category: document.getElementById("nsportfolio_game_category"),
    description: document.getElementById("nsportfolio_game_description"),
    link: document.getElementById("nsportfolio_game_link")
  },
  aws_asana_backup: {
    title: document.getElementById("aws_asana_backup_title"),
    category: document.getElementById("aws_asana_backup_category"),
    description: document.getElementById("aws_asana_backup_description"),
    link: document.getElementById("aws_asana_backup_link")
  },
  figma: {
    title: document.getElementById("figma_title"),
    category: document.getElementById("figma_category"),
    description: document.getElementById("figma_description"),
    link: document.getElementById("figma_link")
  },
  coding: {
    title: document.getElementById("coding_title"),
    category: document.getElementById("coding_category"),
    description: document.getElementById("coding_description"),
    link: document.getElementById("coding_link")
  },
  snowflake: {
    title: document.getElementById("snowflake_title"),
    category: document.getElementById("snowflake_category"),
    description: document.getElementById("snowflake_description"),
    link: document.getElementById("snowflake_link")
  }
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

async function load_site_content() {
  const site_ref = doc(db, "siteContent", "main")
  const site_snap = await getDoc(site_ref)

  if (site_snap.exists()) {
    const data = site_snap.data()

    fields.title.value = data.title || ""
    fields.subtitle.value = data.subtitle || ""
    fields.intro.value = data.intro || ""
    fields.about.value = data.about || ""
    fields.academia.value = data.academia || ""
    fields.work.value = data.work || ""
    fields.awards.value = data.awards || ""
    fields.email.value = data.email || ""
    fields.linkedin.value = data.linkedin || ""
    fields.github.value = data.github || ""
    fields.instagram.value = data.instagram || ""
  }

  await Promise.all(
    Object.keys(project_fields).map(async (project_id) => {
      const project_ref = doc(db, "projects", project_id)
      const project_snap = await getDoc(project_ref)

      if (!project_snap.exists()) return

      const data = project_snap.data()
      const project = project_fields[project_id]

      project.title.value = data.title || ""
      project.category.value = data.category || ""
      project.description.value = data.description || ""
      project.link.value = data.link || ""
    })
  )
}

async function save_site_content() {
  await setDoc(
    doc(db, "siteContent", "main"),
    {
      title: fields.title.value.trim(),
      subtitle: fields.subtitle.value.trim(),
      intro: fields.intro.value.trim(),
      about: fields.about.value.trim(),
      academia: fields.academia.value.trim(),
      work: fields.work.value.trim(),
      awards: fields.awards.value.trim(),
      email: fields.email.value.trim(),
      linkedin: fields.linkedin.value.trim(),
      github: fields.github.value.trim(),
      instagram: fields.instagram.value.trim()
    },
    { merge: true }
  )

  await Promise.all(
    Object.entries(project_fields).map(async ([project_id, project]) => {
      await setDoc(
        doc(db, "projects", project_id),
        {
          title: project.title.value.trim(),
          category: project.category.value.trim(),
          description: project.description.value.trim(),
          link: project.link.value.trim()
        },
        { merge: true }
      )
    })
  )
}

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
    await load_site_content()
    save_message.textContent = "Signed in"
  } catch (error) {
    console.error("Login error:", error)
    auth_status.textContent = error.message || "Sign in failed"
  }
})

logout_btn.addEventListener("click", async () => {
  try {
    await signOut(auth)
    save_message.textContent = "Signed out"
  } catch (error) {
    console.error("Logout error:", error)
    auth_status.textContent = "Sign out failed"
  }
})

form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const user = auth.currentUser

  if (!user) {
    save_message.textContent = "You must sign in first"
    return
  }

  if (user.email !== allowed_admin_email) {
    save_message.textContent = "You are not allowed to save"
    return
  }

  try {
    save_message.textContent = "Saving..."
    await save_site_content()
    save_message.textContent = "Changes saved"
  } catch (error) {
    console.error("Save error:", error)
    save_message.textContent = "Save failed"
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

  try {
    set_logged_in_view(user)
    await load_site_content()
    save_message.textContent = "Content loaded"
  } catch (error) {
    console.error("Load error:", error)
    save_message.textContent = "Could not load content"
  }
})

set_logged_out_view()