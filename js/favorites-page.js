// ============================================================
// Страница избранного и история
// ============================================================

(function() {
  const favList = document.getElementById('favoritesList');
  const histList = document.getElementById('historyList');
  const clearFavBtn = document.getElementById('clearFavorites');
  const clearHistBtn = document.getElementById('clearHistory');
  if (!favList) return;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function itemHTML(item, type) {
    const date = type === 'fav'
      ? new Date(item.addedAt)
      : new Date(item.viewedAt);
    const dateStr = date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
      <div class="fav-item">
        <a href="${item.page}#art-${item.article}" class="fav-item-link">
          <div class="fav-item-head">
            <span class="fav-item-source">${item.source}</span>
            <span class="fav-item-num">Статья ${esc(item.article)}</span>
          </div>
          <div class="fav-item-title">${esc(item.title)}</div>
          <div class="fav-item-date">${dateStr}</div>
        </a>
        <button class="fav-remove" data-key="${esc(item.key)}" data-type="${type}" title="Удалить">✕</button>
      </div>
    `;
  }

  function renderFavorites() {
    const favs = Store.getFavorites();
    if (!favs.length) {
      favList.innerHTML = '<p class="muted">Пока ничего не добавлено в избранное.<br>Нажми ⭐ на статье чтобы сохранить её здесь.</p>';
      clearFavBtn.classList.add('hidden');
      return;
    }
    clearFavBtn.classList.remove('hidden');
    favList.innerHTML = favs.map(f => itemHTML(f, 'fav')).join('');
  }

  function renderHistory() {
    if (!histList) return;
    const hist = Store.getHistory();
    if (!hist.length) {
      histList.innerHTML = '<p class="muted">История пуста. Просмотренные статьи будут появляться здесь.</p>';
      clearHistBtn?.classList.add('hidden');
      return;
    }
    clearHistBtn?.classList.remove('hidden');
    histList.innerHTML = hist.map(h => itemHTML(h, 'hist')).join('');
  }

  // Удаление
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.fav-remove');
    if (!btn) return;
    const key = btn.dataset.key;
    const type = btn.dataset.type;
    if (type === 'fav') {
      Store.removeFavorite(key);
      renderFavorites();
    }
  });

  clearFavBtn?.addEventListener('click', () => {
    if (confirm('Очистить всё избранное?')) {
      localStorage.removeItem('favorites');
      renderFavorites();
    }
  });

  clearHistBtn?.addEventListener('click', () => {
    if (confirm('Очистить историю?')) {
      Store.clearHistory();
      renderHistory();
    }
  });

  renderFavorites();
  renderHistory();
})();