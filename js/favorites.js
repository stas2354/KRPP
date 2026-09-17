// Кнопка ⭐ в модалке + история
window.attachFavoriteButton = async function(source, article, title, page) {
  const modalContent = document.getElementById('modalContent');
  if (!modalContent) return;

  const user = await getUser();
  const key = makeKey(source, article);

  modalContent.querySelector('.fav-btn')?.remove();

  const btn = document.createElement('button');
  btn.className = 'fav-btn';

  if (!user) {
    btn.innerHTML = '🔒 Войдите чтобы сохранить';
    btn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
    modalContent.appendChild(btn);
    return;
  }

  const isFav = await isFavorite(key);
  btn.classList.toggle('active', isFav);
  btn.innerHTML = isFav ? '⭐ В избранном' : '☆ В избранное';

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (btn.classList.contains('active')) {
      await removeFavorite(key);
      btn.classList.remove('active');
      btn.innerHTML = '☆ В избранное';
    } else {
      await addFavorite({ key, source, article, title, page });
      btn.classList.add('active');
      btn.innerHTML = '⭐ В избранном';
    }
  });

  modalContent.appendChild(btn);
};

window.pushToHistory = async function(source, article, title, page) {
  const user = await getUser();
  if (!user) return;
  const key = makeKey(source, article);
  await pushHistory({ key, source, article, title, page });
};