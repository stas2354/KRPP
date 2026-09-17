// ============================================================
// АДМИН-ПАНЕЛЬ
// ============================================================

(async function() {
  const content = document.getElementById('adminContent');
  const subtitle = document.getElementById('adminSubtitle');
  const tabs = document.querySelectorAll('.admin-tab');
  if (!content) return;

  let currentUser = null;
  let currentProfile = null;
  let currentTab = 'dashboard';

  // === Проверка доступа ===
  currentUser = await getUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  currentProfile = await getProfile();
  const role = currentProfile?.role;
  if (role !== 'admin' && role !== 'moderator') {
    subtitle.textContent = 'Доступ только для админов и модераторов';
    content.innerHTML = `
      <div class="admin-denied">
        <h2>🚫 Доступ запрещён</h2>
        <p>У вас нет прав для этой страницы.</p>
        <a href="index.html" class="btn">На главную</a>
      </div>
    `;
    return;
  }

  subtitle.textContent = `Вы вошли как ${currentProfile?.username || currentUser.email} (${role})`;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  // ============ ДАШБОРД ============
  async function renderDashboard() {
    const sb = await initSupabase();
    if (!sb) return;

    const [usersRes, commentsRes, editsRes, citizensRes] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('comments').select('*', { count: 'exact', head: true }),
      sb.from('article_edits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('citizens').select('*', { count: 'exact', head: true }),
    ]);

    const stats = {
      users: usersRes.count || 0,
      comments: commentsRes.count || 0,
      pendingEdits: editsRes.count || 0,
      citizens: citizensRes.count || 0,
    };

    content.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-num">${stats.users}</div>
          <div class="stat-label">👥 Пользователей</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${stats.comments}</div>
          <div class="stat-label">💬 Комментариев</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${stats.pendingEdits}</div>
          <div class="stat-label">✏️ Правок в очереди</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${stats.citizens}</div>
          <div class="stat-label">🏴 Граждан</div>
        </div>
      </div>

      <div class="admin-info">
        <h3>ℹ️ Информация</h3>
        <p>📕 УК: <b>${typeof UK_ARTICLES !== 'undefined' ? UK_ARTICLES.length : 0}</b> статей</p>
        <p>📘 КоАП: <b>${typeof KOAP_ARTICLES !== 'undefined' ? KOAP_ARTICLES.length : 0}</b> статей</p>
        <p>📜 Закон об обороне: <b>${typeof LAW_OBORONA !== 'undefined' ? LAW_OBORONA.length : 0}</b> статей</p>
      </div>
    `;
  }

  // ============ СТАТЬИ ============
  let articleSearch = '';
  let articleSource = 'uk';

  async function renderArticles() {
    const data = articleSource === 'uk' ? UK_ARTICLES :
                 articleSource === 'koap' ? KOAP_ARTICLES :
                 LAW_OBORONA;

    const filtered = data.filter(a => {
      if (!articleSearch) return true;
      const hay = (a.title + ' ' + a.article).toLowerCase();
      return hay.includes(articleSearch.toLowerCase());
    });

    content.innerHTML = `
      <div class="admin-toolbar">
        <input type="text" id="articleSearchInput" placeholder="🔍 Поиск по номеру или названию..." value="${esc(articleSearch)}">
        <select id="articleSourceSelect">
          <option value="uk" ${articleSource === 'uk' ? 'selected' : ''}>📕 УК</option>
          <option value="koap" ${articleSource === 'koap' ? 'selected' : ''}>📘 КоАП</option>
          <option value="law" ${articleSource === 'law' ? 'selected' : ''}>📜 Закон об обороне</option>
        </select>
        <button id="newArticleBtn">+ Новая статья</button>
      </div>

      <p class="muted" style="margin-bottom: 1rem;">Найдено: <b>${filtered.length}</b> статей</p>

      <div class="admin-articles-list">
        ${filtered.map(a => `
          <div class="admin-article-item">
            <div class="admin-article-info">
              <div class="admin-article-num">Статья ${esc(a.article)}</div>
              <div class="admin-article-title">${esc(a.title)}</div>
            </div>
            <div class="admin-article-actions">
              <button class="secondary edit-btn" data-article="${esc(a.article)}">✏️ Редактировать</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('articleSearchInput').addEventListener('input', (e) => {
      articleSearch = e.target.value;
      renderArticles();
    });

    document.getElementById('articleSourceSelect').addEventListener('change', (e) => {
      articleSource = e.target.value;
      articleSearch = '';
      renderArticles();
    });

    document.getElementById('newArticleBtn').addEventListener('click', () => {
      openArticleEditor(null);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const articleNum = btn.dataset.article;
        const art = data.find(a => a.article === articleNum);
        if (art) openArticleEditor(art);
      });
    });
  }

  // ============ РЕДАКТОР СТАТЬИ ============
  function openArticleEditor(article) {
    const isNew = !article;
    const sourceLabels = { uk: 'УК', koap: 'КоАП', law: 'Закон об обороне' };
    const sourceName = sourceLabels[articleSource];

    document.getElementById('modalContent').innerHTML = `
      <h2>${isNew ? '+ Новая статья' : '✏️ Редактирование'}</h2>
      <p class="muted">${sourceName}</p>

      <div id="editError" class="error hidden"></div>
      <div id="editSuccess" class="success hidden"></div>

      <label>Номер статьи *</label>
      <input type="text" id="editArticle" value="${esc(article?.article || '')}" ${isNew ? '' : 'readonly'}>

      <label>Глава</label>
      <input type="text" id="editChapter" value="${esc(article?.chapter || '')}">

      <label>Название *</label>
      <input type="text" id="editTitle" value="${esc(article?.title || '')}">

      <label>Содержание</label>
      <textarea id="editContent" rows="6">${esc(article?.content || '')}</textarea>

      ${articleSource !== 'law' ? `
        <label>Наказание</label>
        <textarea id="editPunishment" rows="3">${esc(article?.punishment || '')}</textarea>

        <label>Юрисдикция</label>
        <select id="editJurisdiction">
          <option value="Общая" ${article?.jurisdiction === 'Общая' ? 'selected' : ''}>Общая</option>
          <option value="Федеральная" ${article?.jurisdiction === 'Федеральная' ? 'selected' : ''}>Федеральная</option>
          <option value="Региональная" ${article?.jurisdiction === 'Региональная' ? 'selected' : ''}>Региональная</option>
          <option value="Военная" ${article?.jurisdiction === 'Военная' ? 'selected' : ''}>Военная</option>
          <option value="Административная" ${article?.jurisdiction === 'Административная' ? 'selected' : ''}>Административная</option>
        </select>

        <label>Розыск (0-5)</label>
        <input type="number" id="editWanted" min="0" max="5" value="${article?.wanted || 0}">

        <label>Залог (КРРП ₽)</label>
        <input type="number" id="editBail" value="${article?.bail || ''}">
      ` : ''}

      <div class="edit-actions">
        <button id="saveEditBtn">💾 Сохранить правку</button>
        <button class="secondary" onclick="document.getElementById('modal').classList.remove('active')">Отмена</button>
      </div>

      <p class="muted" style="font-size: 0.8rem; margin-top: 1rem;">
        ⚠️ Правка попадёт в очередь модерации. Админ подтвердит её.
      </p>
    `;

    document.getElementById('modal').classList.add('active');
    document.getElementById('saveEditBtn').addEventListener('click', () => saveEdit(article));
  }

  async function saveEdit(article) {
    const sb = await initSupabase();
    if (!sb) return;

    const articleNum = document.getElementById('editArticle').value.trim();
    const title = document.getElementById('editTitle').value.trim();
    const chapter = document.getElementById('editChapter').value.trim();
    const content = document.getElementById('editContent').value.trim();

    const errEl = document.getElementById('editError');
    const okEl = document.getElementById('editSuccess');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    if (!articleNum || !title) {
      errEl.textContent = 'Заполните номер и название';
      errEl.classList.remove('hidden');
      return;
    }

    const sourceLabels = { uk: 'УК', koap: 'КоАП', law: 'Закон об обороне' };
    const sourceName = sourceLabels[articleSource];
    const articleKey = sourceName + '_' + articleNum;

    const payload = {
      user_id: currentUser.id,
      article_key: articleKey,
      source: sourceName,
      article: articleNum,
      chapter,
      title,
      content,
      action: article ? 'update' : 'create',
      status: currentProfile?.role === 'admin' ? 'approved' : 'pending',
    };

    if (articleSource !== 'law') {
      payload.punishment = document.getElementById('editPunishment')?.value.trim() || '';
      payload.jurisdiction = document.getElementById('editJurisdiction')?.value || 'Общая';
      payload.wanted = Number(document.getElementById('editWanted')?.value) || 0;
      const bailVal = document.getElementById('editBail')?.value;
      payload.bail = bailVal ? Number(bailVal) : null;
    }

    const { error } = await sb.from('article_edits').insert(payload);

    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      return;
    }

    okEl.textContent = currentProfile?.role === 'admin'
      ? '✅ Правка применена'
      : '✅ Отправлено на модерацию';
    okEl.classList.remove('hidden');

    // Логируем в history
    await sb.from('article_history').insert({
      user_id: currentUser.id,
      article_key: articleKey,
      source: sourceName,
      article: articleNum,
      action: article ? 'update' : 'create',
      old_title: article?.title || null,
      new_title: title,
      old_content: article?.content || null,
      new_content: content,
    });

    setTimeout(() => {
      document.getElementById('modal').classList.remove('active');
      renderArticles();
    }, 1200);
  }

  // ============ ПРАВКИ (МОДЕРАЦИЯ) ============
  async function renderEdits() {
    const sb = await initSupabase();
    if (!sb) return;

    const { data: edits } = await sb
      .from('article_edits')
      .select('*')
      .order('created_at', { ascending: false });

    content.innerHTML = `
      <h3>✏️ Очередь правок</h3>
      <p class="muted" style="margin-bottom: 1rem;">Всего: <b>${edits?.length || 0}</b></p>
      <div class="admin-edits-list">
        ${!edits?.length ? '<p class="muted">Правок нет</p>' : edits.map(e => `
          <div class="admin-edit-item status-${e.status}">
            <div class="admin-edit-header">
              <span class="admin-edit-source">${esc(e.source)}</span>
              <span class="admin-edit-article">Статья ${esc(e.article)}</span>
              <span class="admin-edit-status">${e.status === 'pending' ? '⏳ Ожидает' : e.status === 'approved' ? '✅ Одобрено' : '❌ Отклонено'}</span>
              <span class="admin-edit-action">${e.action === 'create' ? '+ Создание' : '✏️ Правка'}</span>
            </div>
            <div class="admin-edit-body">
              <div class="admin-edit-title"><b>${esc(e.title)}</b></div>
              <div class="admin-edit-preview">${esc((e.content || '').slice(0, 150))}...</div>
            </div>
            ${e.status === 'pending' && currentProfile.role === 'admin' ? `
              <div class="admin-edit-actions">
                <button class="approve-btn" data-id="${e.id}">✅ Одобрить</button>
                <button class="danger reject-btn" data-id="${e.id}">❌ Отклонить</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => reviewEdit(btn.dataset.id, 'approved'));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => reviewEdit(btn.dataset.id, 'rejected'));
    });
  }

  async function reviewEdit(id, status) {
    const sb = await initSupabase();
    if (!sb) return;

    const { error } = await sb
      .from('article_edits')
      .update({
        status,
        reviewer_id: currentUser.id,
        reviewer_comment: status === 'approved' ? 'Одобрено' : 'Отклонено',
      })
      .eq('id', id);

    if (error) { alert(error.message); return; }
    renderEdits();
  }

  // ============ ПОЛЬЗОВАТЕЛИ ============
  async function renderUsers() {
    const sb = await initSupabase();
    if (!sb) return;

    const { data: users } = await sb
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    content.innerHTML = `
      <h3>👥 Пользователи</h3>
      <p class="muted" style="margin-bottom: 1rem;">Всего: <b>${users?.length || 0}</b></p>
      <div class="admin-users-list">
        ${users?.map(u => `
          <div class="admin-user-item">
            <div class="admin-user-avatar">${esc((u.username || '?')[0].toUpperCase())}</div>
            <div class="admin-user-info">
              <div class="admin-user-name">${esc(u.username || 'Без имени')}</div>
              <div class="admin-user-role">${u.role === 'admin' ? '👑 Админ' : u.role === 'moderator' ? '🛡️ Модератор' : '👤 Пользователь'}</div>
            </div>
            ${currentProfile.role === 'admin' && u.id !== currentUser.id ? `
              <select class="admin-role-select" data-user-id="${u.id}">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>👤 Пользователь</option>
                <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>🛡️ Модератор</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Админ</option>
              </select>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.admin-role-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const userId = sel.dataset.userId;
        const newRole = sel.value;
        const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) { alert(error.message); return; }
        alert('Роль обновлена');
      });
    });
  }

  // ============ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ============
    async function switchTab(tab) {
    currentTab = tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    content.innerHTML = '<p class="muted">Загрузка...</p>';

    if (tab === 'dashboard') await renderDashboard();
    if (tab === 'articles') await renderArticles();
    if (tab === 'edits') await renderEdits();
    if (tab === 'users') await renderUsers();
    if (tab === 'complaints') await renderComplaints();
  }
  tabs.forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });
    // ============ ЖАЛОБЫ ============
  async function renderComplaints() {
    const sb = await initSupabase();
    if (!sb) return;

    const { data: complaints } = await sb
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    const counts = {
      pending: complaints?.filter(c => c.status === 'pending').length || 0,
      in_review: complaints?.filter(c => c.status === 'in_review').length || 0,
      approved: complaints?.filter(c => c.status === 'approved').length || 0,
      rejected: complaints?.filter(c => c.status === 'rejected').length || 0,
    };

    content.innerHTML = `
      <div class="admin-stats" style="margin-bottom: 1.5rem;">
        <div class="stat-card"><div class="stat-num">${counts.pending}</div><div class="stat-label">⏳ Ожидают</div></div>
        <div class="stat-card"><div class="stat-num">${counts.in_review}</div><div class="stat-label">🔍 В работе</div></div>
        <div class="stat-card"><div class="stat-num">${counts.approved}</div><div class="stat-label">✅ Одобрено</div></div>
        <div class="stat-card"><div class="stat-num">${counts.rejected}</div><div class="stat-label">❌ Отклонено</div></div>
      </div>

      <h3>⚖️ Все жалобы (${complaints?.length || 0})</h3>

      <div class="complaints-admin-list">
        ${!complaints?.length ? '<p class="muted">Жалоб пока нет</p>' : complaints.map(c => `
          <div class="complaint-admin-item status-${c.status}">
            <div class="complaint-admin-head">
              <span class="complaint-status-badge status-${c.status}">${
                c.status === 'pending' ? '⏳ Ожидает' :
                c.status === 'in_review' ? '🔍 В работе' :
                c.status === 'approved' ? '✅ Одобрено' :
                c.status === 'rejected' ? '❌ Отклонено' : '🔒 Закрыта'
              }</span>
              <span class="complaint-date">${new Date(c.created_at).toLocaleString('ru-RU')}</span>
              <span class="complaint-id">#${c.id}</span>
            </div>

            <div class="complaint-admin-body">
              <div class="complaint-section">
                <div class="complaint-label">👤 Автор:</div>
                <div class="complaint-value">
                  <b>Roblox:</b> ${esc(c.author_roblox)}<br>
                  <b>Discord:</b> ${esc(c.author_discord)}
                </div>
              </div>

              <div class="complaint-section">
                <div class="complaint-label">🎯 Нарушитель:</div>
                <div class="complaint-value">
                  <b>Roblox:</b> ${esc(c.violator_roblox)}<br>
                  ${c.violator_discord ? `<b>Discord:</b> ${esc(c.violator_discord)}` : ''}
                </div>
              </div>

              <div class="complaint-section">
                <div class="complaint-label">📋 Нарушения:</div>
                <div class="complaint-value">${esc(c.violations)}</div>
              </div>

              <div class="complaint-section">
                <div class="complaint-label">🔗 Доказательства:</div>
                <div class="complaint-value">${esc(c.evidence)}</div>
              </div>
            </div>

            <div class="complaint-admin-actions">
              ${c.status === 'pending' || c.status === 'in_review' ? `
                <button class="secondary set-status" data-id="${c.id}" data-status="in_review">🔍 В работу</button>
                <button class="approve-btn set-status" data-id="${c.id}" data-status="approved">✅ Одобрить</button>
                <button class="danger set-status" data-id="${c.id}" data-status="rejected">❌ Отклонить</button>
                <button class="secondary set-status" data-id="${c.id}" data-status="closed">🔒 Закрыть</button>
              ` : `
                <button class="secondary set-status" data-id="${c.id}" data-status="pending">↩️ Вернуть в ожидание</button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.set-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        const { error } = await sb.from('complaints').update({
          status,
          reviewer_id: currentUser.id,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
        if (error) { alert(error.message); return; }
        renderComplaints();
      });
    });
  }

  // Старт
  await switchTab('dashboard');
})();