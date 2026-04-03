const API_BASE = 'https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod'

const getEl = (id) => document.getElementById(id)

const setText = (id, value, fallback = '') => {
  const el = getEl(id)
  if (el) el.textContent = value || fallback
}

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const normalizeProjects = (items = []) =>
  items.map((item) => ({
    project_id: item.project_id || '',
    title: item.title || 'Untitled Project',
    description: item.description || '',
    category: item.category || 'Project',
    slug: item.slug || '',
    link: item.link || '',
    image_url: item.image_url || '',
    is_visible: item.is_visible !== false,
    is_featured: !!item.is_featured,
    sort_order: Number(item.sort_order || 9999)
  }))

const normalizePosts = (items = []) =>
  items.map((item) => ({
    post_id: item.post_id || '',
    title: item.title || 'Untitled Post',
    excerpt: item.excerpt || '',
    content: item.content || '',
    slug: item.slug || '',
    cover_image_url: item.cover_image_url || '',
    is_published: item.is_published !== false,
    sort_order: Number(item.sort_order || 9999)
  }))

const normalizeResumes = (items = []) =>
  items.map((item) => ({
    resume_id: item.resume_id || '',
    title: item.title || 'Current Resume',
    file_name: item.file_name || '',
    file_url: item.file_url || '',
    is_current: !!item.is_current
  }))

const createProjectCard = (project) => {
  const href = project.link && project.link.trim() ? project.link.trim() : null
  const tag = escapeHtml(project.category)
  const title = escapeHtml(project.title)
  const description = escapeHtml(project.description)

  const inner = `
    <article class='project_card'>
      <span class='project_tag'>${tag}</span>
      <h3>${title}</h3>
      <p>${description}</p>
    </article>
  `

  if (href) {
    const isExternal = /^https?:\/\//i.test(href)
    const target = isExternal ? " target='_blank' rel='noopener noreferrer'" : ''
    return `<a href='${escapeHtml(href)}' class='project_card_link'${target}>${inner}</a>`
  }

  return `<div class='project_card_link'>${inner}</div>`
}

const createSeeMoreCard = () => `
  <a href='projects.html' class='project_card_link'>
    <article class='project_card see_more_card'>
      <span class='project_tag'>More</span>
      <h3>See More Projects</h3>
      <p>View the full collection of projects and case studies.</p>
    </article>
  </a>
`

const renderProjects = (items = []) => {
  const grid = getEl('projects_grid')
  if (!grid) return

  const visibleProjects = normalizeProjects(items)
    .filter((project) => project.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!visibleProjects.length) {
    grid.innerHTML = `
      <article class='project_card'>
        <h3>No projects yet</h3>
        <p>Add projects from the admin dashboard.</p>
      </article>
    `
    return
  }

  const shownProjects = visibleProjects.slice(0, 5)
  const cards = shownProjects.map(createProjectCard)

  cards.push(createSeeMoreCard())

  grid.innerHTML = cards.join('')
}

const renderPosts = (items = []) => {
  const grid = getEl('posts_grid')
  if (!grid) return

  const publishedPosts = normalizePosts(items)
    .filter((post) => post.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!publishedPosts.length) {
    grid.innerHTML = `
      <article class='project_card'>
        <h3>No posts yet</h3>
        <p>Add posts from the admin dashboard.</p>
      </article>
    `
    return
  }

  grid.innerHTML = publishedPosts
    .slice(0, 4)
    .map(
      (post) => `
        <article class='project_card'>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
        </article>
      `
    )
    .join('')
}

const renderResume = (items = []) => {
  const resumes = normalizeResumes(items)
  const currentResume = resumes.find((resume) => resume.is_current) || resumes[0]

  const textEl = getEl('current_resume_text')
  const linkEl = getEl('current_resume_link')

  if (!textEl || !linkEl) return

  if (!currentResume) {
    textEl.textContent = 'No resume available yet.'
    linkEl.style.display = 'none'
    return
  }

  textEl.textContent = currentResume.title || 'Current Resume'

  if (currentResume.file_url) {
    linkEl.href = currentResume.file_url
    linkEl.style.display = 'inline-block'
  } else {
    linkEl.style.display = 'none'
  }
}

const apiGet = async (id) => {
  const response = await fetch(`${API_BASE}/content/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to load ${id}`)
  }
  return response.json()
}

const loadContent = async () => {
  try {
    const [site, projects, posts, resumes] = await Promise.all([
      apiGet('site'),
      apiGet('projects'),
      apiGet('posts'),
      apiGet('resumes')
    ])

    setText('title', site.title, 'Hi, I’m Nicky')
    setText('subtitle', site.subtitle, 'Student • Developer • Builder')
    setText('intro', site.intro, 'Welcome to my portfolio.')
    setText('about', site.about, '')
    setText('academia', site.academia, '')
    setText('work', site.work, '')
    setText('awards', site.awards, '')
    setText('email', site.email, '')
    setText('linkedin', site.linkedin, '')
    setText('github', site.github, '')
    setText('instagram', site.instagram, '')

    renderProjects(projects.items || [])
    renderPosts(posts.items || [])
    renderResume(resumes.items || [])
  } catch (error) {
    console.error('Failed to load portfolio content:', error)
  }
}

loadContent()