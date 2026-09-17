const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  set: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAdmin: () => Auth.getUser()?.role === 'admin',
  isLoggedIn: () => !!Auth.getToken(),
};

function updateNav() {
  const adminLink = document.getElementById('adminLink');
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');

  if (Auth.isLoggedIn()) {
    loginLink?.classList.add('hidden');
    logoutLink?.classList.remove('hidden');
    if (Auth.isAdmin()) adminLink?.classList.remove('hidden');
  } else {
    loginLink?.classList.remove('hidden');
    logoutLink?.classList.add('hidden');
    adminLink?.classList.add('hidden');
  }

  logoutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clear();
    location.href = '/';
  });
}

document.addEventListener('DOMContentLoaded', updateNav);

async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function jurisdictionBadge(j) {
  const map = {
    'Федеральная': ['fed', 'ФЕДЕРАЛЬНАЯ'],
    'Региональная': ['reg', 'РЕГИОНАЛЬНАЯ'],
    'Военная': ['mil', 'ВОЕННАЯ'],
    'Административная': ['adm', 'АДМИНИСТРАТИВНАЯ'],
    'Общая': ['general', 'ОБЩАЯ'],
  };
  const [cls, label] = map[j] || ['general', j];
  return `<span class="badge ${cls}">${label}</span>`;
}

function wantedBadge(n) {
  if (!n) return '';
  return `<span class="badge wanted">★ РОЗЫСК ${'★'.repeat(n - 1)}</span>`;
}