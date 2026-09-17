(function() {
  const input = document.getElementById('globalSearch');
  const resultsEl = document.getElementById('searchResults');
  if (!input || !resultsEl) return;

  const allArticles = [];

  // УК
  if (typeof UK_ARTICLES !== 'undefined') {
    UK_ARTICLES.forEach(a => allArticles.push({
      ...a,
      source: 'УК',
      sourceFull: 'Уголовный кодекс',
      sourceEmoji: '📕',
      sourceColor: '#ff5b5b',
      page: 'uk.html'
    }));
  }

  // КоАП
  if (typeof KOAP_ARTICLES !== 'undefined') {
    KOAP_ARTICLES.forEach(a => allArticles.push({
      ...a,
      source: 'КоАП',
      sourceFull: 'Кодекс об административных правонарушениях',
      sourceEmoji: '📘',
      sourceColor: '#5dade2',
      page: 'koap.html'
    }));
  }

  // Закон об обороне
  if (typeof LAW_OBORONA !== 'undefined') {
    LAW_OBORONA.forEach(a => allArticles.push({
      ...a,
      source: 'Закон об обороне',
      sourceFull: 'Республиканский закон об обороне',
      sourceEmoji: '📜',
      sourceColor: '#c9a227',
      page: 'law-oborona.html'
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
        page: (f.id === 'army') ? 'army.html' : ('fraction.html?id=' + f.id)
      });
    });
  }

  // === Умный разбор запроса ===
  function parseQuery(q) {
    let text = ' ' + q.toLowerCase() + ' ';
    let source = null;

    // Определяем документ
    if (/к\s*о\s*а\s*п|коап|административ/i.test(text)) {
      source = 'КоАП';
      text = text.replace(/к\s*о\s*а\s*п\w*|коап\w*|административ\w*/gi, ' ');
    } else if (/закон\s*об\s*оборон|оборон/i.test(text)) {
      source = 'Закон об обороне';
      text = text.replace(/закон\s*об\s*оборон\w*|оборон\w*/gi, ' ');
    } else if (/(^|\s)ук(\s|$)|уголовн/i.test(text)) {
      source = 'УК';
      text = text.replace(/(^|\s)ук(\s|$)|уголовн\w*/gi, ' ');
    }

    // Убираем "статья", "статьи", "статью", "ст.", "ст"
    text = text.replace(/стать[яию]\s*/gi, ' ');
    text = text.replace(/(^|\s)ст\.?\s*/gi, ' ');

    // Убираем всё, кроме букв, цифр, точек и дефисов
    text = text.replace(/[^\wа-яё.\- ]/gi, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return { source, text };
  }

  // === Скоринг: статья ===
  function scoreLaw(article, q) {
    const artNum = (article.article || '').toLowerCase();
    const title = (article.title || '').toLowerCase();
    const content = (article.content || '').toLowerCase();
    const punish = (article.punishment || '').toLowerCase();
    let s = 0;

    if (artNum === q) s += 2000;
    else if (artNum.startsWith(q + '.')) s += 900;
    else if (artNum.startsWith(q)) s += 800;
    else if (artNum.includes(q)) s += 200;

    if (title.includes(q)) s += 300;
    if (content.includes(q)) s += 100;
    if (punish.includes(q)) s += 50;
    return s;
  }

  // === Скоринг: фракция ===
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

  window.goToArticle = function(page, source, articleNum) {
    sessionStorage.setItem('openArticle', articleNum);
    sessionStorage.setItem('openSource', source);
    window.location.href = page;
  };

  function render(originalQ) {
    if (!originalQ.trim()) {
      resultsEl.innerHTML = '';
      resultsEl.classList.remove('active');
      return;
    }

    const { source: preferredSource, text: query } = parseQuery(originalQ);

    if (!query) {
      resultsEl.innerHTML = '<div class="search-no">Введите номер или название статьи</div>';
      resultsEl.classList.add('active');
      return;
    }

    let lawResults = allArticles
      .map(a => ({ item: a, score: scoreLaw(a, query) }))
      .filter(x => x.score > 0);

    // Фильтр по документу
    if (preferredSource) {
      lawResults = lawResults.filter(x => x.item.source === preferredSource);
    }

    lawResults = lawResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const fracResults = allFractions
      .map(f => ({ item: f, score: scoreFraction(f, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const total = lawResults.length + fracResults.length;

    if (total === 0) {
      resultsEl.innerHTML = '<div class="search-no">Ничего не найдено 🤷</div>';
      resultsEl.classList.add('active');
      return;
    }

    let html = '';
    if (preferredSource) {
      html += `<div class="search-hint">Поиск в: <b>${preferredSource}</b></div>`;
    }

    if (lawResults.length) {
      html += '<div class="search-group-title">📖 Статьи законов</div>';
      html += lawResults.map(({ item }) => `
        <div class="search-item" onclick="goToArticle('${item.page}', '${item.source}', '${item.article}')" style="border-left: 3px solid ${item.sourceColor};">
          <div class="search-item-head">
            <span class="search-source" style="color:${item.sourceColor}">${item.sourceEmoji} <b>${item.source}</b></span>
            <span class="search-num">Статья ${highlight(item.article, query)}</span>
          </div>
          <div class="search-item-doc">${item.sourceFull}</div>
          <div class="search-item-chapter">${item.chapter ? esc(item.chapter) : ''}</div>
          <div class="search-item-title">${highlight(item.title, query)}</div>
          <div class="search-item-preview">${highlight((item.content || '').slice(0, 100), query)}...</div>
        </div>
      `).join('');
    }

    if (fracResults.length) {
      html += '<div class="search-group-title">🏛️ Фракции</div>';
      html += fracResults.map(({ item }) => `
        <a href="${item.page}" class="search-item search-item-link" style="border-left: 3px solid ${item.color};">
          <div class="search-item-head">
            <span class="search-source" style="color:${item.color}">${item.emoji} <b>${highlight(item.title, query)}</b></span>
            <span class="search-num">Фракция</span>
          </div>
          <div class="search-item-title">${highlight(item.fullName, query)}</div>
          <div class="search-item-preview">${highlight(item.description.slice(0, 100), query)}...</div>
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