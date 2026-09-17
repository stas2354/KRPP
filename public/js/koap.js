const CODE = document.body.dataset.code; // 'uk' или 'koap'
const articlesEl = document.getElementById('articles');
const searchInput = document.getElementById('search');
const jurisdictionSelect = document.getElementById('jurisdiction');
const chapterTabs = document.getElementById('chapterTabs');

let activeChapter = 'all';
let searchTimeout;

async function loadChapters() {
  try {
    const chapters = await api(`/api/posts/chapters/${CODE}`);
    chapterTabs.innerHTML =
      `<button class="active" data-chapter="all">Все главы</button>` +
      chapters.map(c => `<button data-chapter="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');

    chapterTabs.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        chapterTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeChapter = btn.dataset.chapter;
        loadArticles();
      });
    });
  } catch (e) { console.error(e); }
}

async function loadArticles() {
  const search = searchInput.value.trim();
  const jurisdiction = jurisdictionSelect.value;

  const params = new URLSearchParams({ code: CODE });
  if (search) params.append('search', search);
  if (jurisdiction !== 'all') params.append('jurisdiction', jurisdiction);
  if (activeChapter !== 'all') params.append('chapter', activeChapter);

  try {
    const items = await api('/api/posts?' + params);
    if (items.length === 0) {
      articlesEl.innerHTML = '<p class="muted">Ничего не найдено</p>';
      return;
    }
    articlesEl.innerHTML = items.map(p => `
      <div class="article" onclick="openArticle(${p.id})">
        <div class="article-head">
          <div class="article-num">Статья ${escapeHtml(p.article)}</div>
          <div class="article-title">${escapeHtml(p.title)}</div>
        </div>
        <div class="article-badges">
          ${jurisdictionBadge(p.jurisdiction)}
          ${wantedBadge(p.wanted)}
          ${p.bail ? `<span class="badge general">ЗАЛОГ ${p.bail.toLocaleString('ru-RU')} ₽</span>` : ''}
        </div>
        <div class="article-preview">${escapeHtml(p.content)}</div>
      </div>
    `).join('');
  } catch (e) {
    articlesEl.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

async function openArticle(id) {
  try {
    const p = await api('/api/posts/' + id);
    document.getElementById('modalContent').innerHTML = `
      <div class="article-num" style="font-size:1rem;">Статья ${escapeHtml(p.article)}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <div class="article-badges" style="margin-bottom:1rem;">
        ${jurisdictionBadge(p.jurisdiction)}
        ${wantedBadge(p.wanted)}
      </div>
      <div class="content">${escapeHtml(p.content)}</div>
      ${p.punishment ? `<div class="punish"><b>Наказание:</b><br>${escapeHtml(p.punishment)}</div>` : ''}
      ${p.bail ? `<div class="punish"><b>Залог:</b> ${p.bail.toLocaleString('ru-RU')} КРРП рублей</div>` : ''}
    `;
    document.getElementById('modal').classList.add('active');
  } catch (e) { alert(e.message); }
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') e.currentTarget.classList.remove('active');
});

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadArticles, 300);
});

jurisdictionSelect.addEventListener('change', loadArticles);

loadChapters();
loadArticles();