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

const allowedAdminEmail = "nickysom@icloud.com"

const loginBtn = document.getElementById("login-btn")
const logoutBtn = document.getElementById("logout-btn")
const authStatus = document.getElementById("auth-status")
const adminContent = document.getElementById("admin-content")
const form = document.getElementById("site-content-form")
const saveMessage = document.getElementById("save-message")

const fields = {
  heroEyebrow: document.getElementById("hero-eyebrow"),
  heroTitle: document.getElementById("hero-title"),
  heroText: document.getElementById("hero-text"),
  aboutText: document.getElementById("about-text"),
  email: document.getElementById("contact-email"),
  linkedin: document.getElementById("contact-linkedin"),
  github: document.getElementById("contact-github"),
  academiaText: document.getElementById("academia-text"),
  workText: document.getElementById("work-text"),
  awardsText: document.getElementById("awards-text")
}

const projectFields = {
  "nsportfolio-game": {
    title: document.getElementById("project-1-title"),
    category: document.getElementById("project-1-category"),
    description: document.getElementById("project-1-description"),
    link: document.getElementById("project-1-link")
  },
  "aws-asana-backup": {
    title: document.getElementById("project-2-title"),
    category: document.getElementById("project-2-category"),
    description: document.getElementById("project-2-description"),
    link: document.getElementById("project-2-link")
  },
  "figma-projects": {
    title: document.getElementById("project-3-title"),
    category: document.getElementById("project-3-category"),
    description: document.getElementById("project-3-description"),
    link: document.getElementById("project-3-link")
  },
  "coding-projects": {
    title: document.getElementById("project-4-title"),
    category: document.getElementById("project-4-category"),
    description: document.getElementById("project-4-description"),
    link: document.getElementById("project-4-link")
  },
  "snowflake-project": {
    title: document.getElementById("project-5-title"),
    category: document.getElementById("project-5-category"),
    description: document.getElementById("project-5-description"),
    link: document.getElementById("project-5-link")
  }
}

function setLoggedOutView() {
  authStatus.textContent = "Not signed in"
  if (adminContent) adminContent.style.display = "none"
  if (logoutBtn) logoutBtn.style.display = "none"
  if (loginBtn) loginBtn.style.display = "inline-block"
}

function setLoggedInView(user) {
  authStatus.textContent = `Signed in as ${user.email}`
  if (adminContent) adminContent.style.display = "block"
  if (logoutBtn) logoutBtn.style.display = "inline-block"
  if (loginBtn) loginBtn.style.display = "none"
}

function clearForm() {
  Object.values(fields).forEach((field) => {
    if (field) field.value = ""
  })

  Object.values(projectFields).forEach((project) => {
    Object.values(project).forEach((field) => {
      if (field) field.value = ""
    })
  })
}

async function loadSiteContent() {
  const siteRef = doc(db, "siteContent", "main")
  const siteSnap = await getDoc(siteRef)

  if (siteSnap.exists()) {
    const data = siteSnap.data()

    fields.heroEyebrow.value = data.heroEyebrow || ""
    fields.heroTitle.value = data.heroTitle || ""
    fields.heroText.value = data.heroText || ""
    fields.aboutText.value = data.aboutText || ""
    fields.email.value = data.email || ""
    fields.linkedin.value = data.linkedin || ""
    fields.github.value = data.github || ""
    fields.academiaText.value = data.academiaText || ""
    fields.workText.value = data.workText || ""
    fields.awardsText.value = data.awardsText || ""
  }

  const projectIds = Object.keys(projectFields)

  await Promise.all(
    projectIds.map(async (projectId) => {
      const projectRef = doc(db, "projects", projectId)
      const projectSnap = await getDoc(projectRef)

      if (projectSnap.exists()) {
        const data = projectSnap.data()
        const project = projectFields[projectId]

        project.title.value = data.title || ""
        project.category.value = data.category || ""
        project.description.value = data.description || ""
        project.link.value = data.link || ""
      }
    })
  )
}

async function saveSiteContent() {
  const siteRef = doc(db, "siteContent", "main")

  const siteData = {
    heroEyebrow: fields.heroEyebrow.value.trim(),
    heroTitle: fields.heroTitle.value.trim(),
    heroText: fields.heroText.value.trim(),
    aboutText: fields.aboutText.value.trim(),
    email: fields.email.value.trim(),
    linkedin: fields.linkedin.value.trim(),
    github: fields.github.value.trim(),
    academiaText: fields.academiaText.value.trim(),
    workText: fields.workText.value.trim(),
    awardsText: fields.awardsText.value.trim(),
    updatedAt: new Date().toISOString()
  }

  await setDoc(siteRef, siteData, { merge: true })

  const projectSaves = Object.entries(projectFields).map(
    async ([projectId, project]) => {
      const projectRef = doc(db, "projects", projectId)

      const projectData = {
        title: project.title.value.trim(),
        category: project.category.value.trim(),
        description: project.description.value.trim(),
        link: project.link.value.trim(),
        updatedAt: new Date().toISOString()
      }

      await setDoc(projectRef, projectData, { merge: true })
    }
  )

  await Promise.all(projectSaves)
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      if (user.email !== allowedAdminEmail) {
        await signOut(auth)
        authStatus.textContent = "This account is not allowed"
        return
      }

      saveMessage.textContent = "Signed in"
    } catch (error) {
      console.error("Login error:", error)
      authStatus.textContent = "Sign in failed"
    }
  })
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth)
      clearForm()
      saveMessage.textContent = "Signed out"
    } catch (error) {
      console.error("Logout error:", error)
      authStatus.textContent = "Sign out failed"
    }
  })
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const user = auth.currentUser

    if (!user) {
      saveMessage.textContent = "You must sign in first"
      return
    }

    if (user.email !== allowedAdminEmail) {
      saveMessage.textContent = "You are not allowed to save"
      return
    }

    try {
      saveMessage.textContent = "Saving..."
      await saveSiteContent()
      saveMessage.textContent = "Changes saved"
    } catch (error) {
      console.error("Save error:", error)
      saveMessage.textContent = "Save failed"
    }
  })
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setLoggedOutView()
    return
  }

  if (user.email !== allowedAdminEmail) {
    await signOut(auth)
    setLoggedOutView()
    authStatus.textContent = "This account is not allowed"
    return
  }

  try {
    setLoggedInView(user)
    await loadSiteContent()
    saveMessage.textContent = "Content loaded"
  } catch (error) {
    console.error("Load error:", error)
    saveMessage.textContent = "Could not load content"
  }
})

setLoggedOutView()