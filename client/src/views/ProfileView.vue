<template>
  <div>
    <div class="page-header">
      <h1>个人中心</h1>
      <p>学习概览 · API 配置 · 练习足迹</p>
    </div>

    <!-- ====== 统计卡片行 ====== -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">{{ stats.totalExercises }}</div>
        <div class="stat-label">生成题目</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✏️</div>
        <div class="stat-value">{{ stats.totalAttempts }}</div>
        <div class="stat-label">答题次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ stats.correctAttempts }}</div>
        <div class="stat-label">回答正确</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">{{ stats.accuracy }}<span class="stat-unit">%</span></div>
        <div class="stat-label">正确率</div>
      </div>
    </div>

    <!-- ====== API Key 状态卡片 ====== -->
    <div class="card profile-config-card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
        <div class="config-status-dot" :class="configStore.hasAnyKey ? 'active' : 'inactive'"></div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:0.95rem;">DeepSeek API</div>
          <div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:2px;">
            {{ configStore.hasAnyKey ? configStore.configs.length + ' 个 Key 已配置' : '未配置 — 请先添加 API Key' }}
          </div>
        </div>
        <router-link to="/config" class="btn btn-sm" :class="configStore.hasAnyKey ? 'btn-secondary' : 'btn-primary'">
          {{ configStore.hasAnyKey ? '管理' : '去配置' }}
        </router-link>
      </div>
      <!-- 已配置的 Key 列表 -->
      <div v-if="configStore.configs.length > 0" class="profile-key-list">
        <div v-for="cfg in configStore.configs" :key="cfg.id" class="profile-key-item">
          <span v-if="cfg.is_active" class="badge badge-success" style="margin-right:6px;">激活</span>
          <span style="font-weight:500;font-size:0.85rem;">{{ cfg.name }}</span>
          <code style="font-size:0.78rem;color:var(--color-text-muted);margin-left:8px;">{{ cfg.masked_key }}</code>
        </div>
      </div>
    </div>

    <!-- ====== 最近练习 ====== -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title" style="margin-bottom:0;">📋 最近练习</div>
        <router-link to="/history" class="btn btn-sm btn-secondary">查看全部</router-link>
      </div>

      <!-- 加载 / 空状态 -->
      <div v-if="loading" class="empty-state" style="padding:24px;">
        <div class="icon">⏳</div>
        <div class="text">加载中...</div>
      </div>
      <div v-else-if="recentExercises.length === 0" class="empty-state" style="padding:24px;">
        <div class="icon">📭</div>
        <div class="text">还没有练习记录</div>
        <router-link to="/history" class="btn btn-primary btn-sm" style="margin-top:12px;">开始练习</router-link>
      </div>

      <!-- 列表 -->
      <div v-else class="profile-exercise-list">
        <div
          v-for="ex in recentExercises"
          :key="ex.id"
          class="profile-exercise-item"
        >
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ ex.title || 'SQL 练习题' }}
            </div>
            <div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ ex.requirements || '暂无描述' }}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span :class="['badge', difficultyClass(ex.difficulty)]">
              {{ difficultyLabel(ex.difficulty) }}
            </span>
            <span style="font-size:0.75rem;color:var(--color-text-muted);white-space:nowrap;">
              {{ ex.attempt_count || 0 }} 次答题
            </span>
            <span style="font-size:0.75rem;color:var(--color-text-muted);white-space:nowrap;">
              {{ formatDate(ex.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ====== 分页控件 ====== -->
      <div v-if="totalCount > 0" class="pagination-bar">
        <div class="pagination-info">
          共 {{ totalCount }} 条，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
        <div class="pagination-controls">
          <select class="form-select" style="width:auto;" :value="pageSize" @change="changePageSize(Number($event.target.value))">
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }} 条/页</option>
          </select>
          <button class="btn btn-sm btn-secondary" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">◀ 上一页</button>
          <button class="btn btn-sm btn-secondary" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">下一页 ▶</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { useHistoryStore } from '../stores/history'
import axios from 'axios'

const configStore = useConfigStore()
const historyStore = useHistoryStore()

const loading = ref(false)
const stats = ref({ totalExercises: 0, totalAttempts: 0, correctAttempts: 0, accuracy: 0 })
const recentExercises = ref([])

// 分页
const pageSize = ref(5)
const currentPage = ref(1)
const totalCount = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const pageSizeOptions = [5, 10, 15, 20]

onMounted(async () => {
  await configStore.fetchConfigs()
  await fetchExercises()
})

async function fetchExercises() {
  loading.value = true
  const offset = (currentPage.value - 1) * pageSize.value
  try {
    const [statsRes, listRes] = await Promise.all([
      axios.get('/api/history/stats'),
      axios.get('/api/history', { params: { limit: pageSize.value, offset } }),
    ])
    stats.value = statsRes.data
    recentExercises.value = listRes.data || []
    totalCount.value = stats.value.totalExercises
  } catch (err) {
    console.error('[Profile] 加载数据失败:', err)
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchExercises()
}

function changePageSize(size) {
  pageSize.value = size
  currentPage.value = 1
  fetchExercises()
}

function difficultyLabel(d) {
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || '中等'
}

function difficultyClass(d) {
  return { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-error' }[d] || 'badge-warning'
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str + 'Z')
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
/* ====== 统计卡片 ====== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 1.6rem;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-unit {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* ====== API 配置状态 ====== */
.profile-config-card {
  border-left: 3px solid var(--color-primary);
}

.config-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.config-status-dot.active {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.35);
}

.config-status-dot.inactive {
  background: var(--color-text-muted);
  box-shadow: 0 0 6px rgba(156, 163, 175, 0.3);
}

/* ====== 练习列表 ====== */
.profile-exercise-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 14px;
}

.profile-exercise-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: var(--radius);
  transition: background 0.15s;
  cursor: pointer;
}

.profile-exercise-item:hover {
  background: var(--color-bg);
}

.profile-exercise-item + .profile-exercise-item {
  border-top: 1px solid #f1f3f5;
}

/* ====== Key 列表 ====== */
.profile-key-list {
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}
.profile-key-item {
  display: flex; align-items: center; padding: 4px 0; font-size: 0.85rem;
}

/* ====== 分页 ====== */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .profile-exercise-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
