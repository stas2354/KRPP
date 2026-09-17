(async function() {
  // Ищем ссылку на профиль/логин
  const profileLink = document.querySelector('a[href="profile.html"]') || document.querySelector('a[href="login.html"]');
  if (!profileLink) return;

  // Ждём загрузки Supabase
  if (typeof getUser !== 'function') return;

  const user = await getUser();

  if (user) {
    profileLink.href = 'profile.html';
    try {
      const profile = await getProfile();
      const name = profile?.username || user.email.split('@')[0];
      profileLink.textContent = '👤 ' + name;
    } catch {
      profileLink.textContent = '👤 Профиль';
    }
  } else {
    profileLink.href = 'login.html';
    profileLink.textContent = '🔑 Войти';
  }
})();