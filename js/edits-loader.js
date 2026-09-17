// ============================================================
// ЗАГРУЗКА ОДОБРЕННЫХ ПРАВОК ИЗ SUPABASE
// ============================================================

async function applyApprovedEdits(sourceName) {
  const sb = await initSupabase();
  if (!sb) return;

  // Определяем какой массив обновлять
  const map = {
    'УК': 'UK_ARTICLES',
    'КоАП': 'KOAP_ARTICLES',
    'Закон об обороне': 'LAW_OBORONA',
  };
  const arrayName = map[sourceName];
  if (!arrayName) return;

  // Получаем массив (он объявлен через const, поэтому работаем по ссылке)
  const target = window[arrayName] || (typeof eval(arrayName) !== 'undefined' ? eval(arrayName) : null);
  if (!Array.isArray(target)) {
    console.warn('Массив не найден:', arrayName);
    return;
  }

  // Загружаем одобренные правки
  const { data: edits, error } = await sb
    .from('article_edits')
    .select('*')
    .eq('source', sourceName)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) { console.error(error); return; }
  if (!edits?.length) return;

  // Накладываем правки
  for (const e of edits) {
    const idx = target.findIndex(a => a.article === e.article);
    const newData = {
      article: e.article,
      chapter: e.chapter || '',
      title: e.title,
      content: e.content,
      punishment: e.punishment || '',
      jurisdiction: e.jurisdiction || 'Общая',
      wanted: e.wanted || 0,
      bail: e.bail || null,
    };

    if (idx >= 0) {
      // Обновляем существующую
      target[idx] = { ...target[idx], ...newData };
    } else {
      // Добавляем новую
      target.push(newData);
    }
  }

  console.log(`✅ Применено правок для ${sourceName}: ${edits.length}`);
}

window.applyApprovedEdits = applyApprovedEdits;