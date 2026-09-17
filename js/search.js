// Умный поиск по всем документам
(function() {
  const input = document.getElementById('globalSearch');
  const resultsEl = document.getElementById('searchResults');
  if (!input || !resultsEl) return;

  // Объединяем все статьи
  const allArticles = [];
  
  if (typeof UK_ARTICLES !== 'undefined') {
    UK_ARTICLES.forEach(a => allArticles.push({ ...a, source: 'УК', sourceEmoji: '📕', page: 'uk.html' }));
  }
  if (typeof KOAP_ARTICLES !== 'undefined') {
    KOAP_ARTICLES.forEach(a => allArticles.push({ ...a, source: 'КоАП', sourceEmoji: '📘', page: 'koap.html' }));
  }

  // Скoring — насколько статья релевантна запросу
  function score(article, query) {
    const q = query.toLowerCase().trim();
    if (!q) return 0;

    const artNum = (article.article || '').toLowerCase();
    const title = (article.title || '').toLowerCase();
    const content = (article.content || '').toLowerCase();
    const punish = (article.punishment || '').toLowerCase();

    let s = 0;

    // Точное совпадение номера статьи — максимальный приоритет
    if (artNum === q) s += 1000;
    // Номер начинается с запроса
    else if (artNum.startsWith(q)) s += 500;
    // Номер содержит запрос
    else if (artNum.includes(q)) s += 200;

    // Совпадение в названии
    if (title.includes(q)) s += 300;

    // Совпадение в тексте
    if (content.includes(q)) s += 100;

    // Совпадение в наказании
    if (punish.includes(q)) s += 50;

    // Поиск по отдельным словам (для многословных запросов)
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const hay = artNum + ' ' + title + ' ' + content + ' ' + punish;
      const allFound = words.every(w => hay.includes(w));
      if (allFound) s += 150;
    }

    return s;
  }

  // Подсветка совпадений
  function highlight(text, query) {
    const q = query.trim();
    if (!q) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + safeQ + ')', 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  // Отрисовка результатов
  function renderResults(query) {
    if (!query.trim()) {
      resultsEl.innerHTML = '';
      resultsEl.classList.remove('active');
      return;
    }

    const scored = allArticles
      .map(a => ({ article: a, score: score(a, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (scored.length === 0) {
      resultsEl.innerHTML = '<div class="search-no">Ничего не найдено 🤷</div>';
      resultsEl.classList.add('active');
      return;
    }

    resultsEl.innerHTML = scored.map(({ article }) => {
      const preview = (article.content || '').slice(0, 120);
      return `
        <div class="search-item" onclick="goToArticle('${article.page}', '${article.source}', '${article.article}')">
          <div class="search-item-head">
            <span class="search-source">${article.sourceEmoji} ${article.source}</span>
            <span class="search-num">Статья ${highlight(article.article, query)}</span>
          </div>
          <div class="search-item-title">${highlight(article.title, query)}</div>
          <div class="search-item-preview">${highlight(preview, query)}...</div>
          ${article.punishment ? `<div class="search-item-punish">⚖️ ${highlight(article.punishment.slice(0, 80), query)}</div>` : ''}
        </div>
      `;
    }).join('');

    resultsEl.classList.add('active');
  }

  // Переход на нужную статью
  window.goToArticle = function(page, source, articleNum) {
    // Сохраняем в sessionStorage что нужно открыть
    sessionStorage.setItem('openArticle', articleNum);
    sessionStorage.setItem('openSource', source);
    window.location.href = page;
  };

  // События
  let timeout;
  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => renderResults(input.value), 150);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) resultsEl.classList.add('active');
  });

  // Клик вне — закрыть
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-box')) {
      resultsEl.classList.remove('active');
    }
  });

  // Escape — закрыть
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      resultsEl.classList.remove('active');
    }
  });
})();