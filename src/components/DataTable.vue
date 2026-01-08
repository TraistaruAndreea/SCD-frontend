<script setup>
import { computed, useSlots } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: [String, Object, null], default: null }
});

const slots = useSlots();
const hasActions = computed(() => typeof slots.actions === 'function');

const columns = computed(() => {
  const rows = Array.isArray(props.rows) ? props.rows : [];
  if (rows.length === 0) return [];

  const keys = new Set();
  for (const row of rows.slice(0, 25)) {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((k) => keys.add(k));
    }
  }
  return Array.from(keys);
});

const formatCell = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const primitives = value.filter((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    if (primitives.length === value.length) return primitives.map(String).join(', ');
    return `${value.length} items`;
  }

  if (typeof value === 'object') {
    // Common domain shapes
    if ('value' in value && 'type' in value) return `${value.value} (${value.type})`;
    if ('value' in value && 'unit' in value) return `${value.value} ${value.unit}`;

    const entries = Object.entries(value).slice(0, 3).map(([k, v]) => {
      if (v === null || v === undefined) return `${k}=null`;
      if (typeof v === 'object') return `${k}=[obj]`;
      return `${k}=${String(v)}`;
    });
    return entries.join(', ');
  }

  return String(value);
};
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 class="title">{{ title }}</h2>
      <div class="meta">
        <span v-if="loading">Loading…</span>
        <span v-else>{{ rows?.length ?? 0 }} rows</span>
      </div>
    </div>

    <div v-if="error" class="error">
      {{ typeof error === 'string' ? error : JSON.stringify(error) }}
    </div>

    <div v-if="!loading && (!rows || rows.length === 0)" class="empty">No data</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
            <th v-if="hasActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td v-for="col in columns" :key="col">
              {{ formatCell(row?.[col]) }}
            </td>
            <td v-if="hasActions" class="actions">
              <slot name="actions" :row="row" :index="idx" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:12px;padding:12px}
.panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
.title{margin:0;font-size:16px}
.meta{font-size:12px;opacity:0.8}
.table-wrap{overflow:auto;border:1px solid rgba(0,0,0,0.08);border-radius:10px}
.table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;border-bottom:1px solid rgba(0,0,0,0.06);text-align:left;white-space:nowrap}
th{position:sticky;top:0;background:#fafafa;border-bottom:1px solid rgba(0,0,0,0.10)}
.actions{white-space:nowrap}
.empty{padding:10px 2px;opacity:0.7}
.error{margin:10px 0;color:#b00020;background:rgba(176,0,32,0.08);border:1px solid rgba(176,0,32,0.18);padding:8px 10px;border-radius:10px;white-space:pre-wrap}
</style>
