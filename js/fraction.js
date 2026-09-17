(function() {
  const content = document.getElementById('content');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const f = FRACTIONS.find(x => x.id === id);

  if (!f) {
    content.innerHTML = `
      <h1>❌ Фракция не найдена</h1>
      <p class="subtitle">Вернуться к <a href="fractions.html" style="color: var(--accent);">списку фракций</a></p>
    `;
    return;
  }

  document.title = f.name + ' | Республика Йойград';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  content.innerHTML = `
    <a href="fractions.html" class="back-link">← Все фракции</a>

    <div class="fraction-hero" style="--fc1:${f.color}; --fc2:${f.color2};">
      <div class="fraction-emoji-huge">${f.emoji}</div>
      <h1>${esc(f.name)}</h1>
      <div class="fraction-full-hero">${esc(f.fullName)}</div>
      <div class="fraction-lead-hero">👤 Руководитель: <b>${esc(f.leadership)}</b></div>
    </div>

    <div class="fraction-block">
      <h2>📖 Описание</h2>
      <p>${esc(f.description)}</p>
    </div>

    <div class="fraction-block">
      <h2>📋 Обязанности</h2>
      <ul class="fraction-list">
        ${f.duties.map(d => `<li>${esc(d)}</li>`).join('')}
      </ul>
    </div>

    <div class="fraction-block">
      <h2>⚖️ Права</h2>
      <ul class="fraction-list">
        ${f.rights.map(r => `<li>${esc(r)}</li>`).join('')}
      </ul>
    </div>

    <div class="fraction-block">
      <h2>🎖️ Звания и должности</h2>
      <div class="ranks-chain">
        ${f.ranks.map((r, i) => `
          <span class="rank-item">${esc(r)}</span>
          ${i < f.ranks.length - 1 ? '<span class="rank-arrow">→</span>' : ''}
        `).join('')}
      </div>
    </div>

    <div class="fraction-block">
      <h2>👔 Форма</h2>
      <p>${esc(f.uniform)}</p>
    </div>
  `;
})();