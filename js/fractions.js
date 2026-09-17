(function() {
  const powerGrid = document.getElementById('powerGrid');
  const govGrid = document.getElementById('govGrid');
  const searchInput = document.getElementById('search');
  if (!powerGrid) return;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function cardHTML(f) {
    return `
      <a href="fraction.html?id=${f.id}" class="fraction-card" style="--fc1:${f.color}; --fc2:${f.color2}; text-decoration: none;">
        <div class="fraction-emoji">${f.emoji}</div>
        <h3>${esc(f.name)}</h3>
        <div class="fraction-full">${esc(f.fullName)}</div>
        <p class="fraction-desc">${esc(f.description)}</p>
        <div class="fraction-badge">${f.duties.length} обязанностей • ${f.ranks.length} званий</div>
      </a>
    `;
  }

  function render(filter = '') {
    const q = filter.trim().toLowerCase();
    const match = f => {
      if (!q) return true;
      return (f.name + ' ' + f.fullName + ' ' + f.description + ' ' + f.duties.join(' ')).toLowerCase().includes(q);
    };

    const powers = FRACTIONS.filter(f => !f.id.startsWith('gov-') && match(f));
    const govs = FRACTIONS.filter(f => f.id.startsWith('gov-') && match(f));

    powerGrid.innerHTML = powers.length
      ? powers.map(cardHTML).join('')
      : '<p class="muted">Ничего не найдено</p>';
    govGrid.innerHTML = govs.length
      ? govs.map(cardHTML).join('')
      : '<p class="muted">Ничего не найдено</p>';
  }

  if (searchInput) searchInput.addEventListener('input', () => render(searchInput.value));

  render();
})();