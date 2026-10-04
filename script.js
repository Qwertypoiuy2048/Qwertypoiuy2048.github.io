const GITHUB_USERNAME = 'Qwertypoiuy2048';
const RECENT_LIMIT = 3;
// Add 3–6 repositories here to curate the Featured Projects section.
// Use your own repo name, "owner/repository", or a full GitHub URL.
// Example: ['my-project', 'group-name/shared-project']
// Leave empty to use the three most recently updated repositories for now.
const FEATURED_REPOSITORIES = ['Wild-Magic-Surges','Tasks-For-Canvas','edwardskyler4/Cookmarked'];
const projectGrid = document.querySelector('#project-grid');
const featuredGrid = document.querySelector('#featured-grid');
const recentGrid = document.querySelector('#recent-grid');
const projectCount = document.querySelector('#project-count');
const isAllProjectsPage = document.body.querySelector('.projects-section-all');
const PROJECT_CACHE_KEY = `github-projects-${GITHUB_USERNAME.toLowerCase()}`;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(dateString));
}

function repositoryPath(reference) {
  const value = reference.trim().replace(/^https?:\/\/github\.com\//, '').replace(/^\/+|\/+$/g, '');
  const parts = value.split('/');
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
}

function getCachedRepositories() {
  try {
    const cached = JSON.parse(localStorage.getItem(PROJECT_CACHE_KEY));
    return Array.isArray(cached) ? cached : null;
  } catch (error) {
    return null;
  }
}

function cacheRepositories(repositories) {
  try {
    localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(repositories));
  } catch (error) {
    // Caching is optional; private browsing can disable localStorage.
  }
}

async function getFeaturedRepositories(ownRepositories) {
  if (!FEATURED_REPOSITORIES.length) return ownRepositories.slice(0, 3);

  const selected = await Promise.all(FEATURED_REPOSITORIES.slice(0, 6).map(async (reference) => {
    const path = repositoryPath(reference);
    if (!path) return ownRepositories.find((repo) => repo.name === reference) || null;

    const ownMatch = ownRepositories.find((repo) => repo.full_name.toLowerCase() === path.toLowerCase());
    if (ownMatch) return ownMatch;

    try {
      const response = await fetch(`https://api.github.com/repos/${path}`);
      return response.ok ? await response.json() : null;
    } catch (error) {
      return null;
    }
  }));

  return selected.filter((repo, index, repositories) => repo && repositories.findIndex((item) => item?.full_name === repo.full_name) === index);
}

function legacyProjectCard(repo, index, detailed = false) {
  const topics = (repo.topics || []).slice(0, 3);
  return `
    <a class="project-card${detailed ? ' featured-card' : ''}" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
      <div class="card-top"><span class="project-number">${String(index + 1).padStart(2, '0')}</span><span class="project-link" aria-hidden="true">↗</span></div>
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${escapeHtml(repo.description || 'An open-source project by Qwertypoiuy2048.')}</p>
      ${detailed ? `<div class="featured-detail"><span>${repo.language ? escapeHtml(repo.language) : 'GitHub project'}</span><span>★ ${repo.stargazers_count}</span><span>⑂ ${repo.forks_count}</span></div>${topics.length ? `<div class="topic-list">${topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join('')}</div>` : ''}` : `<div class="card-meta">${repo.language ? `<span class="language-dot"></span>${escapeHtml(repo.language)}` : 'GitHub project'}<span>•</span>${formatDate(repo.updated_at)}</div>`}
    </a>`;
}

function renderProjects(repositories, isFeatured) {
  if (!repositories.length) {
    const target = isFeatured ? featuredGrid : projectGrid;
    target.innerHTML = '<div class="error-card">No public repositories yet — check back soon.</div>';
    if (projectCount) projectCount.textContent = '0 public repositories';
    return;
  }
  if (projectCount) projectCount.textContent = `${repositories.length} public ${repositories.length === 1 ? 'repository' : 'repositories'}`;
  const target = isFeatured ? featuredGrid : projectGrid;
  target.innerHTML = repositories.map((repo, index) => projectCard(repo, index, isFeatured)).join('');
}

function renderRecent(repositories) {
  if (recentGrid) recentGrid.innerHTML = repositories.length ? repositories.map((repo, index) => projectCard(repo, index)).join('') : '<div class="error-card">No recent projects to show.</div>';
}

function getProjectSite(repo) {
  if (!repo.has_pages) return null;

  if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) return repo.homepage;

  const [owner] = repo.full_name.split('/');
  return repo.name.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repo.name}/`;
}

async function addProjectSites(repositories) {
  return Promise.all(repositories.map(async (repo) => ({ ...repo, site_url: await getProjectSite(repo) })));
}

// Keep the repository card and hosted project as separate links.
function projectCard(repo, index, detailed = false) {
  const topics = (repo.topics || []).slice(0, 3);
  return `
    <article class="project-card${detailed ? ' featured-card' : ''}">
      <div class="card-top"><span class="project-number">${String(index + 1).padStart(2, '0')}</span><span class="project-link" aria-hidden="true">↗</span></div>
      <h3><a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)}</a></h3>
      <p>${escapeHtml(repo.description || 'An open-source project by Qwertypoiuy2048.')}</p>
      ${detailed ? `<div class="featured-detail"><span>${repo.language ? escapeHtml(repo.language) : 'GitHub project'}</span><span>★ ${repo.stargazers_count}</span><span>⑂ ${repo.forks_count}</span></div>${topics.length ? `<div class="topic-list">${topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join('')}</div>` : ''}` : `<div class="card-meta">${repo.language ? `<span class="language-dot"></span>${escapeHtml(repo.language)}` : 'GitHub project'}<span>•</span>${formatDate(repo.updated_at)}</div>`}
      <div class="card-actions"><a class="card-action" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>${repo.site_url ? `<a class="card-action card-action-site" href="${escapeHtml(repo.site_url)}" target="_blank" rel="noreferrer">View project page <span aria-hidden="true">↗</span></a>` : ''}</div>
    </article>`;
}

async function loadProjects() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`);
    if (!response.ok) {
      const cachedRepositories = getCachedRepositories();
      if (cachedRepositories?.length) {
        const repositories = cachedRepositories.filter((repo) => !repo.fork);
        if (isAllProjectsPage) {
          renderProjects(repositories, false);
        } else {
          const featured = await getFeaturedRepositories(repositories);
          renderProjects(featured, true);
          renderRecent(repositories.slice(0, RECENT_LIMIT));
        }
        if (projectCount) projectCount.textContent += ' (cached)';
        return;
      }
      throw new Error(response.status === 403 ? 'GitHub API rate limit reached' : 'GitHub request failed');
    }
    const repositories = (await response.json()).filter((repo) => !repo.fork);
    cacheRepositories(repositories);
    if (isAllProjectsPage) {
      renderProjects(repositories, false);
      addProjectSites(repositories).then((repositoriesWithSites) => renderProjects(repositoriesWithSites, false));
      return;
    }
    const featured = await getFeaturedRepositories(repositories);
    renderProjects(featured, true);
    renderRecent(repositories.slice(0, RECENT_LIMIT));
    addProjectSites(featured).then((featuredWithSites) => renderProjects(featuredWithSites, true));
  } catch (error) {
    const errorMessage = '<div class="error-card">Projects are taking a moment to load. <a href="https://github.com/Qwertypoiuy2048" target="_blank" rel="noreferrer">View them directly on GitHub ↗</a></div>';
    if (isAllProjectsPage) projectGrid.innerHTML = errorMessage;
    else { featuredGrid.innerHTML = errorMessage; recentGrid.innerHTML = errorMessage; }
    if (projectCount) projectCount.textContent = 'See GitHub profile';
  }
}

loadProjects();
