(function() {
  const chat = document.getElementById('aiChat');
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');
  if (!chat || !input || !sendBtn) return;

  let busy = false;

  function buildContext() {
    let ctx = '=== ЗАКОНОДАТЕЛЬСТВО РЕСПУБЛИКИ ЙОЙГРАД ===\n\n';

    if (typeof UK_ARTICLES !== 'undefined') {
      ctx += '--- УГОЛОВНЫЙ КОДЕКС (УК) ---\n';
      ctx += UK_ARTICLES.map(a =>
        `Статья ${a.article} УК. ${a.title}\n${a.content}${a.punishment ? '\nНаказание: ' + a.punishment : ''}${a.wanted ? '\nРозыск: ' + '★'.repeat(a.wanted) : ''}`
      ).join('\n\n');
      ctx += '\n\n';
    }

    if (typeof KOAP_ARTICLES !== 'undefined') {
      ctx += '--- КОДЕКС ОБ АДМИНИСТРАТИВНЫХ ПРАВОНАРУШЕНИЯХ (КоАП) ---\n';
      ctx += KOAP_ARTICLES.map(a =>
        `Статья ${a.article} КоАП. ${a.title}\n${a.content}${a.punishment ? '\nНаказание: ' + a.punishment : ''}${a.bail ? '\nЗалог: ' + a.bail.toLocaleString('ru-RU') + ' КРРП' : ''}`
      ).join('\n\n');
      ctx += '\n\n';
    }

    if (typeof FRACTIONS !== 'undefined') {
      ctx += '--- ФРАКЦИИ И ВЕТВИ ВЛАСТИ ---\n';
      ctx += FRACTIONS.map(f =>
        `${f.name} (${f.fullName})\nРуководитель: ${f.leadership}\nОписание: ${f.description}\nОбязанности: ${f.duties.join('; ')}\nПрава: ${f.rights.join('; ')}\nЗвания: ${f.ranks.join(' → ')}\nФорма: ${f.uniform}`
      ).join('\n\n');
      ctx += '\n\n';

      // Законы фракций
      const lawsWithContent = FRACTIONS.filter(f => f.law);
      if (lawsWithContent.length) {
        ctx += '--- РЕСПУБЛИКАНСКИЕ ЗАКОНЫ ---\n';
        lawsWithContent.forEach(f => {
          ctx += `\n[${f.law.title}] (относится к фракции: ${f.name})\n`;
          ctx += f.law.articles.map(a =>
            `${a.num}. ${a.title}\n${a.content}`
          ).join('\n\n');
          ctx += '\n\n';
        });
      }
    }

    return ctx;
  }

  const SYSTEM_PROMPT = `Ты — юридический помощник Республики Йойград. Отвечай СТРОГО по законам и информации ниже. Всегда ссылайся на конкретные статьи (например: «Статья 6.5 УК», «Статья 10.2 КоАП», «Статья 17 Республиканского закона об обороне»).

Правила:
- Отвечай кратко и по существу.
- Если ответа нет в базе — скажи: «В законодательстве Республики Йойград такой нормы не найдено».
- Не выдумывай статьи и наказания.
- Тон — официальный, как у юриста.
- Пиши на русском.
- Форматируй: сначала ответ, потом ссылки на статьи.

БАЗА ЗНАНИЙ:
`;

  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-' + role;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  async function ask(question) {
    if (busy || !question.trim()) return;
    busy = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    addMsg(question, 'user');
    const thinking = addMsg('⏳ Изучаю законодательство...', 'assistant');

    try {
      const context = buildContext();
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + context },
            { role: 'user', content: question }
          ]
        })
      });

      if (!response.ok) throw new Error('Сервис вернул ошибку ' + response.status);

      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content
        || data?.message?.content
        || (typeof data === 'string' ? data : 'Не удалось получить ответ.');

      thinking.textContent = answer;
    } catch (e) {
      console.error(e);
      thinking.textContent = '❌ Ошибка: ' + (e?.message || 'попробуйте позже');
    } finally {
      busy = false;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Спросить';
    }
  }

  sendBtn.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
  });

  document.querySelectorAll('.ai-hint').forEach(h => {
    h.addEventListener('click', () => {
      input.value = h.dataset.q;
      sendBtn.click();
    });
  });
})();