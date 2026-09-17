(async function() {
  const profileLink = document.querySelector('a[href="profile.html"]') || document.querySelector('a[href="login.html"]');
  if (!profileLink) return;
  if (typeof getUser !== 'function') return;

  const user = await getUser();

  if (user) {
    profileLink.href = 'profile.html';
    try {
      const profile = await getProfile();
      const name = profile?.username || user.email.split('@')[0];
      profileLink.textContent = '👤 ' + name;

      if (profile?.role === 'admin' || profile?.role === 'moderator') {
        const menu = document.getElementById('navMenu');
        if (menu && !document.querySelector('a[href="admin.html"]')) {
          const li = document.createElement('li');
          li.innerHTML = '<a href="admin.html">🔐 Админка</a>';
          const lastItem = menu.lastElementChild;
          if (lastItem) {
            menu.insertBefore(li, lastItem);
          } else {
            menu.appendChild(li);
          }
        }
      }
    } catch (e) {
      console.error('nav-auth error:', e);
      profileLink.textContent = '👤 Профиль';
    }
  } else {
    profileLink.href = 'login.html';
    profileLink.textContent = '🔑 Войти';
  }
})();