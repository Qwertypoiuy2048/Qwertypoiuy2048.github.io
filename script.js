const GITHUB_USERNAME = 'Qwertypoiuy2048';
const projectGrid = document.querySelector('#project-grid');
const projectCount = document.querySelector('#project-count');

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(dateString));
}

function renderProjects(repositories) {
  if (!repositories.length) {
    projectGrid.innerHTML = '<div class="error-card">No public repositories yet — check back soon.</div>';
    projectCount.textContent = '0 public repositories';
    return;
  }

  projectCount.textContent = `${repositories.length} public ${repositories.length === 1 ? 'repository' : 'repositories'}`;
  projectGrid.innerHTML = repositories.map((repo, index) => `
    <a class="project-card" href="${repo.html_url}" target="_blank" rel="noreferrer">
      <div class="card-top"><span class="project-number">0${String(index + 1).padStart(2, '0')}</span><span class="project-link" aria-hidden="true">↗</span></div>
      <h3>${repo.name}</h3>
      <p>${repo.description || 'An open-source project by Qwertypoiuy2048.'}</p>
      <div class="card-meta">${repo.language ? `<span class="language-dot"></span>${repo.language}` : 'GitHub project'}<span>•</span>${formatDate(repo.updated_at)}</div>
    </a>
  `).join('');
}

async function loadProjects() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`);
    if (!response.ok) throw new Error('GitHub request failed');
    const repositories = await response.json();
    renderProjects(repositories.filter((repo) => !repo.fork));
  } catch (error) {
    projectGrid.innerHTML = '<div class="error-card">Projects are taking a moment to load. <a href="https://github.com/Qwertypoiuy2048" target="_blank" rel="noreferrer">View them directly on GitHub ↗</a></div>';
    projectCount.textContent = 'See GitHub profile';
  }
}

loadProjects();
