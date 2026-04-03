const API_BASE = 'https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod';

const allowed_admin_email = 'nickysom@icloud.com';
const DEV_MODE = true;

const auth_status = document.getElementById('auth_status');
const login_btn = document.getElementById('login_btn');
const logout_btn = document.getElementById('logout_btn');
const admin_content = document.getElementById('admin_content');
const save_message = document.getElementById('save_message');
const dashboard_shell = document.getElementById('dashboard_shell');
const welcome_screen = document.getElementById('welcome_screen');
const sidebar_auth_text = document.getElementById('sidebar_auth_text');

const nav_tabs = document.querySelectorAll('.nav_tab');
const dashboard_tabs = document.querySelectorAll('.dashboard_tab');

const site_form = document.getElementById('site_form');
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
};

const projects_count = document.getElementById('projects_count');
const posts_count = document.getElementById('posts_count');
const resumes_count = document.getElementById('resumes_count');

const projects_list = document.getElementById('projects_list');
const posts_list = document.getElementById('posts_list');
const resumes_list = document.getElementById('resumes_list');

const new_project_btn = document.getElementById('new_project_btn');
const new_post_btn = document.getElementById('new_post_btn');
const new_resume_btn = document.getElementById('new_resume_btn');

const project_form = document.getElementById('project_form');
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
};
const reset_project_btn = document.getElementById('reset_project_btn');

const post_form = document.getElementById('post_form');
const post_fields = {
  id: document.getElementById('post_id'),
  title: document.getElementById('post_title'),
  slug: document.getElementById('post_slug'),
  excerpt: document.getElementById('post_excerpt'),
  content: document.getElementById('post_content'),
  cover_image_url: document.getElementById('post_cover_image_url'),
  is_published: document.getElementById('post_is_published'),
  sort_order: document.getElementById('post_sort_order')
};
const reset_post_btn = document.getElementById('reset_post_btn');

const resume_form = document.getElementById('resume_form');
const resume_fields = {
  id: document.getElementById('resume_id'),
  title: document.getElementById('resume_title'),
  file_name: document.getElementById('resume_file_name'),
  file_url: document.getElementById('resume_file_url'),
  is_current: document.getElementById('resume_is_current')
};
const reset_resume_btn = document.getElementById('reset_resume_btn');

let projects_cache = [];
let posts_cache = [];
let resumes_cache = [];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function set_message(text) {
  save_message.textContent = text;
}

function switch_tab(tab_id) {
  nav_tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab_id);
  });

  dashboard_tabs.forEach((section) => {
    section.classList.toggle('active', section.id === tab_id);
  });
}

nav_tabs.forEach((button) => {
  button.addEventListener('click', () => switch_tab(button.dataset.tab));
});

function set_logged_out_view() {
  auth_status.textContent = 'Not signed in';
  sidebar_auth_text.textContent = 'Signed out';
  login_btn.style.display = 'inline-block';
  logout_btn.style.display = 'none';
  welcome_screen.style.display = 'flex';
  dashboard_shell.style.display = 'none';
}

function set_logged_in_view(email = allowed_admin_email) {
  auth_status.textContent = `Signed in as ${email}`;
  sidebar_auth_text.textContent = `Signed in as ${email}`;
  login_btn.style.display = 'none';
  logout_btn.style.display = 'inline-block';
  welcome_screen.style.display = 'none';
  dashboard_shell.style.display = 'grid';
}

async function api_get(id) {
  const response = await fetch(`${API_BASE}/content/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${id}`);
  }
  return response.json();
}

async function api_put(id, payload) {
  const response = await fetch(`${API_BASE}/content/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to save ${id}`);
  }

  return response.json();
}

function normalize_projects(items = []) {
  return items.map((item) => ({
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
  }));
}

function normalize_posts(items = []) {
  return items.map((item) => ({
    id: item.post_id || '',
    title: item.title || '',
    slug: item.slug || '',
    excerpt: item.excerpt || '',
    content: item.content || '',
    cover_image_url: item.cover_image_url || '',
    is_published: item.is_published !== false,
    sort_order: Number(item.sort_order || 1)
  }));
}

function normalize_resumes(items = []) {
  return items.map((item) => ({
    id: item.resume_id || '',
    title: item.title || '',
    file_name: item.file_name || '',
    file_url: item.file_url || '',
    is_current: !!item.is_current
  }));
}

function render_list(container, items, type) {
  if (!items.length) {
    container.innerHTML = `<div class="item_card"><p>No ${type} yet.</p></div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const status_text =
        type === 'projects'
          ? item.is_visible ? 'Visible' : 'Hidden'
          : type === 'posts'
          ? item.is_published ? 'Published' : 'Draft'
          : item.is_current ? 'Current' : 'Archived';

      return `
        <div class="item_card">
          <div class="item_card_top">
            <div>
              <h4>${item.title || 'Untitled'}</h4>
              <p>${status_text}</p>
            </div>
            <div class="item_actions">
              <button type="button" data_action="edit" data_type="${type}" data_id="${item.id}">Edit</button>
              <button type="button" data_action="delete" data_type="${type}" data_id="${item.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function update_counts() {
  projects_count.textContent = String(projects_cache.length);
  posts_count.textContent = String(posts_cache.length);
  resumes_count.textContent = String(resumes_cache.length);
}

function clear_project_form() {
  project_fields.id.value = '';
  project_fields.title.value = '';
  project_fields.slug.value = '';
  project_fields.category.value = '';
  project_fields.description.value = '';
  project_fields.link.value = '';
  project_fields.image_url.value = '';
  project_fields.is_visible.checked = true;
  project_fields.is_featured.checked = false;
  project_fields.sort_order.value = 1;
}

function clear_post_form() {
  post_fields.id.value = '';
  post_fields.title.value = '';
  post_fields.slug.value = '';
  post_fields.excerpt.value = '';
  post_fields.content.value = '';
  post_fields.cover_image_url.value = '';
  post_fields.is_published.checked = true;
  post_fields.sort_order.value = 1;
}

function clear_resume_form() {
  resume_fields.id.value = '';
  resume_fields.title.value = '';
  resume_fields.file_name.value = '';
  resume_fields.file_url.value = '';
  resume_fields.is_current.checked = false;
}

function fill_project_form(item) {
  project_fields.id.value = item.id;
  project_fields.title.value = item.title || '';
  project_fields.slug.value = item.slug || '';
  project_fields.category.value = item.category || '';
  project_fields.description.value = item.description || '';
  project_fields.link.value = item.link || '';
  project_fields.image_url.value = item.image_url || '';
  project_fields.is_visible.checked = !!item.is_visible;
  project_fields.is_featured.checked = !!item.is_featured;
  project_fields.sort_order.value = item.sort_order ?? 1;
  switch_tab('projects_tab');
}

function fill_post_form(item) {
  post_fields.id.value = item.id;
  post_fields.title.value = item.title || '';
  post_fields.slug.value = item.slug || '';
  post_fields.excerpt.value = item.excerpt || '';
  post_fields.content.value = item.content || '';
  post_fields.cover_image_url.value = item.cover_image_url || '';
  post_fields.is_published.checked = !!item.is_published;
  post_fields.sort_order.value = item.sort_order ?? 1;
  switch_tab('posts_tab');
}

function fill_resume_form(item) {
  resume_fields.id.value = item.id;
  resume_fields.title.value = item.title || '';
  resume_fields.file_name.value = item.file_name || '';
  resume_fields.file_url.value = item.file_url || '';
  resume_fields.is_current.checked = !!item.is_current;
  switch_tab('resumes_tab');
}

async function load_site_content() {
  const data = await api_get('site');

  Object.keys(site_fields).forEach((key) => {
    site_fields[key].value = data[key] || '';
  });
}

async function load_dashboard_data() {
  await load_site_content();

  const projects_data = await api_get('projects');
  const posts_data = await api_get('posts');
  const resumes_data = await api_get('resumes');

  projects_cache = normalize_projects(projects_data.items || []).sort((a, b) => a.sort_order - b.sort_order);
  posts_cache = normalize_posts(posts_data.items || []).sort((a, b) => a.sort_order - b.sort_order);
  resumes_cache = normalize_resumes(resumes_data.items || []);

  render_list(projects_list, projects_cache, 'projects');
  render_list(posts_list, posts_cache, 'posts');
  render_list(resumes_list, resumes_cache, 'resumes');
  update_counts();
}

site_form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
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
  };

  try {
    await api_put('site', payload);
    set_message('Site content saved');
    await load_dashboard_data();
  } catch (error) {
    console.error(error);
    set_message('Failed to save site content');
  }
});

project_form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = project_fields.id.value || `project_${Date.now()}`;

  const item = {
    project_id: id,
    title: project_fields.title.value.trim(),
    slug: project_fields.slug.value.trim() || slugify(project_fields.title.value),
    category: project_fields.category.value.trim(),
    description: project_fields.description.value.trim(),
    link: project_fields.link.value.trim(),
    image_url: project_fields.image_url.value.trim(),
    is_visible: project_fields.is_visible.checked,
    is_featured: project_fields.is_featured.checked,
    sort_order: Number(project_fields.sort_order.value || 1)
  };

  const existing_index = projects_cache.findIndex((entry) => entry.id === id);

  if (existing_index >= 0) {
    projects_cache[existing_index] = {
      id,
      ...item
    };
  } else {
    projects_cache.push({
      id,
      ...item
    });
  }

  try {
    await api_put('projects', {
      id: 'projects',
      items: projects_cache.map((project) => ({
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
    });

    clear_project_form();
    set_message(existing_index >= 0 ? 'Project updated' : 'Project created');
    await load_dashboard_data();
  } catch (error) {
    console.error(error);
    set_message('Failed to save project');
  }
});

post_form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = post_fields.id.value || `post_${Date.now()}`;

  const item = {
    post_id: id,
    title: post_fields.title.value.trim(),
    slug: post_fields.slug.value.trim() || slugify(post_fields.title.value),
    excerpt: post_fields.excerpt.value.trim(),
    content: post_fields.content.value.trim(),
    cover_image_url: post_fields.cover_image_url.value.trim(),
    is_published: post_fields.is_published.checked,
    sort_order: Number(post_fields.sort_order.value || 1)
  };

  const existing_index = posts_cache.findIndex((entry) => entry.id === id);

  if (existing_index >= 0) {
    posts_cache[existing_index] = {
      id,
      ...item
    };
  } else {
    posts_cache.push({
      id,
      ...item
    });
  }

  try {
    await api_put('posts', {
      id: 'posts',
      items: posts_cache.map((post) => ({
        post_id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_image_url: post.cover_image_url,
        is_published: post.is_published,
        sort_order: Number(post.sort_order || 1)
      }))
    });

    clear_post_form();
    set_message(existing_index >= 0 ? 'Post updated' : 'Post created');
    await load_dashboard_data();
  } catch (error) {
    console.error(error);
    set_message('Failed to save post');
  }
});

resume_form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = resume_fields.id.value || `resume_${Date.now()}`;

  if (resume_fields.is_current.checked) {
    resumes_cache = resumes_cache.map((item) => ({
      ...item,
      is_current: false
    }));
  }

  const item = {
    resume_id: id,
    title: resume_fields.title.value.trim(),
    file_name: resume_fields.file_name.value.trim(),
    file_url: resume_fields.file_url.value.trim(),
    is_current: resume_fields.is_current.checked
  };

  const existing_index = resumes_cache.findIndex((entry) => entry.id === id);

  if (existing_index >= 0) {
    resumes_cache[existing_index] = {
      id,
      ...item
    };
  } else {
    resumes_cache.push({
      id,
      ...item
    });
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
    });

    clear_resume_form();
    set_message(existing_index >= 0 ? 'Resume updated' : 'Resume created');
    await load_dashboard_data();
  } catch (error) {
    console.error(error);
    set_message('Failed to save resume');
  }
});

new_project_btn.addEventListener('click', () => {
  clear_project_form();
  switch_tab('projects_tab');
});

new_post_btn.addEventListener('click', () => {
  clear_post_form();
  switch_tab('posts_tab');
});

new_resume_btn.addEventListener('click', () => {
  clear_resume_form();
  switch_tab('resumes_tab');
});

reset_project_btn.addEventListener('click', clear_project_form);
reset_post_btn.addEventListener('click', clear_post_form);
reset_resume_btn.addEventListener('click', clear_resume_form);

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data_action]');
  if (!button) return;

  const { action, type, id } = button.dataset;

  if (action === 'edit') {
    if (type === 'projects') {
      const item = projects_cache.find((entry) => entry.id === id);
      if (item) fill_project_form(item);
    }

    if (type === 'posts') {
      const item = posts_cache.find((entry) => entry.id === id);
      if (item) fill_post_form(item);
    }

    if (type === 'resumes') {
      const item = resumes_cache.find((entry) => entry.id === id);
      if (item) fill_resume_form(item);
    }
  }

  if (action === 'delete') {
    const ok = window.confirm('Delete this item?');
    if (!ok) return;

    try {
      if (type === 'projects') {
        projects_cache = projects_cache.filter((item) => item.id !== id);
        await api_put('projects', {
          id: 'projects',
          items: projects_cache.map((project) => ({
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
        });
      }

      if (type === 'posts') {
        posts_cache = posts_cache.filter((item) => item.id !== id);
        await api_put('posts', {
          id: 'posts',
          items: posts_cache.map((post) => ({
            post_id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            cover_image_url: post.cover_image_url,
            is_published: post.is_published,
            sort_order: Number(post.sort_order || 1)
          }))
        });
      }

      if (type === 'resumes') {
        resumes_cache = resumes_cache.filter((item) => item.id !== id);
        await api_put('resumes', {
          id: 'resumes',
          items: resumes_cache.map((resume) => ({
            resume_id: resume.id,
            title: resume.title,
            file_name: resume.file_name,
            file_url: resume.file_url,
            is_current: resume.is_current
          }))
        });
      }

      set_message('Item deleted');
      await load_dashboard_data();
    } catch (error) {
      console.error(error);
      set_message('Failed to delete item');
    }
  }
});

login_btn.addEventListener('click', async () => {
  if (!DEV_MODE) {
    auth_status.textContent = 'Cognito login not connected yet';
    return;
  }

  set_logged_in_view();
  set_message('Signed in');
  await load_dashboard_data();
});

logout_btn.addEventListener('click', async () => {
  set_logged_out_view();
  set_message('Signed out');
});

set_logged_out_view();