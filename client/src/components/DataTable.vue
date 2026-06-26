<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length || 1" class="empty-cell">
            暂无数据
          </td>
        </tr>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td v-for="col in columns" :key="col">{{ formatCell(row[col]) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const columns = computed(() => {
  if (!props.data || !props.data.length) return []
  const first = props.data[0]
  if (!first || typeof first !== 'object') return []
  return Object.keys(first)
})

const rows = computed(() => {
  if (!props.data) return []
  return props.data.filter(r => r && typeof r === 'object')
})

function formatCell(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<style scoped>
.empty-cell {
  text-align: center;
  color: var(--color-text-muted);
  padding: 20px;
}
</style>
