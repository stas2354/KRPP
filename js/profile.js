(async function() {
  const content = document.getElementById('profileContent');
  const user = await getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const profile = await getProfile();
  const favorites = await getFavorites();

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  const username = profile?.username || user.email.split('@')[0];
  const role = profile?.role || 'user';
  const roleLabel = { user: '👤 Пользователь', moderator: '🛡️ Модератор', admin: '👑 Админ' }[role] || role;
  const created = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—';

  content.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${esc(username[0].toUpperCase())}</div>
      <div class="profile-info">
        <h1>${esc(username)}</h1>
        <p class="subtitle" style="margin-bottom: 0.3rem;">${esc(user.email)}</p>
        <span class="profile-role">${roleLabel}</span>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat-card">
        <div class="stat-num">${favorites.length}</div>
        <div class="stat-label">⭐ Закладок</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${created}</div>
        <div class="stat-label">📅 С нами с</div>
      </div>
    </div>

    <div class="profile-actions">
      <a href="favorites.html" class="btn">⭐ Мои закладки</a>
      <button class="secondary" id="logoutBtn">🚪 Выйти</button>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('Выйти из аккаунта?')) {
      await signOut();
    }
  });
})();