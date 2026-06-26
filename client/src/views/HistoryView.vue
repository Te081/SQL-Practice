<template>
  <div>
    <div class="page-header">
      <h1>历史记录</h1>
      <p>查看做过的练习题及答题详情</p>
    </div>

    <!-- 加载中 -->
    <div v-if="historyStore.loading && historyStore.exercises.length === 0" class="empty-state">
      <div class="icon">⏳</div>
      <div class="text">加载中...</div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="historyStore.exercises.length === 0" class="empty-state">
      <div class="icon">📭</div>
      <div class="text">暂无练习记录，去练习页面生成题目吧</div>
    </div>

    <!-- 历史列表 -->
    <div v-else class="history-list">
      <div v-for="ex in historyStore.exercises" :key="ex.id" style="position:relative;">
        <HistoryCard
          :exercise="ex"
          @select="handleSelect(ex)"
        />

        <!-- 展开详情 -->
        <div v-if="historyStore.selectedExercise?.id === ex.id" class="card" style="margin-top:-12px;border-top-left-radius:0;border-top-right-radius:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="card-title" style="margin-bottom:0;">📋 题目详情</div>
            <button class="btn btn-danger btn-sm" @click="handleDelete(ex.id)">删除记录</button>
          </div>

          <!-- 数据表 -->
          <div class="history-detail">
            <div class="section">
              <div class="section-title">数据表结构 (DDL)</div>
              <pre class="schema-block">{{ formatSchema(selected?.table_schema) }}</pre>
            </div>

            <!-- 可视化数据表 -->
            <div class="section" v-if="displayHistoryTables.length > 0">
              <div class="section-title">📊 数据表预览</div>
              <div v-for="(tbl, idx) in displayHistoryTables" :key="idx" style="margin-bottom:20px;">
                <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;color:var(--color-text-secondary);">
                  📌 {{ tbl.name }}
                  <span style="font-weight:400;font-size:0.78rem;margin-left:6px;">（{{ tbl.rows.length }} 行）</span>
                </div>
                <DataTable :data="tbl.rows" />
              </div>
            </div>
            <div class="section" v-else>
              <div class="section-title">📊 数据表预览</div>
              <p style="font-size:0.85rem;color:var(--color-text-muted);">
                {{ selected?.table_data ? '⚠️ 数据解析失败，请查看上方 DDL 了解表结构' : '（无测试数据 — 仅包含建表语句）' }}
              </p>
            </div>

            <div class="section">
              <div class="section-title">练习要求</div>
              <p style="font-size:0.875rem;white-space:pre-wrap;">{{ selected?.requirements }}</p>
            </div>

            <div class="section" v-if="selected?.key_points">
              <div class="section-title">书写要点</div>
              <pre style="font-size:0.85rem;white-space:pre-wrap;">{{ selected?.key_points }}</pre>
            </div>

            <div class="section" v-if="selected?.expected_result_desc">
              <div class="section-title">预期结果描述</div>
              <p style="font-size:0.875rem;">{{ selected?.expected_result_desc }}</p>
            </div>

            <div class="section" v-if="selected?.expected_sql">
              <div class="section-title">参考答案</div>
              <pre style="background:var(--color-code-bg);color:var(--color-code-text);padding:12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:0.8rem;overflow-x:auto;">{{ selected?.expected_sql }}</pre>
            </div>

            <!-- 答题记录 -->
            <div class="section" v-if="selected?.attempts?.length > 0">
              <div class="section-title">答题记录 ({{ selected.attempts.length }})</div>
              <div v-for="(att, ai) in selected.attempts" :key="att.id"
                   style="border:1px solid var(--color-border);border-radius:var(--radius);padding:14px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span :class="['badge', att.is_correct ? 'badge-success' : 'badge-error']">
                    {{ att.is_correct ? '✅ 正确' : '❌ 错误' }}
                  </span>
                  <span style="font-size:0.8rem;color:var(--color-text-muted);">
                    {{ formatTime(att.created_at) }}
                  </span>
                </div>
                <pre style="background:var(--color-code-bg);color:var(--color-code-text);padding:10px;border-radius:var(--radius);font-family:var(--font-mono);font-size:0.8rem;overflow-x:auto;">{{ att.user_sql }}</pre>

                <div v-if="att.optimization_suggestions?.length > 0" style="margin-top:10px;">
                  <div class="section-title">调优建议</div>
                  <div v-for="(sug, si) in att.optimization_suggestions" :key="si" class="suggestion-card">
                    <div class="issue">{{ si + 1 }}. {{ sug.issue }}</div>
                    <div class="suggestion">💡 {{ sug.suggestion }}</div>
                    <div class="explanation">📖 {{ sug.explanation }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useHistoryStore } from '../stores/history'
import HistoryCard from '../components/HistoryCard.vue'
import DataTable from '../components/DataTable.vue'

const historyStore = useHistoryStore()

const selected = computed(() => historyStore.selectedExercise)

// 历史详情的可视化数据表（优先服务端预解析）
// 仅当至少有一张表包含实际数据行时才展示，避免空表占位
const displayHistoryTables = computed(() => {
  const tables = selected.value?.tables
  if (!tables || tables.length === 0) return []
  const hasData = tables.some(t => t.rows && t.rows.length > 0)
  return hasData ? tables : []
})

onMounted(() => {
  historyStore.fetchList()
})

async function handleSelect(exercise) {
  if (historyStore.selectedExercise?.id === exercise.id) {
    historyStore.clearSelection()
    return
  }
  await historyStore.fetchDetail(exercise.id)
}

async function handleDelete(id) {
  if (!confirm('确定删除这条记录吗？')) return
  await historyStore.deleteRecord(id)
}

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str + 'Z')
  return d.toLocaleString('zh-CN')
}

/**
 * 将 DDL 文本按 CREATE 关键字拆分为多行，每条建表语句独立一行
 */
function formatSchema(schema) {
  if (!schema) return ''
  // 先按分号拆分，去除空段，再重新拼接
  return schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .join(';\n\n')
    + ';'
}
</script>

<style scoped>
.schema-block {
  background: var(--color-code-bg);
  color: var(--color-code-text);
  padding: 12px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
