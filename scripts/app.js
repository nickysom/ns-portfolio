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

// ── Normalizers ───────────────────────────────────────────────────────────────

const normalizeProjects = (items = []) =>
  items.map((item) => ({
    project_id:  item.project_id || '',
    title:       item.title || 'Untitled Project',
    description: item.description || '',
    category:    item.category || 'Project',
    slug:        item.slug || '',
    link:        item.link || '',
    image_url:   item.image_url || '',
    is_visible:  item.is_visible !== false,
    is_featured: !!item.is_featured,
    sort_order:  Number(item.sort_order || 9999)
  }))

const normalizePosts = (items = []) =>
  items.map((item) => ({
    post_id:         item.post_id || '',
    title:           item.title || 'Untitled Post',
    excerpt:         item.excerpt || '',
    content:         item.content || '',
    slug:            item.slug || '',
    cover_image_url: item.cover_image_url || '',
    is_published:    item.is_published !== false,
    sort_order:      Number(item.sort_order || 9999)
  }))

const normalizeResumes = (items = []) =>
  items.map((item) => ({
    resume_id:  item.resume_id || '',
    title:      item.title || 'Current Resume',
    file_name:  item.file_name || '',
    file_url:   item.file_url || '',
    is_current: !!item.is_current
  }))

const normalizeWork = (items = []) =>
  items.map((item) => ({
    id:           item.work_id || '',
    title:        item.title || '',
    category:     item.category || '',
    organization: item.organization || '',
    date_range:   item.date_range || '',
    description:  item.description || '',
    link:         item.link || '',
    sort_order:   Number(item.sort_order || 9999),
    is_visible:   item.is_visible !== false,
  }))

const normalizeEntries = (items = [], id_key) =>
  items.map((item) => ({
    id:           item[id_key] || '',
    title:        item.title || '',
    subtitle:     item.subtitle || '',
    organization: item.organization || '',
    date_range:   item.date_range || '',
    description:  item.description || '',
    link:         item.link || '',
    sort_order:   Number(item.sort_order || 9999),
    is_visible:   item.is_visible !== false,
  }))

// ── Renderers ─────────────────────────────────────────────────────────────────

const createProjectCard = (project) => {
  const href = project.link && project.link.trim() ? project.link.trim() : null
  const inner = `
    <article class='project_card'>
      <span class='project_tag'>${escapeHtml(project.category)}</span>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.description)}</p>
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

// A single role row inside a company card
const createRoleRow = (entry) => {
  const hasLink    = entry.link && entry.link.trim()
  const isExternal = hasLink && /^https?:\/\//i.test(entry.link.trim())

  return `
    <div class='role_row'>
      <div class='role_row_header'>
        <div class='role_row_titles'>
          <h4 class='role_title'>${escapeHtml(entry.title)}</h4>
          ${entry.category ? `<span class='role_category_tag'>${escapeHtml(entry.category)}</span>` : ''}
        </div>
        ${entry.date_range ? `<span class='entry_date'>${escapeHtml(entry.date_range)}</span>` : ''}
      </div>
      ${entry.description ? `<p class='entry_description'>${escapeHtml(entry.description)}</p>` : ''}
      ${hasLink ? `<a href='${escapeHtml(entry.link.trim())}' class='entry_link' ${isExternal ? "target='_blank' rel='noopener noreferrer'" : ''}>View →</a>` : ''}
    </div>
  `
}

// A company card grouping multiple roles
const createCompanyCard = (org_name, roles) => `
  <div class='company_card'>
    <div class='company_card_header'>
      <h3 class='company_name'>${escapeHtml(org_name)}</h3>
    </div>
    <div class='company_roles'>
      ${roles.map(createRoleRow).join('')}
    </div>
  </div>
`

// Standalone entry card for academia / awards
const createEntryCard = (entry) => {
  const hasLink    = entry.link && entry.link.trim()
  const isExternal = hasLink && /^https?:\/\//i.test(entry.link.trim())

  return `
    <div class='entry_card'>
      <div class='entry_card_header'>
        <div class='entry_card_titles'>
          <h3 class='entry_title'>${escapeHtml(entry.title)}</h3>
          ${entry.subtitle     ? `<p class='entry_subtitle'>${escapeHtml(entry.subtitle)}</p>` : ''}
          ${entry.organization ? `<p class='entry_org'>${escapeHtml(entry.organization)}</p>` : ''}
        </div>
        ${entry.date_range ? `<span class='entry_date'>${escapeHtml(entry.date_range)}</span>` : ''}
      </div>
      ${entry.description ? `<p class='entry_description'>${escapeHtml(entry.description)}</p>` : ''}
      ${hasLink ? `<a href='${escapeHtml(entry.link.trim())}' class='entry_link' ${isExternal ? "target='_blank' rel='noopener noreferrer'" : ''}>View →</a>` : ''}
    </div>
  `
}

// ── Render functions ──────────────────────────────────────────────────────────

const renderProjects = (items = []) => {
  const grid = getEl('projects_grid')
  if (!grid) return

  const visible = normalizeProjects(items)
    .filter((p) => p.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!visible.length) {
    grid.innerHTML = `<article class='project_card'><h3>No projects yet</h3><p>Add projects from the admin dashboard.</p></article>`
    return
  }

  const cards = visible.slice(0, 5).map(createProjectCard)
  cards.push(createSeeMoreCard())
  grid.innerHTML = cards.join('')
}

const renderPosts = (items = []) => {
  const grid = getEl('posts_grid')
  if (!grid) return

  const published = normalizePosts(items)
    .filter((p) => p.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!published.length) {
    grid.innerHTML = `<article class='project_card'><h3>No posts yet</h3><p>Add posts from the admin dashboard.</p></article>`
    return
  }

  grid.innerHTML = published.slice(0, 4).map((post) => `
    <article class='project_card'>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.excerpt)}</p>
    </article>
  `).join('')
}

const renderResume = (items = []) => {
  const resumes = normalizeResumes(items)
  const current = resumes.find((r) => r.is_current) || resumes[0]
  const textEl  = getEl('current_resume_text')
  const linkEl  = getEl('current_resume_link')
  if (!textEl || !linkEl) return

  if (!current) {
    textEl.textContent = 'No resume available yet.'
    linkEl.style.display = 'none'
    return
  }

  textEl.textContent = current.title || 'Current Resume'
  if (current.file_url) {
    linkEl.href = current.file_url
    linkEl.style.display = 'inline-block'
  } else {
    linkEl.style.display = 'none'
  }
}

const renderWork = (items = []) => {
  const container = getEl('work_grid')
  if (!container) return

  // Only visible entries, sort_order ascending (1 = newest = top)
  const entries = normalizeWork(items)
    .filter((e) => e.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!entries.length) {
    container.innerHTML = `<p class='entries_empty'>Work experience coming soon.</p>`
    return
  }

  // Group by organization (case-insensitive). Entries with no org stay standalone.
  const groups = new Map()
  for (const entry of entries) {
    const key = entry.organization.trim().toLowerCase() || `__solo__${entry.id}`
    if (!groups.has(key)) groups.set(key, { org_name: entry.organization.trim(), roles: [] })
    groups.get(key).roles.push(entry)
  }

  // Sort groups so the group with the lowest sort_order entry appears first
  const sorted_groups = [...groups.values()].sort((a, b) => {
    const min_a = Math.min(...a.roles.map((r) => r.sort_order))
    const min_b = Math.min(...b.roles.map((r) => r.sort_order))
    return min_a - min_b
  })

  container.innerHTML = sorted_groups.map((group) =>
    group.org_name
      ? createCompanyCard(group.org_name, group.roles)
      : group.roles.map(createEntryCard).join('')
  ).join('')
}

const renderEntries = (containerId, items = [], id_key, emptyMessage) => {
  const container = getEl(containerId)
  if (!container) return

  // Only visible entries, sort ascending
  const entries = normalizeEntries(items, id_key)
    .filter((e) => e.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!entries.length) {
    container.innerHTML = `<p class='entries_empty'>${emptyMessage}</p>`
    return
  }

  container.innerHTML = entries.map(createEntryCard).join('')
}

// ── API ───────────────────────────────────────────────────────────────────────

const apiGet = async (id) => {
  const response = await fetch(`${API_BASE}/content/${id}`)
  if (!response.ok) throw new Error(`Failed to load ${id}`)
  return response.json()
}

const safeGet = async (id) => {
  try { return await apiGet(id) }
  catch { return { items: [] } }
}

// ── Load ──────────────────────────────────────────────────────────────────────

const loadContent = async () => {
  try {
    const [site, projects, posts, resumes, work, academia, awards] = await Promise.all([
      apiGet('site'),
      safeGet('projects'),
      safeGet('posts'),
      safeGet('resumes'),
      safeGet('work'),
      safeGet('academia'),
      safeGet('awards'),
    ])

    setText('title',     site.title,     "Hi, I'm Nicky")
    setText('subtitle',  site.subtitle,  'Student • Developer • Builder')
    setText('intro',     site.intro,     'Welcome to my portfolio.')
    setText('about',     site.about,     '')
    setText('email',     site.email,     '')
    setText('linkedin',  site.linkedin,  '')
    setText('github',    site.github,    '')
    setText('instagram', site.instagram, '')

    renderProjects(projects.items || [])
    renderPosts(posts.items || [])
    renderResume(resumes.items || [])
    renderWork(work.items || [])
    renderEntries('academia_grid', academia.items || [], 'academia_id', 'Academic background coming soon.')
    renderEntries('awards_grid',   awards.items   || [], 'awards_id',   'Awards and achievements coming soon.')

  } catch (error) {
    console.error('Failed to load portfolio content:', error)
  }
}

loadContent()