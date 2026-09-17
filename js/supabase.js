// ============================================================
// Supabase — подключение и API
// ============================================================

const SUPABASE_URL = 'https://puyypvadgvrizgulduxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nrxBSnrQNxH0mnVG0IEfRA_FIJOfwm2';

let supabase = null;

async function initSupabase() {
  if (supabase) return supabase;

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS не загружен. Добавь CDN скрипт.');
    return null;
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
    }
  });

  return supabase;
}

// ============================================================
// ПОЛЬЗОВАТЕЛЬ
// ============================================================

async function getUser() {
  const sb = await initSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getProfile() {
  const sb = await initSupabase();
  if (!sb) return null;
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) { console.error(error); return null; }
  return data;
}

async function signUp(email, password, username) {
  const sb = await initSupabase();
  if (!sb) return { error: 'Supabase не загружен' };

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username,
      }
    }
  });
  return { data, error };
}

async function signIn(email, password) {
  const sb = await initSupabase();
  if (!sb) return { error: 'Supabase не загружен' };

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

async function signInWithGoogle() {
  const sb = await initSupabase();
  if (!sb) return { error: 'Supabase не загружен' };

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    }
  });
  return { data, error };
}

async function signOut() {
  const sb = await initSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ============================================================
// ИЗБРАННОЕ
// ============================================================

async function getFavorites() {
  const sb = await initSupabase();
  if (!sb) return [];
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from('favorites')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

async function addFavorite(item) {
  const sb = await initSupabase();
  if (!sb) return false;
  const user = await getUser();
  if (!user) return false;

  const { error } = await sb.from('favorites').insert({
    user_id: user.id,
    article_key: item.key,
    source: item.source,
    article: item.article,
    title: item.title,
    page: item.page,
  });

  if (error) { console.error(error); return false; }
  return true;
}

async function removeFavorite(articleKey) {
  const sb = await initSupabase();
  if (!sb) return false;
  const user = await getUser();
  if (!user) return false;

  const { error } = await sb
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('article_key', articleKey);

  if (error) { console.error(error); return false; }
  return true;
}

async function isFavorite(articleKey) {
  const sb = await initSupabase();
  if (!sb) return false;
  const user = await getUser();
  if (!user) return false;

  const { data } = await sb
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('article_key', articleKey)
    .maybeSingle();

  return !!data;
}

// ============================================================
// ИСТОРИЯ
// ============================================================

async function getHistory() {
  const sb = await initSupabase();
  if (!sb) return [];
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from('history')
    .select('*')
    .order('viewed_at', { ascending: false })
    .limit(10);

  if (error) { console.error(error); return []; }
  return data || [];
}

async function pushHistory(item) {
  const sb = await initSupabase();
  if (!sb) return;
  const user = await getUser();
  if (!user) return;

  const { error } = await sb.from('history').upsert({
    user_id: user.id,
    article_key: item.key,
    source: item.source,
    article: item.article,
    title: item.title,
    page: item.page,
    viewed_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,article_key'
  });

  if (error) console.error(error);
}

async function clearHistory() {
  const sb = await initSupabase();
  if (!sb) return;
  const user = await getUser();
  if (!user) return;

  await sb.from('history').delete().eq('user_id', user.id);
}