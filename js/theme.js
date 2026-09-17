(function() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  function updateIcon() {
    const t = Store.getTheme();
    btn.textContent = t === 'dark' ? '☀️' : '🌙';
    btn.title = t === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  }

  btn.addEventListener('click', () => {
    const t = Store.getTheme();
    Store.setTheme(t === 'dark' ? 'light' : 'dark');
    updateIcon();
  });

  updateIcon();
})();