(function() {
  const data = typeof UK_ARTICLES !== 'undefined' ? UK_ARTICLES : [];
  const articlesEl = document.getElementById('articles');
  const searchInput = document.getElementById('search');
  const jurisdictionSelect = document.getElementById('jurisdiction');
  const chapterSelect = document.getElementById('chapterSelect');
  const countEl = document.getElementById('count');

  let searchTimeout;

  function loadChapters() {
    const chapters = [...new Set(data.map(a => a.chapter))].filter(Boolean).sort();
    chapterSelect.innerHTML = '<option value="all">📖 Все главы</option>' +
      chapters.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  function getFiltered() {
    const search = searchInput.value.trim().toLowerCase();
    const jurisdiction = jurisdictionSelect.value;
    const chapter = chapterSelect.value;

    return data.filter(a => {
      if (chapter !== 'all' && a.chapter !== chapter) return false;
      if (jurisdiction !== 'all' && a.jurisdiction !== jurisdiction) return false;
      if (search) {
        const hay = (a.title + ' ' + a.content + ' ' + a.article).toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  function render() {
    const items = getFiltered();
    countEl.textContent = `Найдено статей: ${items.length}`;

    if (!items.length) {
      articlesEl.innerHTML = '<p class="muted">Ничего не найдено</p>';
      return;
    }

    articlesEl.innerHTML = items.map(p => {
      const idx = data.indexOf(p);
      return `<div class="article" data-idx="${idx}">
        <div class="article-head">
          <div class="article-num">Статья ${esc(p.article)}</div>
          <div class="article-title">${esc(p.title)}</div>
        </div>
        <div class="article-badges">
          ${jBadge(p.jurisdiction)}
          ${p.wanted ? wBadge(p.wanted) : ''}
          ${p.bail ? `<span class="badge general">ЗАЛОГ ${p.bail.toLocaleString('ru-RU')} ₽</span>` : ''}
        </div>
        <div class="article-preview">${esc(p.content)}</div>
      </div>`;
    }).join('');

    articlesEl.querySelectorAll('.article').forEach(el => {
      el.addEventListener('click', () => openArticle(Number(el.dataset.idx)));
    });
  }

  window.openArticle = function(idx) {
    const p = data[idx];
    if (!p) return;
    document.getElementById('modalContent').innerHTML = `
      <div class="article-num" style="font-size:1rem;">Статья ${esc(p.article)}</div>
      <h2>${esc(p.title)}</h2>
      <div class="article-badges" style="margin-bottom:1rem;">
        ${jBadge(p.jurisdiction)}${p.wanted ? wBadge(p.wanted) : ''}
      </div>
      <div class="chapter-tag">${esc(p.chapter)}</div>
      <div class="content">${esc(p.content)}</div>
      ${p.punishment ? `<div class="punish"><b>⚖️ Наказание:</b><br>${esc(p.punishment)}</div>` : ''}
      ${p.bail ? `<div class="punish"><b>💰 Залог:</b> ${p.bail.toLocaleString('ru-RU')} КРРП рублей</div>` : ''}
    `;

    if (typeof attachFavoriteButton === 'function') {
      attachFavoriteButton('УК', p.article, p.title, 'uk.html');
      pushToHistory('УК', p.article, p.title, 'uk.html');
    }

    document.getElementById('modal').classList.add('active');
  };

  function esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function jBadge(j) {
    const m = { 'Федеральная':['fed','ФЕДЕРАЛЬНАЯ'],'Региональная':['reg','РЕГИОНАЛЬНАЯ'],'Военная':['mil','ВОЕННАЯ'],'Административная':['adm','АДМИНИСТРАТИВНАЯ'],'Общая':['general','ОБЩАЯ'] };
    const [c, l] = m[j] || ['general', j || 'Общая'];
    return `<span class="badge ${c}">${l}</span>`;
  }
  function wBadge(n) { return `<span class="badge wanted">★ РОЗЫСК ${'★'.repeat(Math.max(0, n - 1))}</span>`; }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(render, 200);
  });
  jurisdictionSelect.addEventListener('change', render);
  chapterSelect.addEventListener('change', render);

  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') e.currentTarget.classList.remove('active');
  });

  loadChapters();
  render();
})();