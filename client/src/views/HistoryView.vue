<template>
  <div>
    <div class="page-header">
      <h1>生成练习题 · 查看历史 · 复习答题</h1>      
    </div>

    <!-- ====== 题目生成区 ====== -->
    <div class="card">
      <div class="card-title">✨ 生成新练习题</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:140px;">
          <label class="form-label">难度</label>
          <select v-model="genForm.difficulty" class="form-select">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="form-group" style="flex:2;min-width:180px;">
          <label class="form-label">主题偏好（可选）</label>
          <input v-model="genForm.topic" class="form-input" placeholder="如：员工管理、订单系统、学生成绩..." />
        </div>
        <div class="form-group">
          <button class="btn btn-primary" @click="handleGenerate" :disabled="genLoading">
            {{ genLoading ? '⏳ 生成中...' : '✨ 生成题目' }}
          </button>
        </div>
      </div>
      <div v-if="genError" class="error-banner">
        <span>⚠️ {{ genError }}</span>
        <button class="btn btn-sm btn-secondary" @click="genError = ''" style="margin-left:auto;">✕</button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="historyStore.loading && historyStore.exercises.length === 0" class="empty-state">
      <div class="icon">⏳</div>
      <div class="text">加载中...</div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="historyStore.exercises.length === 0" class="empty-state">
      <div class="icon">📭</div>
      <div class="text">暂无练习记录，在上方生成第一道题目吧</div>
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

            <!-- ====== 历史练习 SQL 输入区 ====== -->
            <div class="section">
              <div class="section-title">✏️ 试试你的 SQL</div>
              <div class="history-sql-wrap">
                <textarea
                  v-model="historyUserSql"
                  class="history-sql-input"
                  placeholder="在此输入你的 SQL 查询语句..."
                  spellcheck="false"
                ></textarea>
                <div class="history-sql-actions">
                  <button class="btn btn-sm btn-secondary" @click="handleToggleHint(ex.id)">
                    {{ hintVisible[ex.id] ? '隐藏提示' : '💡 提示' }}
                  </button>
                  <button
                    class="btn btn-sm btn-primary"
                    @click="handleHistorySubmit(ex.id)"
                    :disabled="historyValidating || !historyUserSql.trim()"
                  >
                    {{ historyValidating ? '执行中...' : '▶ 提交比对' }}
                  </button>
                </div>
              </div>

              <!-- 校验结果 -->
              <div v-if="historyResults[ex.id]" style="margin-top:12px;">
                <div v-if="!historyResults[ex.id].valid" style="color:var(--color-danger);font-size:0.85rem;padding:8px 12px;background:var(--color-danger-light);border-radius:var(--radius);">
                  ❌ {{ historyResults[ex.id].error }}
                </div>
                <div v-else style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div>
                    <div style="font-size:0.78rem;font-weight:600;color:var(--color-text-secondary);margin-bottom:4px;">
                      {{ historyResults[ex.id].isCorrect ? '✅ 你的结果（正确）' : '❌ 你的结果（不符）' }}
                    </div>
                    <DataTable :data="historyResults[ex.id].userResult || []" />
                  </div>
                  <div>
                    <div style="font-size:0.78rem;font-weight:600;color:var(--color-text-secondary);margin-bottom:4px;">预期结果</div>
                    <DataTable :data="historyResults[ex.id].expectedResult || []" />
                  </div>
                </div>
              </div>
            </div>

            <!-- ====== 参考答案（提示按钮控制显隐） ====== -->
            <div class="section" v-if="selected?.expected_sql && hintVisible[ex.id]">
              <div class="section-title">📝 参考答案</div>
              <pre class="schema-block">{{ selected?.expected_sql }}</pre>

              <!-- 预期 SQL 执行结果（可视化表格） -->
              <div v-if="expectedResultDisplay" style="margin-top:14px;">
                <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;color:var(--color-text-secondary);">
                  📊 预期执行结果
                  <span style="font-weight:400;font-size:0.78rem;margin-left:6px;">（{{ expectedResultDisplay.rows.length }} 行）</span>
                </div>
                <DataTable :data="expectedResultDisplay.rows" />
              </div>
              <p v-else-if="selected?.expectedResult === null && selected?.table_data" style="margin-top:10px;font-size:0.8rem;color:var(--color-text-muted);">
                ⚠️ 无法执行预期 SQL（语法或数据兼容性问题）
              </p>
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

    <!-- API Key 缺失提示弹窗 -->
    <Modal
      :visible="showKeyWarning"
      title="未配置 AI API Key"
      icon="🔑"
      cancel-text="稍后配置"
      confirm-text="前往配置"
      @close="showKeyWarning = false"
      @confirm="goToConfig"
    >
      <p>请先在 <strong>API 配置</strong> 页面添加并测试 DeepSeek API Key，才能生成 SQL 练习题。</p>
    </Modal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHistoryStore } from '../stores/history'
import { usePracticeStore } from '../stores/practice'
import { useConfigStore } from '../stores/config'
import HistoryCard from '../components/HistoryCard.vue'
import DataTable from '../components/DataTable.vue'
import Modal from '../components/Modal.vue'
import axios from 'axios'

const router = useRouter()
const historyStore = useHistoryStore()
const practiceStore = usePracticeStore()
const configStore = useConfigStore()

const { hasKey } = storeToRefs(configStore)
const showKeyWarning = ref(false)

// 生成题目表单
const genLoading = ref(false)
const genError = ref('')
const genForm = reactive({ difficulty: 'medium', topic: '' })

// 历史练习 SQL 输入与校验
const historyUserSql = ref('')
const historyValidating = ref(false)
const historyResults = reactive({})
const hintVisible = reactive({})

const selected = computed(() => historyStore.selectedExercise)

// 历史详情的可视化数据表（优先服务端预解析）
// 仅当至少有一张表包含实际数据行时才展示，避免空表占位
const displayHistoryTables = computed(() => {
  const tables = selected.value?.tables
  if (!tables || tables.length === 0) return []
  const hasData = tables.some(t => t.rows && t.rows.length > 0)
  return hasData ? tables : []
})

// 预期 SQL 执行结果（服务端返回的 { columns, rows }）
const expectedResultDisplay = computed(() => {
  const er = selected.value?.expectedResult
  if (!er || !er.rows || er.rows.length === 0) return null
  return er
})

onMounted(async () => {
  await configStore.fetchConfigs()
  historyStore.fetchList()
})

async function handleGenerate() {
  if (!hasKey.value) { showKeyWarning.value = true; return }
  genLoading.value = true
  genError.value = ''
  try {
    await practiceStore.generateExercise(genForm.difficulty, genForm.topic)
    await historyStore.fetchList()
  } catch (err) {
    genError.value = practiceStore.error || err.message || '生成失败'
  } finally {
    genLoading.value = false
  }
}

function goToConfig() { showKeyWarning.value = false; router.push('/config') }

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

function handleToggleHint(id) {
  hintVisible[id] = !hintVisible[id]
}

async function handleHistorySubmit(exerciseId) {
  if (!historyUserSql.value.trim()) return
  const ex = historyStore.selectedExercise
  if (!ex || ex.id !== exerciseId) return

  historyValidating.value = true
  try {
    const { data } = await axios.post('/api/practice/validate', {
      exerciseId,
      userSql: historyUserSql.value.trim(),
      tableData: ex.table_data || '',
    })
    historyResults[exerciseId] = data.validation
  } catch (err) {
    const msg = err.response?.data?.error || err.message
    historyResults[exerciseId] = { valid: false, error: msg }
  } finally {
    historyValidating.value = false
  }
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

/* ====== 历史 SQL 输入区 ====== */
.history-sql-wrap {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.history-sql-input {
  width: 100%;
  min-height: 100px;
  padding: 12px 14px 44px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.6;
  background: var(--color-code-bg);
  color: var(--color-code-text);
  tab-size: 2;
}

.history-sql-input::placeholder {
  color: #64748b;
}

.history-sql-actions {
  position: absolute;
  bottom: 8px;
  right: 10px;
  display: flex;
  gap: 6px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 16px;
  background: var(--color-danger-light);
  border: 1px solid #fecaca;
  border-radius: var(--radius);
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
