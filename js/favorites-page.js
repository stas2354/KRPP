(async function() {
  const favList = document.getElementById('favoritesList');
  const histList = document.getElementById('historyList');
  const clearFavBtn = document.getElementById('clearFavorites');
  const clearHistBtn = document.getElementById('clearHistory');
  const subtitle = document.getElementById('favSubtitle');
  if (!favList) return;

  const user = await getUser();

  if (!user) {
    if (subtitle) subtitle.innerHTML = 'Войдите в аккаунт, чтобы видеть закладки. <a href="login.html" style="color: var(--accent);">Войти →</a>';
    favList.innerHTML = '<p class="muted">Требуется вход в аккаунт.</p>';
    histList.innerHTML = '<p class="muted">Требуется вход в аккаунт.</p>';
    return;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function itemHTML(item, type) {
    const date = new Date(type === 'fav' ? item.added_at : item.viewed_at);
    const dateStr = date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
      <div class="fav-item">
        <a href="${item.page}" class="fav-item-link">
          <div class="fav-item-head">
            <span class="fav-item-source">${esc(item.source)}</span>
            <span class="fav-item-num">Статья ${esc(item.article)}</span>
          </div>
          <div class="fav-item-title">${esc(item.title)}</div>
          <div class="fav-item-date">${dateStr}</div>
        </a>
        ${type === 'fav' ? `<button class="fav-remove" data-key="${esc(item.article_key)}" title="Удалить">✕</button>` : ''}
      </div>
    `;
  }

  async function renderFavorites() {
    const favs = await getFavorites();
    if (!favs.length) {
      favList.innerHTML = '<p class="muted">Пока ничего не добавлено. Нажми ⭐ на статье чтобы сохранить её здесь.</p>';
      clearFavBtn.classList.add('hidden');
      return;
    }
    clearFavBtn.classList.remove('hidden');
    favList.innerHTML = favs.map(f => itemHTML(f, 'fav')).join('');
  }

  async function renderHistory() {
    const hist = await getHistory();
    if (!hist.length) {
      histList.innerHTML = '<p class="muted">История пуста.</p>';
      clearHistBtn.classList.add('hidden');
      return;
    }
    clearHistBtn.classList.remove('hidden');
    histList.innerHTML = hist.map(h => itemHTML(h, 'hist')).join('');
  }

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fav-remove');
    if (!btn) return;
    await removeFavorite(btn.dataset.key);
    renderFavorites();
  });

  clearFavBtn?.addEventListener('click', async () => {
    if (!confirm('Очистить всё избранное?')) return;
    const favs = await getFavorites();
    for (const f of favs) await removeFavorite(f.article_key);
    renderFavorites();
  });

  clearHistBtn?.addEventListener('click', async () => {
    if (!confirm('Очистить историю?')) return;
    await clearHistory();
    renderHistory();
  });

  await renderFavorites();
  await renderHistory();
})();