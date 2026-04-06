const API_BASE = "https://d57pcdl042.execute-api.us-east-2.amazonaws.com/prod";

const getEl = (id) => document.getElementById(id);

const setText = (id, value, fallback = "") => {
  const el = getEl(id);
  if (el) el.textContent = value || fallback;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeProjects = (items = []) =>
  items.map((item) => ({
    project_id: item.project_id || "",
    title: item.title || "Untitled Project",
    description: item.description || "",
    category: item.category || "Project",
    slug: item.slug || "",
    link: item.link || "",
    image_url: item.image_url || "",
    is_visible: item.is_visible !== false,
    is_featured: !!item.is_featured,
    sort_order: Number(item.sort_order || 9999),
  }));

const normalizePosts = (items = []) =>
  items.map((item) => ({
    post_id: item.post_id || "",
    title: item.title || "Untitled Post",
    excerpt: item.excerpt || "",
    content: item.content || "",
    slug: item.slug || "",
    cover_image_url: item.cover_image_url || "",
    is_published: item.is_published !== false,
    sort_order: Number(item.sort_order || 9999),
  }));

const normalizeResumes = (items = []) =>
  items.map((item) => ({
    resume_id: item.resume_id || "",
    title: item.title || "Current Resume",
    file_name: item.file_name || "",
    file_url: item.file_url || "",
    is_current: !!item.is_current,
  }));

const normalizeWork = (items = []) =>
  items.map((item) => ({
    work_id: item.work_id || "",
    title: item.title || "",
    subtitle: item.subtitle || "",
    organization: item.organization || "",
    description: item.description || "",
    link: item.link || "",
    start_date: item.start_date || "",
    end_date: item.end_date || "",
    is_current: !!item.is_current,
    is_visible: item.is_visible !== false,
  }));

const normalizeEntries = (items = [], id_key) =>
  items.map((item) => ({
    id: item[id_key] || "",
    title: item.title || "",
    subtitle: item.subtitle || "",
    organization: item.organization || "",
    date_range: item.date_range || "",
    description: item.description || "",
    link: item.link || "",
    image_url: item.image_url || "",
    sort_order: Number(item.sort_order || 9999),
  }));

const formatMonthLabel = (value = "") => {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year || !month) return value;

  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const formatWorkDateRange = (item) => {
  const start = formatMonthLabel(item.start_date);
  const end = item.is_current ? "Present" : formatMonthLabel(item.end_date);

  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
};

const compareWorkItems = (a, b) => {
  if (a.is_current && !b.is_current) return -1;
  if (!a.is_current && b.is_current) return 1;
  return String(b.start_date || "").localeCompare(String(a.start_date || ""));
};

const createProjectCard = (project) => {
  const href = project.link && project.link.trim() ? project.link.trim() : null;
  const tag = escapeHtml(project.category);
  const title = escapeHtml(project.title);
  const description = escapeHtml(project.description);

  const inner = `
    <article class='project_card'>
      <span class='project_tag'>${tag}</span>
      <h3>${title}</h3>
      <p>${description}</p>
    </article>
  `;

  if (href) {
    const isExternal = /^https?:\/\//i.test(href);
    const target = isExternal
      ? " target='_blank' rel='noopener noreferrer'"
      : "";
    return `<a href='${escapeHtml(href)}' class='project_card_link'${target}>${inner}</a>`;
  }

  return `<div class='project_card_link'>${inner}</div>`;
};

const createSeeMoreCard = () => `
  <a href='projects.html' class='project_card_link'>
    <article class='project_card'>
      <span class='project_tag'>Looking for More?</span>
      <h3>See More Projects</h3>
      <p>View the full collection of projects and case studies.</p>
    </article>
  </a>
`;

const createEntryCard = (entry) => {
  const hasImage = entry.image_url && entry.image_url.trim();
  const hasLink = entry.link && entry.link.trim();
  const isExternal = hasLink && /^https?:\/\//i.test(entry.link.trim());

  return `
    <div class='entry_card'>
      ${hasImage ? `<img src='${escapeHtml(entry.image_url)}' class='entry_image' alt='${escapeHtml(entry.title)}' />` : ""}

      <div class='entry_card_header'>
        <div class='entry_card_titles'>
          <h3 class='entry_title'>${escapeHtml(entry.title)}</h3>
          ${entry.subtitle ? `<p class='entry_subtitle'>${escapeHtml(entry.subtitle)}</p>` : ""}
          ${entry.organization ? `<p class='entry_org'>${escapeHtml(entry.organization)}</p>` : ""}
        </div>
        ${entry.date_range ? `<span class='entry_date'>${escapeHtml(entry.date_range)}</span>` : ""}
      </div>

      ${entry.description ? `<p class='entry_description'>${escapeHtml(entry.description)}</p>` : ""}

      ${hasLink ? `<a href='${escapeHtml(entry.link.trim())}' class='entry_link' ${isExternal ? "target='_blank' rel='noopener noreferrer'" : ""}>View →</a>` : ""}
    </div>
  `;
};

const createWorkCompanyCard = (organization, roles) => {
  const sortedRoles = [...roles].sort(compareWorkItems);
  const newestRole = sortedRoles[0];

  const overallStart =
    [...sortedRoles]
      .map((role) => role.start_date || "")
      .filter(Boolean)
      .sort()[0] || "";

  const hasCurrentRole = sortedRoles.some((role) => role.is_current);

  const overallEnd = hasCurrentRole
    ? "Present"
    : [...sortedRoles]
        .map((role) => role.end_date || "")
        .filter(Boolean)
        .sort()
        .slice(-1)[0] || "";

  const companyDateRange = (() => {
    const start = formatMonthLabel(overallStart);
    const end =
      overallEnd === "Present" ? "Present" : formatMonthLabel(overallEnd);

    if (start && end) return `${start} – ${end}`;
    if (start) return start;
    if (end) return end;
    return "";
  })();

  const roleItems = sortedRoles
    .map((role) => {
      const roleDateRange = formatWorkDateRange(role);
      const roleLink = role.link && role.link.trim();
      const roleLinkHtml = roleLink
        ? `<a href='${escapeHtml(roleLink.trim())}' class='entry_link' ${/^https?:\/\//i.test(roleLink.trim()) ? "target='_blank' rel='noopener noreferrer'" : ""}>View →</a>`
        : "";

      return `
      <div class='work_role_item'>
        <div class='work_role_header'>
          <div class='work_role_titles'>
            <h4 class='work_role_title'>${escapeHtml(role.title)}</h4>
            ${role.subtitle ? `<p class='work_role_subtitle'>${escapeHtml(role.subtitle)}</p>` : ""}
          </div>
          ${roleDateRange ? `<span class='work_role_date'>${escapeHtml(roleDateRange)}</span>` : ""}
        </div>
        ${role.description ? `<p class='work_role_description'>${escapeHtml(role.description)}</p>` : ""}
        ${roleLinkHtml}
      </div>
    `;
    })
    .join("");

  return `
    <div class='entry_card work_company_card'>
      <div class='entry_card_header'>
        <div class='entry_card_titles'>
          <h3 class='entry_title'>${escapeHtml(organization)}</h3>
          ${newestRole?.subtitle ? `<p class='entry_subtitle'>${escapeHtml(newestRole.subtitle)}</p>` : ""}
        </div>
        ${companyDateRange ? `<span class='entry_date'>${escapeHtml(companyDateRange)}</span>` : ""}
      </div>

      <div class='work_roles_list'>
        ${roleItems}
      </div>
    </div>
  `;
};

const renderProjects = (items = []) => {
  const grid = getEl("projects_grid");
  if (!grid) return;

  const visibleProjects = normalizeProjects(items)
    .filter((project) => project.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!visibleProjects.length) {
    grid.innerHTML = `<article class='project_card'><h3>No projects yet</h3><p>Add projects from the admin dashboard.</p></article>`;
    return;
  }

  const cards = visibleProjects.slice(0, 5).map(createProjectCard);
  cards.push(createSeeMoreCard());
  grid.innerHTML = cards.join("");
};

const renderPosts = (items = []) => {
  const grid = getEl("posts_grid");
  if (!grid) return;

  const published = normalizePosts(items)
    .filter((post) => post.is_published)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!published.length) {
    grid.innerHTML = `<article class='project_card'><h3>No posts yet</h3><p>Add posts from the admin dashboard.</p></article>`;
    return;
  }

  grid.innerHTML = published
    .slice(0, 4)
    .map(
      (post) => `
      <article class='project_card'>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
      </article>
    `,
    )
    .join("");
};

const renderResume = (items = []) => {
  const resumes = normalizeResumes(items);
  const current = resumes.find((resume) => resume.is_current) || resumes[0];

  const textEl = getEl("current_resume_text");
  const linkEl = getEl("current_resume_link");

  if (!textEl || !linkEl) return;

  if (!current) {
    textEl.textContent = "No resume available yet.";
    linkEl.style.display = "none";
    return;
  }

  textEl.textContent = current.title || "Current Resume";

  if (current.file_url) {
    linkEl.href = current.file_url;
    linkEl.style.display = "inline-block";
  } else {
    linkEl.style.display = "none";
  }
};

const renderWork = (items = []) => {
  const container = getEl("work_grid");
  if (!container) return;

  const visibleRoles = normalizeWork(items)
    .filter((role) => role.is_visible)
    .sort(compareWorkItems);

  if (!visibleRoles.length) {
    container.innerHTML = `<p class='entries_empty'>Work experience coming soon.</p>`;
    return;
  }

  const grouped = visibleRoles.reduce((acc, role) => {
    const key = role.organization || "Unknown Organization";
    if (!acc[key]) acc[key] = [];
    acc[key].push(role);
    return acc;
  }, {});

  const groupedEntries = Object.entries(grouped)
    .sort((a, b) => compareWorkItems(a[1][0], b[1][0]))
    .map(([organization, roles]) => createWorkCompanyCard(organization, roles));

  container.innerHTML = groupedEntries.join("");
};

const renderEntries = (containerId, items = [], id_key, emptyMessage) => {
  const container = getEl(containerId);
  if (!container) return;

  const entries = normalizeEntries(items, id_key).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  if (!entries.length) {
    container.innerHTML = `<p class='entries_empty'>${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = entries.map(createEntryCard).join("");
};

const apiGet = async (id) => {
  const response = await fetch(`${API_BASE}/content/${id}`);
  if (!response.ok) throw new Error(`Failed to load ${id}`);
  return response.json();
};

const safeGet = async (id) => {
  try {
    return await apiGet(id);
  } catch {
    return { items: [] };
  }
};

const finishLoading = () => {
  document.body.classList.remove("loading");
};

const loadContent = async () => {
  try {
    const [site, projects, posts, resumes, work, academia, awards] =
      await Promise.all([
        apiGet("site"),
        safeGet("projects"),
        safeGet("posts"),
        safeGet("resumes"),
        safeGet("work"),
        safeGet("academia"),
        safeGet("awards"),
      ]);

    setText("title", site.title, "");
    setText("subtitle", site.subtitle, "");
    setText("intro", site.intro, "");
    setText("about", site.about, "");

    const setLink = (id, value, isEmail = false) => {
      const el = getEl(id);
      if (!el) return;
      if (!value) {
        el.textContent = "—";
        return;
      }

      const href = isEmail ? `mailto:${value}` : value;
      const isExternal = !isEmail;
      el.innerHTML = `<a href="${escapeHtml(href)}" class="contact_link" ${isExternal ? "target='_blank' rel='noopener noreferrer'" : ""}>${escapeHtml(value)}</a>`;
    };

    setLink("email", site.email, true);
    setLink("linkedin", site.linkedin);
    setLink("github", site.github);
    setLink("instagram", site.instagram);

    renderProjects(projects.items || []);
    renderPosts(posts.items || []);
    renderResume(resumes.items || []);
    renderWork(work.items || []);
    renderEntries(
      "academia_grid",
      academia.items || [],
      "academia_id",
      "Academic background coming soon.",
    );
    renderEntries(
      "awards_grid",
      awards.items || [],
      "awards_id",
      "Awards and achievements coming soon.",
    );
  } catch (error) {
    console.error("Failed to load portfolio content:", error);
  } finally {
    finishLoading();
  }
};

loadContent();
