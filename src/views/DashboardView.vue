<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import auth from '../auth';
import DataTable from '../components/DataTable.vue';

const router = useRouter();

const isAuthenticated = computed(() => !!auth.getToken());
const username = computed(() => auth.getUsername());
const roles = computed(() => auth.getRoles());

const articles = ref([]);
const stores = ref([]);
const prices = ref([]);

const searchQuery = ref('');
const searchResults = ref([]);
const searching = ref(false);
const searchError = ref(null);

const loading = ref({ articles: false, stores: false, prices: false });
const error = ref({ articles: null, stores: null, prices: null });
const deleting = ref({ articles: false, stores: false, prices: false });

const loadArticles = async () => {
  loading.value.articles = true;
  error.value.articles = null;
  try {
    const res = await api.get('/articles');
    articles.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    error.value.articles = e.response?.data || e.message;
  } finally {
    loading.value.articles = false;
  }
};

const loadStores = async () => {
  loading.value.stores = true;
  error.value.stores = null;
  try {
    const res = await api.get('/stores');
    stores.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    error.value.stores = e.response?.data || e.message;
  } finally {
    loading.value.stores = false;
  }
};

const loadPrices = async () => {
  loading.value.prices = true;
  error.value.prices = null;
  try {
    const res = await api.get('/prices');
    prices.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    error.value.prices = e.response?.data || e.message;
  } finally {
    loading.value.prices = false;
  }
};

const searchArticles = async () => {
  searching.value = true;
  searchError.value = null;
  try {
    const q = (searchQuery.value ?? '').toString();
    const res = await api.get('/articles/search', { params: { q }, skipAuth: true });
    if (Array.isArray(res.data)) {
      // Backend returns e.g. ["000000000000102343", "000000000000003000"]
      // Convert to objects so DataTable can infer columns.
      const arr = res.data;
      const primitivesOnly = arr.every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v));
      searchResults.value = primitivesOnly ? arr.filter((v) => v !== null && v !== undefined).map((v) => ({ articleNumber: String(v) })) : arr;
    } else {
      searchResults.value = [];
    }
  } catch (e) {
    searchError.value = e.response?.data || e.message;
  } finally {
    searching.value = false;
  }
};

const resolveArticleId = (row) => {
  if (!row || typeof row !== 'object') return null;
  return row.id ?? row.articleNumber ?? row.article_number ?? row.articleId ?? null;
};

const resolveStoreId = (row) => {
  if (!row || typeof row !== 'object') return null;
  return row.id ?? row.storeNumber ?? row.store_number ?? row.storeId ?? null;
};

const unwrapValue = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'object' && 'value' in v) return v.value;
  return v;
};

const pickFirst = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = unwrapValue(obj[k]);
    if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  }
  return null;
};

const resolvePriceKey = (row) => {
  if (!row || typeof row !== 'object') return null;
  const keyObj = row.id || row.key || row.priceKey || row.price_key || null;
  return keyObj && typeof keyObj === 'object' ? keyObj : null;
};

const deleteArticle = async (row) => {
  const id = resolveArticleId(row);
  if (!id) {
    error.value.articles = 'Cannot delete: missing article id/articleNumber';
    return;
  }
  deleting.value.articles = true;
  error.value.articles = null;
  try {
    await api.delete(`/article/${encodeURIComponent(String(id))}`);
    await loadArticles();
  } catch (e) {
    error.value.articles = e.response?.data || e.message;
  } finally {
    deleting.value.articles = false;
  }
};

const deleteStore = async (row) => {
  const id = resolveStoreId(row);
  if (!id) {
    error.value.stores = 'Cannot delete: missing store id/storeNumber';
    return;
  }
  deleting.value.stores = true;
  error.value.stores = null;
  try {
    await api.delete(`/store/${encodeURIComponent(String(id))}`);
    await loadStores();
  } catch (e) {
    error.value.stores = e.response?.data || e.message;
  } finally {
    deleting.value.stores = false;
  }
};

const deletePrice = async (row) => {
  const key = resolvePriceKey(row);
  const storeNumber = pickFirst(row, ['storeNumber', 'store_number', 'store', 'storeId']) ?? pickFirst(key, ['storeNumber', 'store_number', 'store']);
  const articleNumber = pickFirst(row, ['articleNumber', 'article_number', 'article', 'articleId']) ?? pickFirst(key, ['articleNumber', 'article_number', 'article']);
  const validFrom =
    pickFirst(row, ['validFrom', 'valid_from', 'valid_from_ts', 'from', 'validFromDate']) ??
    pickFirst(key, ['validFrom', 'valid_from', 'from']);
  const type = pickFirst(row, ['type', 'priceType', 'price_type']) ?? pickFirst(key, ['type', 'priceType', 'price_type']);

  if (!storeNumber || !articleNumber || !validFrom || !type) {
    const keys = row && typeof row === 'object' ? Object.keys(row).join(', ') : '';
    const keyKeys = key ? Object.keys(key).join(', ') : '';
    error.value.prices = `Cannot delete price: need storeNumber, articleNumber, validFrom, type (row keys: ${keys}${keyKeys ? `; key keys: ${keyKeys}` : ''})`;
    return;
  }

  deleting.value.prices = true;
  error.value.prices = null;
  try {
    await api.delete(
      `/price/${encodeURIComponent(String(storeNumber))}/${encodeURIComponent(String(articleNumber))}/${encodeURIComponent(
        String(validFrom)
      )}/${encodeURIComponent(String(type))}`
    );
    await loadPrices();
  } catch (e) {
    error.value.prices = e.response?.data || e.message;
  } finally {
    deleting.value.prices = false;
  }
};

const goLogin = async () => {
  await router.push('/login');
};

const goWrite = async () => {
  await router.push('/write');
};

const logout = () => {
  auth.logout();
};

onMounted(async () => {
  await Promise.all([loadArticles(), loadStores(), loadPrices()]);
});
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="left">
        <h1 class="brand">Dashboard</h1>
        <div class="status">
          <span v-if="isAuthenticated">Logged in as <strong>{{ username }}</strong></span>
          <span v-else>Not logged in</span>
          <span v-if="roles?.length">(roles: {{ roles.join(', ') }})</span>
        </div>
      </div>
      <div class="right">
        <button v-if="!isAuthenticated" @click="goLogin">Login</button>
        <button v-else @click="logout">Logout</button>
        <button class="secondary" @click="goWrite">Write</button>
        <button class="secondary" @click="loadArticles">Refresh Articles</button>
        <button class="secondary" @click="loadStores">Refresh Stores</button>
        <button class="secondary" @click="loadPrices">Refresh Prices</button>
      </div>
    </header>

    <main class="grid">
      <section class="searchPanel">
        <h2 class="panelTitle">Article Search</h2>
        <form class="searchForm" @submit.prevent="searchArticles">
          <input
            v-model="searchQuery"
            class="searchInput"
            type="text"
            placeholder="Search articles (q)"
            :disabled="searching"
          />
          <button type="submit" :disabled="searching">Search</button>
        </form>
      </section>

      <DataTable title="Search Results" :rows="searchResults" :loading="searching" :error="searchError" />

      <DataTable title="Articles" :rows="articles" :loading="loading.articles || deleting.articles" :error="error.articles">
        <template v-if="isAuthenticated" #actions="{ row }">
          <button class="danger" type="button" :disabled="deleting.articles" @click="deleteArticle(row)">Delete</button>
        </template>
      </DataTable>

      <DataTable title="Stores" :rows="stores" :loading="loading.stores || deleting.stores" :error="error.stores">
        <template v-if="isAuthenticated" #actions="{ row }">
          <button class="danger" type="button" :disabled="deleting.stores" @click="deleteStore(row)">Delete</button>
        </template>
      </DataTable>

      <DataTable title="Prices" :rows="prices" :loading="loading.prices || deleting.prices" :error="error.prices">
        <template v-if="isAuthenticated" #actions="{ row }">
          <button class="danger" type="button" :disabled="deleting.prices" @click="deletePrice(row)">Delete</button>
        </template>
      </DataTable>
    </main>
  </div>
</template>

<style scoped>
.page{max-width:1200px;margin-top: 16px;padding:0 16px}
.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.brand{margin:0;font-size:22px}
.status{margin-top:6px;font-size:13px;opacity:0.85}
.right{display:flex;gap:10px;flex-wrap:wrap}
.secondary{background:#f3f3f3}
.danger{background:#fff;border:1px solid rgba(176,0,32,0.35);color:#b00020}
.grid{display:grid;grid-template-columns:1fr;gap:12px}

.searchPanel{background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:12px;padding:12px}
.panelTitle{margin:0 0 10px 0;font-size:16px}
.searchForm{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.searchInput{flex:1;min-width:260px;padding:8px 10px;border:1px solid rgba(0,0,0,0.18);border-radius:10px}
</style>
