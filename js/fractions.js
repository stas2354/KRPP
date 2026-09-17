// Логика страницы фракций
(function() {
  const grid = document.getElementById('fractionsGrid');
  const searchInput = document.getElementById('search');
  if (!grid) return;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function render(filter = '') {
    const q = filter.trim().toLowerCase();
    const items = FRACTIONS.filter(f => {
      if (!q) return true;
      return (f.name + ' ' + f.fullName + ' ' + f.description + ' ' + f.duties.join(' ')).toLowerCase().includes(q);
    });

    if (!items.length) {
      grid.innerHTML = '<p class="muted">Ничего не найдено</p>';
      return;
    }

    grid.innerHTML = items.map(f => `
      <div class="fraction-card" style="--fc1:${f.color}; --fc2:${f.color2};" onclick="openFraction('${f.id}')">
        <div class="fraction-emoji">${f.emoji}</div>
        <h3>${esc(f.name)}</h3>
        <div class="fraction-full">${esc(f.fullName)}</div>
        <p class="fraction-desc">${esc(f.description)}</p>
        <div class="fraction-badge">${f.duties.length} обязанностей • ${f.ranks.length} званий</div>
      </div>
    `).join('');
  }

  window.openFraction = function(id) {
    const f = FRACTIONS.find(x => x.id === id);
    if (!f) return;
    const mc = document.getElementById('modalContent');
    mc.innerHTML = `
      <div class="fraction-header" style="--fc1:${f.color}; --fc2:${f.color2};">
        <div class="fraction-emoji-large">${f.emoji}</div>
        <h2>${esc(f.name)}</h2>
        <div class="fraction-full">${esc(f.fullName)}</div>
        <div class="fraction-lead">Руководитель: <b>${esc(f.leadership)}</b></div>
      </div>
      <p style="margin: 1rem 0; line-height: 1.6;">${esc(f.description)}</p>

      <div class="fraction-section">
        <h4>📋 Обязанности</h4>
        <ul class="fraction-list">
          ${f.duties.map(d => `<li>${esc(d)}</li>`).join('')}
        </ul>
      </div>

      <div class="fraction-section">
        <h4>⚖️ Права</h4>
        <ul class="fraction-list">
          ${f.rights.map(r => `<li>${esc(r)}</li>`).join('')}
        </ul>
      </div>

      <div class="fraction-section">
        <h4>🎖️ Звания</h4>
        <div class="ranks-chain">
          ${f.ranks.map((r, i) => `
            <span class="rank-item">${esc(r)}</span>
            ${i < f.ranks.length - 1 ? '<span class="rank-arrow">→</span>' : ''}
          `).join('')}
        </div>
      </div>

      <div class="fraction-section">
        <h4>👔 Форма</h4>
        <p>${esc(f.uniform)}</p>
      </div>
    `;
    document.getElementById('modal').classList.add('active');
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => render(searchInput.value));
  }

  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') e.currentTarget.classList.remove('active');
  });

  render();
})();