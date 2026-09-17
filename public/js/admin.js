if (!Auth.isAdmin()) location.href = '/login.html';

// Табы
const tabPosts = document.getElementById('tabPosts');
const tabUsers = document.getElementById('tabUsers');
const postsSection = document.getElementById('postsSection');
const usersSection = document.getElementById('usersSection');

tabPosts.addEventListener('click', () => {
  tabPosts.classList.add('active'); tabUsers.classList.remove('active');
  postsSection.classList.remove('hidden'); usersSection.classList.add('hidden');
});
tabUsers.addEventListener('click', () => {
  tabUsers.classList.add('active'); tabPosts.classList.remove('active');
  usersSection.classList.remove('hidden'); postsSection.classList.add('hidden');
  loadUsers();
});

// === Статьи ===
let editingId = null;
const postsList = document.getElementById('postsList');
const editorForm = document.getElementById('editorForm');
const editorTitle = document.getElementById('editorTitle');

async function loadPosts() {
  const search = document.getElementById('postsSearch').value.trim();
  const code = document.getElementById('postsCode').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (code !== 'all') params.append('code', code);

  try {
    const items = await api('/api/posts?' + params);
    postsList.innerHTML = items.map(p => `
      <div class="list-item">
        <span><b>${p.code === 'uk' ? 'УК' : 'КоАП'} ${escapeHtml(p.article)}</b> — ${escapeHtml(p.title.slice(0, 40))}</span>
        <div class="actions">
          <button class="secondary" onclick="editArticle(${p.id})">✏️</button>
          <button class="danger" onclick="deleteArticle(${p.id})">🗑</button>
        </div>
      </div>
    `).join('') || '<p class="muted">Нет статей</p>';
  } catch (e) { postsList.innerHTML = `<p class="error">${e.message}</p>`; }
}

function clearForm() {
  ['fChapter','fArticle','fTitle','fContent','fPunishment','fBail'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fCode').value = 'uk';
  document.getElementById('fJurisdiction').value = 'Общая';
  document.getElementById('fWanted').value = 0;
  document.getElementById('fPublished').value = '1';
}

function newArticle() {
  editingId = null;
  clearForm();
  editorTitle.textContent = 'Новая статья';
  editorForm.classList.remove('hidden');
}

async function editArticle(id) {
  try {
    const p = await api('/api/posts/' + id);
    editingId = id;
    document.getElementById('fCode').value = p.code;
    document.getElementById('fChapter').value = p.chapter || '';
    document.getElementById('fArticle').value = p.article;
    document.getElementById('fTitle').value = p.title;
    document.getElementById('fContent').value = p.content || '';
    document.getElementById('fPunishment').value = p.punishment || '';
    document.getElementById('fJurisdiction').value = p.jurisdiction || 'Общая';
    document.getElementById('fWanted').value = p.wanted || 0;
    document.getElementById('fBail').value = p.bail || '';
    document.getElementById('fPublished').value = p.published ? '1' : '0';
    editorTitle.textContent = 'Редактирование: ' + p.title;
    editorForm.classList.remove('hidden');
  } catch (e) { alert(e.message); }
}

function closeEditor() {
  editingId = null;
  editorForm.classList.add('hidden');
  editorTitle.textContent = 'Выбери статью';
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const msg = document.getElementById('editorMsg');
  msg.classList.add('hidden');

  const body = {
    code: document.getElementById('fCode').value,
    chapter: document.getElementById('fChapter').value.trim(),
    article: document.getElementById('fArticle').value.trim(),
    title: document.getElementById('fTitle').value.trim(),
    content: document.getElementById('fContent').value.trim(),
    punishment: document.getElementById('fPunishment').value.trim(),
    jurisdiction: document.getElementById('fJurisdiction').value,
    wanted: Number(document.getElementById('fWanted').value) || 0,
    bail: Number(document.getElementById('fBail').value) || null,
    published: document.getElementById('fPublished').value === '1',
  };

  if (!body.article || !body.title) {
    msg.textContent = 'Заполни номер и название статьи';
    msg.className = 'error';
    msg.classList.remove('hidden');
    return;
  }

  try {
    if (editingId) {
      await api('/api/posts/' + editingId, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await api('/api/posts', { method: 'POST', body: JSON.stringify(body) });
    }
    msg.textContent = '✅ Сохранено';
    msg.className = 'success';
    msg.classList.remove('hidden');
    loadPosts();
    setTimeout(closeEditor, 800);
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'error';
    msg.classList.remove('hidden');
  }
});

async function deleteArticle(id) {
  if (!confirm('Удалить статью?')) return;
  try {
    await api('/api/posts/' + id, { method: 'DELETE' });
    loadPosts();
  } catch (e) { alert(e.message); }
}

document.getElementById('postsSearch').addEventListener('input', () => {
  clearTimeout(window._t);
  window._t = setTimeout(loadPosts, 300);
});
document.getElementById('postsCode').addEventListener('change', loadPosts);

// === Юзеры ===
async function loadUsers() {
  const list = document.getElementById('usersList');
  try {
    const users = await api('/api/users');
    list.innerHTML = users.map(u => `
      <div class="list-item">
        <span><b>${escapeHtml(u.username)}</b> — ${u.role}</span>
        <button class="danger" onclick="deleteUser(${u.id})">🗑</button>
      </div>
    `).join('');
  } catch (e) { list.innerHTML = `<p class="error">${e.message}</p>`; }
}

document.getElementById('createUserBtn').addEventListener('click', async () => {
  const msg = document.getElementById('userMsg');
  msg.classList.add('hidden');
  try {
    await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('uUsername').value.trim(),
        password: document.getElementById('uPassword').value,
        role: document.getElementById('uRole').value,
      }),
    });
    msg.textContent = '✅ Пользователь создан';
    msg.className = 'success';
    msg.classList.remove('hidden');
    document.getElementById('uUsername').value = '';
    document.getElementById('uPassword').value = '';
    loadUsers();
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'error';
    msg.classList.remove('hidden');
  }
});

async function deleteUser(id) {
  if (!confirm('Удалить пользователя?')) return;
  try { await api('/api/users/' + id, { method: 'DELETE' }); loadUsers(); }
  catch (e) { alert(e.message); }
}

loadPosts();