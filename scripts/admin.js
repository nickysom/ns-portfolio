const API_BASE = 'https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod'
const COGNITO_DOMAIN = 'https://us-east-2jfof4gtel.auth.us-east-2.amazoncognito.com'
const CLIENT_ID = '5iaear77vsftb0fupep3mics45'
const REDIRECT_URI = 'https://nsportfolio.net/admin.html'
const ALLOWED_ADMIN_EMAIL = 'nickysom@icloud.com'

const SESSION_TOKEN_KEY = 'admin_id_token'
const SESSION_EMAIL_KEY = 'admin_email'
const SESSION_TIMER_KEY = 'admin_session_expires_at'
const PKCE_VERIFIER_KEY = 'pkce_code_verifier'
const SESSION_MS = 5 * 60 * 1000

const auth_status = document.getElementById('auth_status')
const login_btn = document.getElementById('login_btn')
const logout_btn = document.getElementById('logout_btn')
const save_message = document.getElementById('save_message')
const dashboard_shell = document.getElementById('dashboard_shell')
const welcome_screen = document.getElementById('welcome_screen')
const sidebar_auth_text = document.getElementById('sidebar_auth_text')

const nav_tabs = document.querySelectorAll('.nav_tab')
const dashboard_tabs = document.querySelectorAll('.dashboard_tab')

const site_form = document.getElementById('site_form')
const site_fields = {
  title: document.getElementById('title_input'),
  subtitle: document.getElementById('subtitle_input'),
  intro: document.getElementById('intro_input'),
  about: document.getElementById('about_input'),
  academia: document.getElementById('academia_input'),
  work: document.getElementById('work_input'),
  awards: document.getElementById('awards_input'),
  email: document.getElementById('email_input'),
  linkedin: document.getElementById('linkedin_input'),
  github: document.getElementById('github_input'),
  instagram: document.getElementById('instagram_input')
}

const projects_count = document.getElementById('projects_count')
const posts_count = document.getElementById('posts_count')
const resumes_count = document.getElementById('resumes_count')

const projects_list = document.getElementById('projects_list')
const posts_list = document.getElementById('posts_list')
const resumes_list = document.getElementById('resumes_list')

const new_project_btn = document.getElementById('new_project_btn')
const new_post_btn = document.getElementById('new_post_btn')
const new_resume_btn = document.getElementById('new_resume_btn')

const project_form = document.getElementById('project_form')
const project_fields = {
  id: document.getElementById('project_id'),
  title: document.getElementById('project_title'),
  slug: document.getElementById('project_slug'),
  category: document.getElementById('project_category'),
  description: document.getElementById('project_description'),
  link: document.getElementById('project_link'),
  image_url: document.getElementById('project_image_url'),
  is_visible: document.getElementById('project_is_visible'),
  is_featured: document.getElementById('project_is_featured'),
  sort_order: document.getElementById('project_sort_order')
}
const reset_project_btn = document.getElementById('reset_project_btn')

const post_form = document.getElementById('post_form')
const post_fields = {
  id: document.getElementById('post_id'),
  title: document.getElementById('post_title'),
  slug: document.getElementById('post_slug'),
  excerpt: document.getElementById('post_excerpt'),
  content: document.getElementById('post_content'),
  cover_image_url: document.getElementById('post_cover_image_url'),
  is_published: document.getElementById('post_is_published'),
  sort_order: document.getElementById('post_sort_order')
}
const reset_post_btn = document.getElementById('reset_post_btn')

const resume_form = document.getElementById('resume_form')
const resume_fields = {
  id: document.getElementById('resume_id'),
  title: document.getElementById('resume_title'),
  file_name: document.getElementById('resume_file_name'),
  file_url: document.getElementById('resume_file_url'),
  is_current: document.getElementById('resume_is_current')
}
const reset_resume_btn = document.getElementById('reset_resume_btn')

let projects_cache = []
let posts_cache = []
let resumes_cache = []
let logout_timer = null

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const set_message = (text) => {
  save_message.textContent = text
}

const switch_tab = (tab_id) => {
  nav_tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab_id)
  })

  dashboard_tabs.forEach((section) => {
    section.classList.toggle('active', section.id === tab_id)
  })
}

nav_tabs.forEach((button) => {
  button.addEventListener('click', () => switch_tab(button.dataset.tab))
})

const set_logged_out_view = () => {
  auth_status.textContent = 'Not signed in'
  sidebar_auth_text.textContent = 'Signed out'
  login_btn.style.display = 'inline-block'
  logout_btn.style.display = 'none'
  welcome_screen.style.display = 'flex'
  dashboard_shell.style.display = 'none'
}

const set_logged_in_view = (email = '') => {
  auth_status.textContent = email ? `Signed in as ${email}` : 'Signed in'
  sidebar_auth_text.textContent = email ? `Signed in as ${email}` : 'Signed in'
  login_btn.style.display = 'none'
  logout_btn.style.display = 'inline-block'
  welcome_screen.style.display = 'none'
  dashboard_shell.style.display = 'grid'
}

const clear_local_session = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_EMAIL_KEY)
  sessionStorage.removeItem(SESSION_TIMER_KEY)
  sessionStorage.removeItem(PKCE_VERIFIER_KEY)

  if (logout_timer) {
    clearTimeout(logout_timer)
    logout_timer = null
  }
}

const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
    return JSON.parse(json)
  } catch (error) {
    return null
  }
}

const buildLogoutUrl = () =>
  `${COGNITO_DOMAIN}/logout` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&logout_uri=${encodeURIComponent(REDIRECT_URI)}`

const end_session = (message = 'Signed out', redirectToCognito = false) => {
  clear_local_session()
  set_logged_out_view()
  set_message(message)

  if (redirectToCognito) {
    window.location.href = buildLogoutUrl()
  }
}

const schedule_auto_logout = () => {
  if (logout_timer) clearTimeout(logout_timer)

  const expires_at = Number(sessionStorage.getItem(SESSION_TIMER_KEY) || 0)
  const remaining = expires_at - Date.now()

  if (remaining <= 0) {
    end_session('Session expired after 5 minutes', true)
    return
  }

  logout_timer = setTimeout(() => {
    end_session('Session expired after 5 minutes', true)
  }, remaining)
}

const start_session = (token, email) => {
  const expires_at = Date.now() + SESSION_MS
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  sessionStorage.setItem(SESSION_EMAIL_KEY, email)
  sessionStorage.setItem(SESSION_TIMER_KEY, String(expires_at))
  set_logged_in_view(email)
  schedule_auto_logout()
}

const randomString = (length = 96) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (x) => chars[x % chars.length]).join('')
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

const base64UrlEncode = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer)
  let string = ''
  bytes.forEach((byte) => {
    string += String.fromCharCode(byte)
  })
  return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const createCodeChallenge = async (verifier) => {
  const hashed = await sha256(verifier)
  return base64UrlEncode(hashed)
}

const exchangeCodeForTokens = async (code, verifier) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  })

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Token exchange failed')
  }

  return response.json()
}

const handle_cognito_redirect = async () => {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const error_description = url.searchParams.get('error_description')

  if (error) {
    console.error('cognito error:', error, error_description)
    set_message(error_description || error)
    return false
  }

  if (!code) return false

  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
  if (!verifier) {
    set_message('Missing login verifier. Please try signing in again.')
    return false
  }

  try {
    const tokens = await exchangeCodeForTokens(code, verifier)
    const id_token = tokens.id_token
    const decoded = parseJwt(id_token)
    const email = decoded?.email || ''

    console.log('decoded token:', decoded)
    console.log('email from token:', email)
    console.log('allowed email:', ALLOWED_ADMIN_EMAIL)

    window.history.replaceState({}, document.title, window.location.pathname)

    if (!email) {
      set_message('Missing email in token')
      return false
    }

    if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      end_session('This account is not allowed', true)
      return false
    }

    start_session(id_token, email)
    sessionStorage.removeItem(PKCE_VERIFIER_KEY)
    return true
  } catch (error) {
    console.error('token exchange failed:', error)
    set_message('Sign in failed')
    return false
  }
}

const has_valid_session = () => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
  const email = sessionStorage.getItem(SESSION_EMAIL_KEY)
  const expires_at = Number(sessionStorage.getItem(SESSION_TIMER_KEY) || 0)

  if (!token || !email || expires_at <= Date.now()) {
    return false
  }

  if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
    return false
  }

  return true
}

const api_get = async (id) => {
  const response = await fetch(`${API_BASE}/content/${id}`)
  if (!response.ok) throw new Error(`Failed to load ${id}`)
  return response.json()
}

const api_put = async (id, payload) => {
  const response = await fetch(`${API_BASE}/content/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to save ${id}`)
  }

  return response.json()
}

const normalize_projects = (items = []) =>
  items.map((item) => ({
    id: item.project_id || '',
    title: item.title || '',
    slug: item.slug || '',
    category: item.category || '',
    description: item.description || '',
    link: item.link || '',
    image_url: item.image_url || '',
    is_visible: item.is_visible !== false,
    is_featured: !!item.is_featured,
    sort_order: Number(item.sort_order || 1)
  }))

const normalize_posts = (items = []) =>
  items.map((item) => ({
    id: item.post_id || '',
    title: item.title || '',
    slug: item.slug || '',
    excerpt: item.excerpt || '',
    content: item.content || '',
    cover_image_url: item.cover_image_url || '',
    is_published: item.is_published !== false,
    sort_order: Number(item.sort_order || 1)
  }))

const normalize_resumes = (items = []) =>
  items.map((item) => ({
    id: item.resume_id || '',
    title: item.title || '',
    file_name: item.file_name || '',
    file_url: item.file_url || '',
    is_current: !!item.is_current
  }))

const render_list = (container, items, type) => {
  if (!items.length) {
    container.innerHTML = `<div class='item_card'><p>No ${type} yet.</p></div>`
    return
  }

  container.innerHTML = items
    .map((item) => {
      const status_text =
        type === 'projects'
          ? item.is_visible ? 'Visible' : 'Hidden'
          : type === 'posts'
          ? item.is_published ? 'Published' : 'Draft'
          : item.is_current ? 'Current' : 'Archived'

      return `
        <div class='item_card'>
          <div class='item_card_top'>
            <div>
              <h4>${item.title || 'Untitled'}</h4>
              <p>${status_text}</p>
            </div>
            <div class='item_actions'>
              <button type='button' data_action='edit' data_type='${type}' data_id='${item.id}'>Edit</button>
              <button type='button' data_action='delete' data_type='${type}' data_id='${item.id}'>Delete</button>
            </div>
          </div>
        </div>
      `
    })
    .join('')
}

const update_counts = () => {
  projects_count.textContent = String(projects_cache.length)
  posts_count.textContent = String(posts_cache.length)
  resumes_count.textContent = String(resumes_cache.length)
}

const clear_project_form = () => {
  project_fields.id.value = ''
  project_fields.title.value = ''
  project_fields.slug.value = ''
  project_fields.category.value = ''
  project_fields.description.value = ''
  project_fields.link.value = ''
  project_fields.image_url.value = ''
  project_fields.is_visible.checked = true
  project_fields.is_featured.checked = false
  project_fields.sort_order.value = 1
}

const clear_post_form = () => {
  post_fields.id.value = ''
  post_fields.title.value = ''
  post_fields.slug.value = ''
  post_fields.excerpt.value = ''
  post_fields.content.value = ''
  post_fields.cover_image_url.value = ''
  post_fields.is_published.checked = true
  post_fields.sort_order.value = 1
}

const clear_resume_form = () => {
  resume_fields.id.value = ''
  resume_fields.title.value = ''
  resume_fields.file_name.value = ''
  resume_fields.file_url.value = ''
  resume_fields.is_current.checked = false
}

const fill_project_form = (item) => {
  project_fields.id.value = item.id
  project_fields.title.value = item.title || ''
  project_fields.slug.value = item.slug || ''
  project_fields.category.value = item.category || ''
  project_fields.description.value = item.description || ''
  project_fields.link.value = item.link || ''
  project_fields.image_url.value = item.image_url || ''
  project_fields.is_visible.checked = !!item.is_visible
  project_fields.is_featured.checked = !!item.is_featured
  project_fields.sort_order.value = item.sort_order ?? 1
  switch_tab('projects_tab')
}

const fill_post_form = (item) => {
  post_fields.id.value = item.id
  post_fields.title.value = item.title || ''
  post_fields.slug.value = item.slug || ''
  post_fields.excerpt.value = item.excerpt || ''
  post_fields.content.value = item.content || ''
  post_fields.cover_image_url.value = item.cover_image_url || ''
  post_fields.is_published.checked = !!item.is_published
  post_fields.sort_order.value = item.sort_order ?? 1
  switch_tab('posts_tab')
}

const fill_resume_form = (item) => {
  resume_fields.id.value = item.id
  resume_fields.title.value = item.title || ''
  resume_fields.file_name.value = item.file_name || ''
  resume_fields.file_url.value = item.file_url || ''
  resume_fields.is_current.checked = !!item.is_current
  switch_tab('resumes_tab')
}

const load_site_content = async () => {
  const data = await api_get('site')

  Object.keys(site_fields).forEach((key) => {
    site_fields[key].value = data[key] || ''
  })
}

const load_dashboard_data = async () => {
  await load_site_content()

  const projects_data = await api_get('projects')
  const posts_data = await api_get('posts')
  const resumes_data = await api_get('resumes')

  projects_cache = normalize_projects(projects_data.items || []).sort((a, b) => a.sort_order - b.sort_order)
  posts_cache = normalize_posts(posts_data.items || []).sort((a, b) => a.sort_order - b.sort_order)
  resumes_cache = normalize_resumes(resumes_data.items || [])

  render_list(projects_list, projects_cache, 'projects')
  render_list(posts_list, posts_cache, 'posts')
  render_list(resumes_list, resumes_cache, 'resumes')
  update_counts()
}

site_form.addEventListener('submit', async (event) => {
  event.preventDefault()

  try {
    await api_put('site', {
      id: 'site',
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
      instagram: site_fields.instagram.value.trim()
    })

    set_message('Site content saved')
    await load_dashboard_data()
  } catch (error) {
    console.error(error)
    set_message('Failed to save site content')
  }
})

project_form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const id = project_fields.id.value || `project_${Date.now()}`
  const item = {
    id,
    title: project_fields.title.value.trim(),
    slug: project_fields.slug.value.trim() || slugify(project_fields.title.value),
    category: project_fields.category.value.trim(),
    description: project_fields.description.value.trim(),
    link: project_fields.link.value.trim(),
    image_url: project_fields.image_url.value.trim(),
    is_visible: project_fields.is_visible.checked,
    is_featured: project_fields.is_featured.checked,
    sort_order: Number(project_fields.sort_order.value || 1)
  }

  const existing_index = projects_cache.findIndex((entry) => entry.id === id)

  if (existing_index >= 0) {
    projects_cache[existing_index] = item
  } else {
    projects_cache.push(item)
  }

  try {
    await api_put('projects', {
      id: 'projects',
      items: projects_cache
        .map((project) => ({
          project_id: project.id,
          title: project.title,
          slug: project.slug,
          category: project.category,
          description: project.description,
          link: project.link,
          image_url: project.image_url,
          is_visible: project.is_visible,
          is_featured: project.is_featured,
          sort_order: Number(project.sort_order || 1)
        }))
        .sort((a, b) => a.sort_order - b.sort_order)
    })

    clear_project_form()
    set_message(existing_index >= 0 ? 'Project updated' : 'Project created')
    await load_dashboard_data()
  } catch (error) {
    console.error(error)
    set_message('Failed to save project')
  }
})

post_form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const id = post_fields.id.value || `post_${Date.now()}`
  const item = {
    id,
    title: post_fields.title.value.trim(),
    slug: post_fields.slug.value.trim() || slugify(post_fields.title.value),
    excerpt: post_fields.excerpt.value.trim(),
    content: post_fields.content.value.trim(),
    cover_image_url: post_fields.cover_image_url.value.trim(),
    is_published: post_fields.is_published.checked,
    sort_order: Number(post_fields.sort_order.value || 1)
  }

  const existing_index = posts_cache.findIndex((entry) => entry.id === id)

  if (existing_index >= 0) {
    posts_cache[existing_index] = item
  } else {
    posts_cache.push(item)
  }

  try {
    await api_put('posts', {
      id: 'posts',
      items: posts_cache
        .map((post) => ({
          post_id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          cover_image_url: post.cover_image_url,
          is_published: post.is_published,
          sort_order: Number(post.sort_order || 1)
        }))
        .sort((a, b) => a.sort_order - b.sort_order)
    })

    clear_post_form()
    set_message(existing_index >= 0 ? 'Post updated' : 'Post created')
    await load_dashboard_data()
  } catch (error) {
    console.error(error)
    set_message('Failed to save post')
  }
})

resume_form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const id = resume_fields.id.value || `resume_${Date.now()}`

  if (resume_fields.is_current.checked) {
    resumes_cache = resumes_cache.map((item) => ({
      ...item,
      is_current: false
    }))
  }

  const item = {
    id,
    title: resume_fields.title.value.trim(),
    file_name: resume_fields.file_name.value.trim(),
    file_url: resume_fields.file_url.value.trim(),
    is_current: resume_fields.is_current.checked
  }

  const existing_index = resumes_cache.findIndex((entry) => entry.id === id)

  if (existing_index >= 0) {
    resumes_cache[existing_index] = item
  } else {
    resumes_cache.push(item)
  }

  try {
    await api_put('resumes', {
      id: 'resumes',
      items: resumes_cache.map((resume) => ({
        resume_id: resume.id,
        title: resume.title,
        file_name: resume.file_name,
        file_url: resume.file_url,
        is_current: resume.is_current
      }))
    })

    clear_resume_form()
    set_message(existing_index >= 0 ? 'Resume updated' : 'Resume created')
    await load_dashboard_data()
  } catch (error) {
    console.error(error)
    set_message('Failed to save resume')
  }
})

new_project_btn.addEventListener('click', () => {
  clear_project_form()
  switch_tab('projects_tab')
})

new_post_btn.addEventListener('click', () => {
  clear_post_form()
  switch_tab('posts_tab')
})

new_resume_btn.addEventListener('click', () => {
  clear_resume_form()
  switch_tab('resumes_tab')
})

reset_project_btn.addEventListener('click', clear_project_form)
reset_post_btn.addEventListener('click', clear_post_form)
reset_resume_btn.addEventListener('click', clear_resume_form)

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data_action]')
  if (!button) return

  const { action, type, id } = button.dataset

  if (action === 'edit') {
    if (type === 'projects') {
      const item = projects_cache.find((entry) => entry.id === id)
      if (item) fill_project_form(item)
    }

    if (type === 'posts') {
      const item = posts_cache.find((entry) => entry.id === id)
      if (item) fill_post_form(item)
    }

    if (type === 'resumes') {
      const item = resumes_cache.find((entry) => entry.id === id)
      if (item) fill_resume_form(item)
    }
    return
  }

  if (action === 'delete') {
    const ok = window.confirm('Delete this item?')
    if (!ok) return

    try {
      if (type === 'projects') {
        projects_cache = projects_cache.filter((item) => item.id !== id)
        await api_put('projects', {
          id: 'projects',
          items: projects_cache
            .map((project) => ({
              project_id: project.id,
              title: project.title,
              slug: project.slug,
              category: project.category,
              description: project.description,
              link: project.link,
              image_url: project.image_url,
              is_visible: project.is_visible,
              is_featured: project.is_featured,
              sort_order: Number(project.sort_order || 1)
            }))
            .sort((a, b) => a.sort_order - b.sort_order)
        })
      }

      if (type === 'posts') {
        posts_cache = posts_cache.filter((item) => item.id !== id)
        await api_put('posts', {
          id: 'posts',
          items: posts_cache
            .map((post) => ({
              post_id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              cover_image_url: post.cover_image_url,
              is_published: post.is_published,
              sort_order: Number(post.sort_order || 1)
            }))
            .sort((a, b) => a.sort_order - b.sort_order)
        })
      }

      if (type === 'resumes') {
        resumes_cache = resumes_cache.filter((item) => item.id !== id)
        await api_put('resumes', {
          id: 'resumes',
          items: resumes_cache.map((resume) => ({
            resume_id: resume.id,
            title: resume.title,
            file_name: resume.file_name,
            file_url: resume.file_url,
            is_current: resume.is_current
          }))
        })
      }

      set_message('Item deleted')
      await load_dashboard_data()
    } catch (error) {
      console.error(error)
      set_message('Failed to delete item')
    }
  }
})

login_btn.addEventListener('click', async () => {
  clear_local_session()

  const verifier = randomString(96)
  const challenge = await createCodeChallenge(verifier)
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)

  const loginUrl =
    `${COGNITO_DOMAIN}/login` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code_challenge_method=S256` +
    `&code_challenge=${encodeURIComponent(challenge)}`

  window.location.href = loginUrl
})

logout_btn.addEventListener('click', () => {
  end_session('Signed out', true)
})

const boot = async () => {
  console.log('BOOT START')
  console.log('current url:', window.location.href)
  console.log('search:', window.location.search)

  const just_logged_in = await handle_cognito_redirect()
  console.log('just_logged_in:', just_logged_in)

  if (just_logged_in || has_valid_session()) {
    const email = sessionStorage.getItem(SESSION_EMAIL_KEY) || ''
    console.log('valid session for:', email)

    set_logged_in_view(email)
    schedule_auto_logout()

    try {
      await load_dashboard_data()
      console.log('dashboard loaded')
    } catch (error) {
      console.error('dashboard load failed:', error)
      set_message('Failed to load dashboard data')
    }
  } else {
    console.log('no valid session, showing local login')
    clear_local_session()
    set_logged_out_view()
  }
}

boot()