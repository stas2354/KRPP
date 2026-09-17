// Добавляет кнопку ⭐ в модалку статьи
window.attachFavoriteButton = function(source, article, title, page) {
  const modalContent = document.getElementById('modalContent');
  if (!modalContent) return;

  const key = makeKey(source, article);
  const isFav = Store.isFavorite(key);

  // Удаляем старую кнопку если была
  modalContent.querySelector('.fav-btn')?.remove();

  const btn = document.createElement('button');
  btn.className = 'fav-btn' + (isFav ? ' active' : '');
  btn.innerHTML = isFav ? '⭐ В избранном' : '☆ В избранное';
  btn.title = isFav ? 'Убрать из избранного' : 'Добавить в избранное';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const now = Store.toggleFavorite({ key, source, article, title, page });
    btn.classList.toggle('active', now);
    btn.innerHTML = now ? '⭐ В избранном' : '☆ В избранное';
  });

  modalContent.appendChild(btn);
};

// Добавляет в историю
window.pushToHistory = function(source, article, title, page) {
  const key = makeKey(source, article);
  Store.pushHistory({ key, source, article, title, page });
};