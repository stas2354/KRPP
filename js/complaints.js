// ============================================================
// ПОДАЧА ЖАЛОБ
// ============================================================

(function() {
  const form = document.getElementById('complaintForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errEl = document.getElementById('formError');
    const okEl = document.getElementById('formSuccess');
    const submitBtn = document.getElementById('submitBtn');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    const authorRoblox = document.getElementById('authorRoblox').value.trim();
    const authorDiscord = document.getElementById('authorDiscord').value.trim();
    const violatorRoblox = document.getElementById('violatorRoblox').value.trim();
    const violatorDiscord = document.getElementById('violatorDiscord').value.trim();
    const violations = document.getElementById('violations').value.trim();
    const evidence = document.getElementById('evidence').value.trim();

    if (!authorRoblox || !authorDiscord || !violatorRoblox || !violations || !evidence) {
      errEl.textContent = 'Заполните все обязательные поля (отмечены *)';
      errEl.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (violations.length < 20) {
      errEl.textContent = 'Опишите нарушения подробнее (минимум 20 символов)';
      errEl.classList.remove('hidden');
      return;
    }

    if (evidence.length < 10) {
      errEl.textContent = 'Добавьте ссылки на доказательства';
      errEl.classList.remove('hidden');
      return;
    }

    const sb = await initSupabase();
    if (!sb) {
      errEl.textContent = 'Ошибка подключения. Обновите страницу.';
      errEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Отправка...';

    // Пытаемся получить текущего пользователя (может быть null)
    let authorId = null;
    try {
      const user = await getUser();
      if (user) authorId = user.id;
    } catch { /* ignore */ }

    const { error } = await sb.from('complaints').insert({
      author_id: authorId,
      author_roblox: authorRoblox,
      author_discord: authorDiscord,
      violator_roblox: violatorRoblox,
      violator_discord: violatorDiscord || null,
      violations,
      evidence,
      status: 'pending',
    });

    if (error) {
      console.error(error);
      errEl.textContent = 'Ошибка отправки: ' + error.message;
      errEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Отправить жалобу';
      return;
    }

    // Успех
    form.reset();
    okEl.innerHTML = '✅ Жалоба отправлена! Администрация рассмотрит её в ближайшее время.<br>Рассмотрение происходит в Discord — следите за ответом.';
    okEl.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Отправить жалобу';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();