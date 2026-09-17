// ============================================================
// Хранилище: избранное, история, тема
// ============================================================

const Store = {
  // ========== ИЗБРАННОЕ ==========
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch { return []; }
  },
  isFavorite(key) {
    return this.getFavorites().some(f => f.key === key);
  },
  toggleFavorite(item) {
    // item: { key, source, article, title, page }
    let favs = this.getFavorites();
    const idx = favs.findIndex(f => f.key === item.key);
    if (idx >= 0) {
      favs.splice(idx, 1);
      localStorage.setItem('favorites', JSON.stringify(favs));
      return false;
    } else {
      favs.unshift({ ...item, addedAt: Date.now() });
      localStorage.setItem('favorites', JSON.stringify(favs));
      return true;
    }
  },
  removeFavorite(key) {
    const favs = this.getFavorites().filter(f => f.key !== key);
    localStorage.setItem('favorites', JSON.stringify(favs));
  },

  // ========== ИСТОРИЯ ==========
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem('history') || '[]');
    } catch { return []; }
  },
  pushHistory(item) {
    // item: { key, source, article, title, page }
    let hist = this.getHistory().filter(h => h.key !== item.key);
    hist.unshift({ ...item, viewedAt: Date.now() });
    hist = hist.slice(0, 10);
    localStorage.setItem('history', JSON.stringify(hist));
  },
  clearHistory() {
    localStorage.removeItem('history');
  },

  // ========== ТЕМА ==========
  getTheme() {
    return localStorage.getItem('theme') || 'dark';
  },
  setTheme(t) {
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  },
  initTheme() {
    const t = this.getTheme();
    document.documentElement.setAttribute('data-theme', t);
  },
};

// Применяем тему сразу при загрузке
Store.initTheme();

// Ключ для статьи: "UK_6.5", "KOAP_10.2", "LAW_OBORONA_17.3"
function makeKey(source, article) {
  const srcMap = { 'УК': 'UK', 'КоАП': 'KOAP', 'Закон об обороне': 'LAW_OBORONA' };
  return (srcMap[source] || source) + '_' + article;
}