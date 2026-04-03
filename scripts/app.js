const API_BASE = 'https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod';

const getEl = (id) => document.getElementById(id);

const setText = (id, value, fallback = '') => {
  const el = getEl(id);
  if (el) el.textContent = value || fallback;
};

const renderProjects = (items = []) => {
  const grid = getEl('projects_grid');
  if (!grid) return;

  const visibleProjects = items
    .filter((project) => project.is_visible !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (!visibleProjects.length) {
    grid.innerHTML = `
      <article class="project_card">
        <h3>No projects yet</h3>
        <p>Add projects from the admin dashboard.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = visibleProjects
    .map(
      (project) => `
        <article class="project_card">
          ${project.category ? `<span class="project_tag">${project.category}</span>` : ''}
          <h3>${project.title || 'Untitled Project'}</h3>
          <p>${project.description || ''}</p>
          ${
            project.link
              ? `<a class="project_link" href="${project.link}" target="_blank" rel="noopener noreferrer">View Project</a>`
              : ''
          }
        </article>
      `
    )
    .join('');
};

const renderPosts = (items = []) => {
  const grid = getEl('posts_grid');
  if (!grid) return;

  const publishedPosts = items
    .filter((post) => post.is_published !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (!publishedPosts.length) {
    grid.innerHTML = `
      <article class="project_card">
        <h3>No posts yet</h3>
        <p>Add posts from the admin dashboard.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = publishedPosts
    .map(
      (post) => `
        <article class="project_card">
          <h3>${post.title || 'Untitled Post'}</h3>
          <p>${post.excerpt || ''}</p>
        </article>
      `
    )
    .join('');
};

const renderResume = (items = []) => {
  const currentResume = items.find((resume) => resume.is_current);

  const textEl = getEl('current_resume_text');
  const linkEl = getEl('current_resume_link');

  if (!textEl || !linkEl) return;

  if (!currentResume) {
    textEl.textContent = 'No resume available yet.';
    linkEl.style.display = 'none';
    return;
  }

  textEl.textContent = currentResume.title || 'Current Resume';

  if (currentResume.file_url) {
    linkEl.href = currentResume.file_url;
    linkEl.style.display = 'inline-block';
  } else {
    linkEl.style.display = 'none';
  }
};

const loadContent = async () => {
  try {
    const [siteRes, projectsRes, postsRes, resumesRes] = await Promise.all([
      fetch(`${API_BASE}/content/site`),
      fetch(`${API_BASE}/content/projects`),
      fetch(`${API_BASE}/content/posts`),
      fetch(`${API_BASE}/content/resumes`)
    ]);

    const [site, projects, posts, resumes] = await Promise.all([
      siteRes.json(),
      projectsRes.json(),
      postsRes.json(),
      resumesRes.json()
    ]);

    setText('title', site.title, 'Hi, I’m Nicky');
    setText('subtitle', site.subtitle, 'Student • Developer • Builder');
    setText('intro', site.intro, '');
    setText('about', site.about, '');
    setText('academia', site.academia, '');
    setText('work', site.work, '');
    setText('awards', site.awards, '');
    setText('email', site.email, '');
    setText('linkedin', site.linkedin, '');
    setText('github', site.github, '');
    setText('instagram', site.instagram, '');

    renderProjects(projects.items || []);
    renderPosts(posts.items || []);
    renderResume(resumes.items || []);
  } catch (error) {
    console.error('Failed to load portfolio content:', error);
  }
};

loadContent();