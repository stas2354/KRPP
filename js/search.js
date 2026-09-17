(function() {
  const input = document.getElementById('globalSearch');
  const resultsEl = document.getElementById('searchResults');
  if (!input || !resultsEl) return;

  const allArticles = [];

  // УК
  if (typeof UK_ARTICLES !== 'undefined') {
    UK_ARTICLES.forEach(a => allArticles.push({
      ...a, source: 'УК', sourceEmoji: '📕', page: 'uk.html', type: 'law'
    }));
  }

  // КоАП
  if (typeof KOAP_ARTICLES !== 'undefined') {
    KOAP_ARTICLES.forEach(a => allArticles.push({
      ...a, source: 'КоАП', sourceEmoji: '📘', page: 'koap.html', type: 'law'
    }));
  }

  // Фракции
  const allFractions = [];
  if (typeof FRACTIONS !== 'undefined') {
    FRACTIONS.forEach(f => {
      allFractions.push({
        id: f.id,
        title: f.name,
        fullName: f.fullName,
        description: f.description,
        duties: f.duties,
        rights: f.rights,
        ranks: f.ranks,
        emoji: f.emoji,
        color: f.color,
        page: (f.id === 'army') ? 'army.html' : ('fraction.html?id=' + f.id),
        type: 'fraction'
      });
    });
  }

  // Законы фракций (встроенные)
  const allLaws = [];
  if (typeof FRACTIONS !== 'undefined') {
    FRACTIONS.forEach(f => {
      if (f.law) {
        f.law.articles.forEach(a => {
          allLaws.push({
            fractionName: f.name,
            fractionEmoji: f.emoji,
            fractionColor: f.color,
            num: a.num,
            title: a.title,
            content: a.content,
            page: (f.id === 'army') ? 'army.html' : ('fraction.html?id=' + f.id),
            type: 'fraction-law'
          });
        });
      }
    });
  }

  // ===== Поиск по УК/КоАП =====
  function scoreLaw(article, q) {
    const artNum = (article.article || '').toLowerCase();
    const title = (article.title || '').toLowerCase();
    const content = (article.content || '').toLowerCase();
    const punish = (article.punishment || '').toLowerCase();
    let s = 0;
    if (artNum === q) s += 1000;
    else if (artNum.startsWith(q)) s += 500;
    else if (artNum.includes(q)) s += 200;
    if (title.includes(q)) s += 300;
    if (content.includes(q)) s += 100;
    if (punish.includes(q)) s += 50;
    return s;
  }

  // ===== Поиск по фракциям =====
  function scoreFraction(fr, q) {
    const hay = (
      fr.title + ' ' + fr.fullName + ' ' + fr.description + ' ' +
      fr.duties.join(' ') + ' ' + fr.rights.join(' ') + ' ' + fr.ranks.join(' ')
    ).toLowerCase();
    if (!hay.includes(q)) return 0;
    let s = 0;
    if (fr.title.toLowerCase().includes(q)) s += 400;
    if (fr.fullName.toLowerCase().includes(q)) s += 300;
    if (fr.description.toLowerCase().includes(q)) s += 100;
    if (fr.duties.join(' ').toLowerCase().includes(q)) s += 80;
    if (fr.rights.join(' ').toLowerCase().includes(q)) s += 80;
    if (fr.ranks.join(' ').toLowerCase().includes(q)) s += 60;
    return s;
  }

  // ===== Поиск по статьям законов фракций =====
  function scoreFractionLaw(law, q) {
    const num = (law.num || '').toLowerCase();
    const title = (law.title || '').toLowerCase();
    const content = (law.content || '').toLowerCase();
    let s = 0;
    if (num.toLowerCase().includes(q)) s += 400;
    if (title.includes(q)) s += 250;
    if (content.includes(q)) s += 80;
    return s;
  }

  // ===== Подсветка =====
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function highlight(text, q) {
    const escaped = esc(text);
    if (!q) return escaped;
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return escaped.replace(new RegExp('(' + safeQ + ')', 'gi'), '<mark>$1</mark>');
    } catch { return escaped; }
  }

  // ===== Переход =====
  window.goToArticle = function(page, source, articleNum) {
    sessionStorage.setItem('openArticle', articleNum);
    sessionStorage.setItem('openSource', source);
    window.location.href = page;
  };

  // ===== Отрисовка =====
  function render(q) {
    if (!q.trim()) {
      resultsEl.innerHTML = '';
      resultsEl.classList.remove('active');
      return;
    }
    const query = q.toLowerCase().trim();

    const lawResults = allArticles
      .map(a => ({ item: a, score: scoreLaw(a, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const fracResults = allFractions
      .map(f => ({ item: f, score: scoreFraction(f, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const lawOfFracResults = allLaws
      .map(l => ({ item: l, score: scoreFractionLaw(l, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const total = lawResults.length + fracResults.length + lawOfFracResults.length;

    if (total === 0) {
      resultsEl.innerHTML = '<div class="search-no">Ничего не найдено 🤷</div>';
      resultsEl.classList.add('active');
      return;
    }

    let html = '';

    // --- Статьи законов ---
    if (lawResults.length) {
      html += '<div class="search-group-title">📖 Статьи кодексов</div>';
      html += lawResults.map(({ item }) => `
        <div class="search-item" onclick="goToArticle('${item.page}', '${item.source}', '${item.article}')">
          <div class="search-item-head">
            <span class="search-source">${item.sourceEmoji} ${item.source}</span>
            <span class="search-num">Статья ${highlight(item.article, q)}</span>
          </div>
          <div class="search-item-title">${highlight(item.title, q)}</div>
          <div class="search-item-preview">${highlight((item.content || '').slice(0, 120), q)}...</div>
          ${item.punishment ? `<div class="search-item-punish">⚖️ ${highlight(item.punishment.slice(0, 80), q)}</div>` : ''}
        </div>
      `).join('');
    }

    // --- Фракции ---
    if (fracResults.length) {
      html += '<div class="search-group-title">🏛️ Фракции</div>';
      html += fracResults.map(({ item }) => `
        <a href="${item.page}" class="search-item search-item-link">
          <div class="search-item-head">
            <span class="search-source" style="color:${item.color}">${item.emoji} ${highlight(item.title, q)}</span>
            <span class="search-num">Фракция</span>
          </div>
          <div class="search-item-title">${highlight(item.fullName, q)}</div>
          <div class="search-item-preview">${highlight(item.description.slice(0, 120), q)}...</div>
        </a>
      `).join('');
    }

    // --- Законы фракций ---
    if (lawOfFracResults.length) {
      html += '<div class="search-group-title">📜 Законы фракций</div>';
      html += lawOfFracResults.map(({ item }) => `
        <a href="${item.page}" class="search-item search-item-link">
          <div class="search-item-head">
            <span class="search-source" style="color:${item.fractionColor}">${item.fractionEmoji} ${item.fractionName}</span>
            <span class="search-num">${highlight(item.num, q)}</span>
          </div>
          <div class="search-item-title">${highlight(item.title, q)}</div>
          <div class="search-item-preview">${highlight(item.content.slice(0, 120), q)}...</div>
        </a>
      `).join('');
    }

    resultsEl.innerHTML = html;
    resultsEl.classList.add('active');
  }

  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => render(input.value), 150);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) resultsEl.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-box')) {
      resultsEl.classList.remove('active');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      resultsEl.classList.remove('active');
    }
  });
})();