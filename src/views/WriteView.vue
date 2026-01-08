<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import auth from '../auth';

const router = useRouter();

const isAuthenticated = computed(() => !!auth.getToken());
const username = computed(() => auth.getUsername());
const roles = computed(() => auth.getRoles());

const postBusy = ref({ article: false, store: false, price: false });
const postError = ref({ article: null, store: null, price: null });
const postResponse = ref({ article: null, store: null, price: null });

const articleForm = ref({
  articleNumber: '1001',
  articleName: 'Example Article',
  gtin: '0000000000000',
  gtinType: 'MAIN',
  quantityValue: '1',
  quantityUnit: 'P'
});

const storeForm = ref({
  storeNumber: 'S1',
  openingDate: '2024-01-15',
  closingDate: '2099-12-31',
  openingHours: {
    Monday: '08:00-20:00',
    Tuesday: '08:00-20:00',
    Wednesday: '08:00-20:00',
    Thursday: '08:00-20:00',
    Friday: '08:00-21:00',
    Saturday: '09:00-18:00',
    Sunday: 'Closed'
  }
});

const priceForm = ref({
  storeNumber: 'S1',
  articleNumber: '1001',
  amount: 9.99,
  validFrom: '2025-01-01T00:00:00Z',
  validTo: '2025-12-31T23:59:59Z',
  type: 'DEFAULT'
});

const requireNonEmpty = (value, label) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(`Missing ${label}`);
  }
};

const postJson = async (key, endpoint, body) => {
  postError.value[key] = null;
  postResponse.value[key] = null;
  postBusy.value[key] = true;
  try {
    const res = await api.post(endpoint, body);
    postResponse.value[key] = res.data;
  } catch (e) {
    postError.value[key] = e.response?.data || e.message || 'Request failed';
  } finally {
    postBusy.value[key] = false;
  }
};

const sendArticle = async () => {
  try {
    requireNonEmpty(articleForm.value.articleNumber, 'articleNumber');
    requireNonEmpty(articleForm.value.articleName, 'articleName');
    requireNonEmpty(articleForm.value.gtin, 'gtin');
    requireNonEmpty(articleForm.value.gtinType, 'gtin type');
    requireNonEmpty(articleForm.value.quantityUnit, 'quantity unit');
    requireNonEmpty(articleForm.value.quantityValue, 'quantity value');

    const body = {
      articleNumber: String(articleForm.value.articleNumber),
      articleName: String(articleForm.value.articleName),
      gtin: {
        value: String(articleForm.value.gtin),
        type: String(articleForm.value.gtinType)
      },
      quantity: {
        value: String(articleForm.value.quantityValue),
        unit: String(articleForm.value.quantityUnit)
      }
    };

    await postJson('article', '/article', body);
  } catch (e) {
    postError.value.article = e.message || String(e);
  }
};

const sendStore = async () => {
  try {
    requireNonEmpty(storeForm.value.storeNumber, 'storeNumber');
    requireNonEmpty(storeForm.value.openingDate, 'openingDate');
    requireNonEmpty(storeForm.value.closingDate, 'closingDate');

    const openingHours = {};
    for (const [day, hours] of Object.entries(storeForm.value.openingHours || {})) {
      if (String(hours || '').trim() !== '') openingHours[day] = String(hours);
    }

    const body = {
      storeNumber: String(storeForm.value.storeNumber),
      information: null,
      openingDate: String(storeForm.value.openingDate),
      closingDate: String(storeForm.value.closingDate),
      openingHours
    };

    await postJson('store', '/store', body);
  } catch (e) {
    postError.value.store = e.message || String(e);
  }
};

const sendPrice = async () => {
  try {
    requireNonEmpty(priceForm.value.storeNumber, 'storeNumber');
    requireNonEmpty(priceForm.value.articleNumber, 'articleNumber');
    requireNonEmpty(priceForm.value.validFrom, 'validFrom');
    requireNonEmpty(priceForm.value.validTo, 'validTo');
    requireNonEmpty(priceForm.value.type, 'type');

    const body = {
      storeNumber: String(priceForm.value.storeNumber),
      articleNumber: String(priceForm.value.articleNumber),
      amount: Number(priceForm.value.amount),
      validFrom: String(priceForm.value.validFrom),
      validTo: String(priceForm.value.validTo),
      type: String(priceForm.value.type)
    };

    await postJson('price', '/price', body);
  } catch (e) {
    postError.value.price = e.message || String(e);
  }
};

const goDashboard = async () => {
  await router.push('/');
};

const goLogin = async () => {
  await router.push('/login');
};

const logout = () => {
  auth.logout();
};
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="left">
        <h1 class="brand">Write</h1>
        <div class="status">
          <span v-if="isAuthenticated">Logged in as <strong>{{ username }}</strong></span>
          <span v-else>Not logged in</span>
          <span v-if="roles?.length">(roles: {{ roles.join(', ') }})</span>
        </div>
      </div>
      <div class="right">
        <button class="secondary" @click="goDashboard">Dashboard</button>
        <button v-if="!isAuthenticated" @click="goLogin">Login</button>
        <button v-else @click="logout">Logout</button>
      </div>
    </header>

    <div v-if="!isAuthenticated" class="notice">
      Trebuie să fii logat ca să poti adauga un articol.
    </div>

    <main class="grid">
      <section class="box">
        <div class="box-header">
          <h2 class="box-title">Add a new article</h2>
          <button class="mini" type="button" :disabled="postBusy.article || !isAuthenticated" @click="sendArticle">
            {{ postBusy.article ? 'Sending…' : 'Send' }}
          </button>
        </div>

        <div class="two">
          <label class="field">
            <span class="label">Article Number</span>
            <input type="text" v-model="articleForm.articleNumber" />
          </label>
          <label class="field">
            <span class="label">Gtin Value</span>
            <input type="text" v-model="articleForm.gtin" />
          </label>
        </div>

        <label class="field">
          <span class="label">Gtin Type</span>
          <select v-model="articleForm.gtinType">
            <option value="MAIN">MAIN</option>
            <option value="ALTERNATIVE">ALTERNATIVE</option>
          </select>
        </label>

        <label class="field">
          <span class="label">Article Name</span>
          <input type="text" v-model="articleForm.articleName" />
        </label>

        <div class="two">
          <label class="field">
            <span class="label">Quantity Value</span>
            <input type="text" v-model="articleForm.quantityValue" />
          </label>
          <label class="field">
            <span class="label">Quantity Unit</span>
            <select v-model="articleForm.quantityUnit">
              <option value="KG">KG</option>
              <option value="G">G</option>
              <option value="L">L</option>
              <option value="ML">ML</option>
              <option value="P">P</option>
            </select>
          </label>
        </div>

        <div v-if="postError.article" class="error" role="alert">{{ postError.article }}</div>
        <pre v-else-if="postResponse.article" class="out">{{ postResponse.article }}</pre>
      </section>

      <section class="box">
        <div class="box-header">
          <h2 class="box-title">Add a new store</h2>
          <button class="mini" type="button" :disabled="postBusy.store || !isAuthenticated" @click="sendStore">
            {{ postBusy.store ? 'Sending…' : 'Send' }}
          </button>
        </div>

        <label class="field">
          <span class="label">Store Number</span>
          <input type="text" v-model="storeForm.storeNumber" />
        </label>

        <div class="two">
          <label class="field">
            <span class="label">Opening Date (YYYY-MM-DD)</span>
            <input type="text" v-model="storeForm.openingDate" placeholder="2024-01-15" />
          </label>
          <label class="field">
            <span class="label">Closing Date (YYYY-MM-DD)</span>
            <input type="text" v-model="storeForm.closingDate" placeholder="2099-12-31" />
          </label>
        </div>

        <div class="hours">
          <p class="label">Opening Hours (lasa gol dacă nu vrei ziua)</p>
          <div class="two">
            <label class="field"><span class="label">Monday</span><input type="text" v-model="storeForm.openingHours.Monday" placeholder="08:00-20:00" /></label>
            <label class="field"><span class="label">Tuesday</span><input type="text" v-model="storeForm.openingHours.Tuesday" placeholder="08:00-20:00" /></label>
          </div>
          <div class="two">
            <label class="field"><span class="label">Wednesday</span><input type="text" v-model="storeForm.openingHours.Wednesday" placeholder="08:00-20:00" /></label>
            <label class="field"><span class="label">Thursday</span><input type="text" v-model="storeForm.openingHours.Thursday" placeholder="08:00-20:00" /></label>
          </div>
          <div class="two">
            <label class="field"><span class="label">Friday</span><input type="text" v-model="storeForm.openingHours.Friday" placeholder="08:00-21:00" /></label>
            <label class="field"><span class="label">Saturday</span><input type="text" v-model="storeForm.openingHours.Saturday" placeholder="09:00-18:00" /></label>
          </div>
          <label class="field"><span class="label">Sunday</span><input type="text" v-model="storeForm.openingHours.Sunday" placeholder="Closed" /></label>
        </div>

        <div v-if="postError.store" class="error" role="alert">{{ postError.store }}</div>
        <pre v-else-if="postResponse.store" class="out">{{ postResponse.store }}</pre>
      </section>

      <section class="box">
        <div class="box-header">
          <h2 class="box-title">Add a new price</h2>
          <button class="mini" type="button" :disabled="postBusy.price || !isAuthenticated" @click="sendPrice">
            {{ postBusy.price ? 'Sending…' : 'Send' }}
          </button>
        </div>

        <div class="two">
          <label class="field">
            <span class="label">Store Number</span>
            <input type="text" v-model="priceForm.storeNumber" />
          </label>
          <label class="field">
            <span class="label">Article Number</span>
            <input type="text" v-model="priceForm.articleNumber" />
          </label>
        </div>

        <div class="two">
          <label class="field">
            <span class="label">Amount</span>
            <input type="number" step="0.01" v-model.number="priceForm.amount" />
          </label>
          <label class="field">
            <span class="label">Type</span>
            <select v-model="priceForm.type">
              <option value="DEFAULT">DEFAULT</option>
              <option value="PROMOTION">PROMOTION</option>
              <option value="STORE">STORE</option>
            </select>
          </label>
        </div>

        <div class="two">
          <label class="field">
            <span class="label">Valid From (ISO)</span>
            <input type="text" v-model="priceForm.validFrom" placeholder="2025-01-01T00:00:00Z" />
          </label>
          <label class="field">
            <span class="label">Valid To (ISO)</span>
            <input type="text" v-model="priceForm.validTo" placeholder="2025-12-31T23:59:59Z" />
          </label>
        </div>

        <div v-if="postError.price" class="error" role="alert">{{ postError.price }}</div>
        <pre v-else-if="postResponse.price" class="out">{{ postResponse.price }}</pre>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page{max-width:1200px;margin:20px auto;padding:0 16px}
.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.brand{margin:0;font-size:22px}
.status{margin-top:6px;font-size:13px;opacity:0.85}
.right{display:flex;gap:10px;flex-wrap:wrap}
.secondary{background:#f3f3f3}

.notice{margin:10px 0 14px;padding:10px 12px;border-radius:10px;background:rgba(255,193,7,0.12);border:1px solid rgba(255,193,7,0.25)}

.grid{display:grid;grid-template-columns:1fr;gap:12px}
.box{border:1px solid rgba(0,0,0,0.10);border-radius:12px;padding:12px;background:#fff}
.box-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.box-title{margin:0;font-size:14px;letter-spacing:0.02em;color:rgba(0,0,0,0.82)}
.mini{border:none;cursor:pointer;padding:8px 10px;border-radius:999px;background:rgba(123,63,143,0.98);color:white;font-weight:700;font-size:12px}
.mini:disabled{opacity:0.6;cursor:not-allowed}

.field{display:block;margin:10px 0}
.label{display:block;font-size:12px;opacity:0.75;margin-bottom:6px}
input,select{width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.15);border-radius:10px;background:#fff}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hours{margin-top:6px}

.out{margin:10px 0 0;max-height:220px;overflow:auto;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:10px 12px}
.error{margin-top:10px;color:#b00020;background:rgba(176,0,32,0.08);border:1px solid rgba(176,0,32,0.18);padding:8px 10px;border-radius:10px;white-space:pre-wrap}

@media (max-width:520px){
  .two{grid-template-columns:1fr}
}
</style>
