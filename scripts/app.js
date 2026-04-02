import { db } from "./firebase-config.js"
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"

async function loadSiteContent() {
  const siteRef = doc(db, "siteContent", "main")
  const siteSnap = await getDoc(siteRef)

  if (siteSnap.exists()) {
    const data = siteSnap.data()

    document.getElementById("title").textContent = data.title || ""
    document.getElementById("subtitle").textContent = data.subtitle || ""
    document.getElementById("intro").textContent = data.intro || ""
    document.getElementById("about").textContent = data.about || ""
    document.getElementById("academia").textContent = data.academia || ""
    document.getElementById("work").textContent = data.work || ""
    document.getElementById("awards").textContent = data.awards || ""
    document.getElementById("email").textContent = data.email || ""
    document.getElementById("linkedin").textContent = data.linkedin || ""
    document.getElementById("github").textContent = data.github || ""
    document.getElementById("instagram").textContent = data.instagram || ""
  }
}

async function loadProject(projectId) {
  const projectRef = doc(db, "projects", projectId)
  const projectSnap = await getDoc(projectRef)

  if (projectSnap.exists()) {
    const data = projectSnap.data()

    document.getElementById(`title_${projectId}`).textContent = data.title || ""
    document.getElementById(`category_${projectId}`).textContent = data.category || ""
    document.getElementById(`description_${projectId}`).textContent = data.description || ""

    const linkEl = document.getElementById(`link_${projectId}`)
    linkEl.textContent = data.link ? "View Project" : "Coming Soon"
    linkEl.href = data.link || "#"
  }
}

async function init() {
  await loadSiteContent()

  await Promise.all([
    loadProject("nsportfolio_game"),
    loadProject("aws_asana_backup"),
    loadProject("figma"),
    loadProject("coding"),
    loadProject("snowflake")
  ])
}

init()