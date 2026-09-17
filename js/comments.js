// ============================================================
// КОММЕНТАРИИ К СТАТЬЯМ
// ============================================================

async function getComments(articleKey) {
  const sb = await initSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .eq('article_key', articleKey)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error(error); return []; }
  return data || [];
}

async function addComment(articleKey, source, article, content) {
  const sb = await initSupabase();
  if (!sb) return { error: 'Supabase не загружен' };
  const user = await getUser();
  if (!user) return { error: 'Нужно войти в аккаунт' };

  const { error } = await sb.from('comments').insert({
    user_id: user.id,
    article_key: articleKey,
    source: source,
    article: article,
    content: content.trim(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}

async function deleteComment(commentId) {
  const sb = await initSupabase();
  if (!sb) return false;
  const user = await getUser();
  if (!user) return false;

  // Получаем профиль для проверки роли
  const profile = await getProfile();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  // Удалять может автор или админ
  const { data: comment } = await sb
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment) return false;
  if (comment.user_id !== user.id && !isAdmin) return false;

  const { error } = await sb.from('comments').delete().eq('id', commentId);
  return !error;
}

// ============================================================
// ОТРИСОВКА КОММЕНТАРИЕВ В МОДАЛКЕ
// ============================================================

async function renderComments(articleKey, source, article) {
  const container = document.getElementById('commentsSection');
  if (!container) return;

  const user = await getUser();
  const profile = user ? await getProfile() : null;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function initials(name) {
    return (name || '?')[0].toUpperCase();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
    if (diff < 604800) return Math.floor(diff / 86400) + ' дн назад';

    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const comments = await getComments(articleKey);

  let html = `
    <div class="comments-block">
      <h3 class="comments-title">💬 Комментарии (${comments.length})</h3>
  `;

  // Форма добавления
  if (user) {
    html += `
      <div class="comment-form">
        <div class="comment-avatar">${esc(initials(profile?.username))}</div>
        <div class="comment-form-body">
          <textarea id="newCommentText" placeholder="Написать комментарий..." maxlength="2000"></textarea>
          <div class="comment-form-actions">
            <span class="comment-form-hint" id="commentHint">0 / 2000</span>
            <button id="submitCommentBtn">Отправить</button>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="comments-login-hint">
        <a href="login.html">Войдите</a>, чтобы оставить комментарий
      </div>
    `;
  }

  // Список комментариев
  if (!comments.length) {
    html += '<p class="muted" style="text-align:center; padding: 1.5rem 0;">Комментариев пока нет. Будьте первым!</p>';
  } else {
    html += '<div class="comments-list">';
    comments.forEach(c => {
      const author = c.profiles?.username || c.profiles?.display_name || 'Аноним';
      const isOwn = user && c.user_id === user.id;
      const canDelete = isOwn || isAdmin;

      html += `
        <div class="comment" data-id="${c.id}">
          <div class="comment-avatar">${esc(initials(author))}</div>
          <div class="comment-body">
            <div class="comment-head">
              <span class="comment-author">${esc(author)}</span>
              <span class="comment-date">${formatDate(c.created_at)}</span>
              ${canDelete ? `<button class="comment-delete" data-id="${c.id}" title="Удалить">✕</button>` : ''}
            </div>
            <div class="comment-text">${esc(c.content)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // === Обработчики ===

  // Счётчик символов
  const textarea = document.getElementById('newCommentText');
  const hint = document.getElementById('commentHint');
  if (textarea && hint) {
    textarea.addEventListener('input', () => {
      hint.textContent = `${textarea.value.length} / 2000`;
    });
  }

  // Отправка комментария
  const submitBtn = document.getElementById('submitCommentBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content) return;

      submitBtn.disabled = true;
      submitBtn.textContent = '...';

      const res = await addComment(articleKey, source, article, content);
      if (res.error) {
        alert(res.error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
        return;
      }

      textarea.value = '';
      await renderComments(articleKey, source, article);
    });
  }

  // Удаление комментариев
  document.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить комментарий?')) return;
      const id = btn.dataset.id;
      await deleteComment(id);
      await renderComments(articleKey, source, article);
    });
  });
}

window.renderComments = renderComments;