<template>
  <div>
    <div class="page-header">
      <h1>SQL 练习</h1>
      <p>生成练习题，编写 SQL 语句，校验结果并获取调优建议</p>
    </div>

    <!-- 题目生成区 — 始终可见 -->
    <div class="card">
      <div class="card-title">{{ practiceStore.currentExercise ? '⚙️ 生成新题目' : '✨ 生成练习题' }}</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div class="form-group" style="flex:1;min-width:140px;">
          <label class="form-label">难度</label>
          <select v-model="generateForm.difficulty" class="form-select">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="form-group" style="flex:2;min-width:180px;">
          <label class="form-label">主题偏好（可选）</label>
          <input
            v-model="generateForm.topic"
            class="form-input"
            placeholder="如：员工管理、订单系统、学生成绩..."
          />
        </div>
        <div class="form-group">
          <button
            class="btn btn-primary"
            @click="handleGenerate"
            :disabled="practiceStore.generating"
          >
            {{ practiceStore.generating ? '⏳ 生成中...' : '✨ 生成题目' }}
          </button>
        </div>
      </div>
      <!-- 错误提示 — 高可见性 -->
      <div v-if="practiceStore.error" class="error-banner">
        <span>⚠️ {{ practiceStore.error }}</span>
        <button class="btn btn-sm btn-secondary" @click="practiceStore.error = ''" style="margin-left:auto;">✕</button>
      </div>
    </div>

    <!-- ==================== 练习内容区 ==================== -->
    <template v-if="practiceStore.currentExercise">
      <!-- 题目标题栏 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span :class="['badge', exerciseBadgeClass]">{{ difficultyLabel }}</span>
          <span style="font-weight:600;font-size:1.1rem;">{{ practiceStore.currentExercise.title }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="handleReset">↻ 换一题</button>
      </div>

      <!-- 练习要求 -->
      <div class="card">
        <div class="card-title">📋 练习要求</div>
        <p style="font-size:0.9rem;white-space:pre-wrap;line-height:1.7;">
          {{ practiceStore.currentExercise.requirements || '（无额外要求，请根据数据表和预期结果编写 SQL）' }}
        </p>
      </div>

      <!-- 数据表可视化 — 优先使用服务端预解析数据 -->
      <div class="card">
        <div class="card-title">📊 数据表</div>
        <!-- DDL 建表语句 -->
        <details style="margin-bottom:16px;">
          <summary style="cursor:pointer;font-size:0.85rem;color:var(--color-text-secondary);font-weight:500;">
            查看建表语句 (DDL)
          </summary>
          <pre style="background:var(--color-code-bg);color:var(--color-code-text);padding:14px;border-radius:var(--radius);font-family:var(--font-mono);font-size:0.8rem;overflow-x:auto;margin-top:8px;">{{ practiceStore.currentExercise.table_schema }}</pre>
        </details>

        <!-- 表数据 -->
        <div v-if="displayTables.length > 0">
          <div v-for="(tbl, idx) in displayTables" :key="idx" style="margin-bottom:20px;">
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:8px;color:var(--color-text-secondary);">
              📌 表: <code style="background:var(--color-primary-light);padding:2px 8px;border-radius:4px;">{{ tbl.name }}</code>
              <span style="font-weight:400;font-size:0.8rem;margin-left:6px;">（{{ tbl.rows.length }} 行）</span>
            </div>
            <DataTable :data="tbl.rows" />
          </div>
        </div>
        <div v-else style="text-align:center;color:var(--color-text-muted);padding:20px;font-size:0.85rem;">
          ⚠️ 数据表加载中或解析失败 — 请查看上方 DDL 了解表结构
        </div>
      </div>

      <!-- 书写要点 -->
      <div v-if="practiceStore.currentExercise.key_points" class="card">
        <div class="card-title">💡 书写要点</div>
        <pre style="font-size:0.875rem;white-space:pre-wrap;line-height:1.7;">{{ practiceStore.currentExercise.key_points }}</pre>
      </div>

      <!-- 预期结果描述 -->
      <div v-if="practiceStore.currentExercise.expected_result_desc" class="card">
        <div class="card-title">🎯 预期结果描述</div>
        <p style="font-size:0.9rem;line-height:1.7;">{{ practiceStore.currentExercise.expected_result_desc }}</p>
      </div>

      <!-- SQL 编辑器 -->
      <div class="card">
        <div class="card-title">✏️ 编写 SQL</div>
        <SqlEditor v-model="practiceStore.userSql" placeholder="在此输入你的 SQL 查询语句，例如：&#10;SELECT * FROM employees WHERE salary > 5000;" />
        <div class="btn-group" style="margin-top:12px;">
          <button
            class="btn btn-primary"
            @click="handleValidate"
            :disabled="practiceStore.loading || !practiceStore.userSql.trim()"
          >
            {{ practiceStore.loading ? '⏳ 执行中...' : '▶ 校验执行' }}
          </button>
          <button
            v-if="practiceStore.validationResult?.isCorrect"
            class="btn btn-success"
            @click="handleOptimize"
            :disabled="practiceStore.optimizing"
          >
            {{ practiceStore.optimizing ? '⏳ 获取中...' : '🔧 获取调优建议' }}
          </button>
          <button
            class="btn btn-secondary"
            @click="practiceStore.userSql = ''"
            :disabled="!practiceStore.userSql"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 校验结果面板 -->
      <div v-if="practiceStore.validationResult" class="card">
        <div class="card-title">📋 校验结果</div>
        <ResultPanel :result="practiceStore.validationResult" />
      </div>

      <!-- 调优建议 -->
      <div v-if="practiceStore.optimizationSuggestions.length > 0" class="card">
        <div class="card-title">🔧 SQL 调优建议</div>
        <div
          v-for="(item, idx) in practiceStore.optimizationSuggestions"
          :key="idx"
          class="suggestion-card"
        >
          <div class="issue">{{ idx + 1 }}. {{ item.issue }}</div>
          <div class="suggestion">💡 建议: {{ item.suggestion }}</div>
          <div class="explanation">📖 解释: {{ item.explanation }}</div>
        </div>
      </div>
    </template>

    <!-- 无练习题时的引导状态 -->
    <div v-else class="card" style="text-align:center;">
      <div style="font-size:3rem;margin-bottom:12px;">📝</div>
      <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">还没有练习题</div>
      <div style="color:var(--color-text-secondary);font-size:0.85rem;">
        在上方选择难度和主题，点击「✨ 生成题目」开始练习
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePracticeStore } from '../stores/practice'
import { useConfigStore } from '../stores/config'
import SqlEditor from '../components/SqlEditor.vue'
import DataTable from '../components/DataTable.vue'
import ResultPanel from '../components/ResultPanel.vue'
import Modal from '../components/Modal.vue'

const router = useRouter()
const practiceStore = usePracticeStore()
const configStore = useConfigStore()

const showKeyWarning = ref(false)

const generateForm = reactive({
  difficulty: 'medium',
  topic: '',
})

const difficultyLabel = computed(() => {
  const d = practiceStore.currentExercise?.difficulty
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || '中等'
})

const exerciseBadgeClass = computed(() => {
  const d = practiceStore.currentExercise?.difficulty
  return { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-error' }[d] || 'badge-warning'
})

// 优先使用服务端预解析的表数据；降级到前端手动解析
const displayTables = computed(() => {
  if (practiceStore.tables?.length > 0) {
    return practiceStore.tables
  }
  // 降级：前端手动解析 INSERT 语句
  if (practiceStore.tableData) {
    return parseTableData(practiceStore.tableData)
  }
  return []
})

onMounted(async () => {
  await configStore.fetchConfig()
})

async function handleGenerate() {
  // 校验 DeepSeek API Key 是否已配置
  if (!configStore.hasKey) {
    showKeyWarning.value = true
    return
  }
  try {
    await practiceStore.generateExercise(generateForm.difficulty, generateForm.topic)
  } catch {
    // error handled in store
  }
}

function goToConfig() {
  showKeyWarning.value = false
  router.push('/config')
}

async function handleValidate() {
  await practiceStore.validateSql()
}

async function handleOptimize() {
  await practiceStore.getOptimization()
}

function handleReset() {
  practiceStore.reset()
}

// ==================== 降级：前端手动解析 INSERT 语句 ====================

function parseTableData(sqlText) {
  const tableMap = {}

  // 支持多种 INSERT 格式：单行 VALUES (v1,v2)、多行 VALUES (v1,v2),(v3,v4)
  const insertRegex = /INSERT\s+INTO\s+`?(\w+)`?\s*(?:\([^)]*\))?\s*VALUES\s*(\([^;]+\))\s*;?/gi
  let match
  while ((match = insertRegex.exec(sqlText)) !== null) {
    const tableName = match[1]
    const valuesBlock = match[2]

    if (!tableMap[tableName]) {
      tableMap[tableName] = []
    }

    // 拆分为单个值元组: (1,'a'),(2,'b') → ['(1,\'a\')', '(2,\'b\')']
    const tuples = splitValueTuples(valuesBlock)
    for (const tuple of tuples) {
      const values = splitValues(tuple)
      tableMap[tableName].push(values)
    }
  }

  // 从 CREATE TABLE 提取列名
  const columnMap = extractColumns(practiceStore.currentExercise?.table_schema || '')

  return Object.entries(tableMap).map(([name, rawRows]) => {
    const cols = columnMap[name] || []
    const rows = rawRows.map(row => {
      const obj = {}
      if (cols.length > 0) {
        cols.forEach((col, i) => { obj[col] = row[i] ?? '' })
      } else {
        // 无列名时使用 col_0, col_1 ...
        row.forEach((val, i) => { obj[`col_${i}`] = val })
      }
      return obj
    })
    return { name, columns: cols, rows }
  })
}

function splitValueTuples(block) {
  const tuples = []
  let depth = 0
  let start = -1
  for (let i = 0; i < block.length; i++) {
    const ch = block[i]
    if (ch === '(') {
      if (depth === 0) start = i
      depth++
    } else if (ch === ')') {
      depth--
      if (depth === 0 && start >= 0) {
        tuples.push(block.slice(start + 1, i))
        start = -1
      }
    }
  }
  return tuples
}

function splitValues(tuple) {
  const values = []
  let current = ''
  let inString = false
  let depth = 0
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i]
    if (ch === "'" && !inString) {
      inString = true
      current += ch
    } else if (ch === "'" && inString) {
      // 处理转义引号 ''
      if (i + 1 < tuple.length && tuple[i + 1] === "'") {
        current += "''"
        i++
      } else {
        inString = false
        current += ch
      }
    } else if (!inString && ch === '(') {
      depth++
      current += ch
    } else if (!inString && ch === ')') {
      depth--
      current += ch
    } else if (!inString && depth === 0 && ch === ',') {
      values.push(parseValue(current.trim()))
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) {
    values.push(parseValue(current.trim()))
  }
  return values
}

function parseValue(v) {
  // 去掉首尾引号
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1).replace(/''/g, "'")
  }
  const num = Number(v)
  return isNaN(num) ? v : num
}

function extractColumns(ddl) {
  const map = {}
  const createRegex = /CREATE\s+TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*;/gi
  let match
  while ((match = createRegex.exec(ddl)) !== null) {
    const tableName = match[1]
    const body = match[2]
    const cols = body
      .split(',')
      .map(s => s.trim())
      .filter(s => {
        const upper = s.toUpperCase()
        return s && !upper.startsWith('PRIMARY') && !upper.startsWith('FOREIGN')
          && !upper.startsWith('UNIQUE') && !upper.startsWith('CHECK')
          && !upper.startsWith('CONSTRAINT')
      })
      .map(s => s.split(/\s+/)[0].replace(/`/g, ''))
      .filter(c => c && c !== '')
    map[tableName] = cols
  }
  return map
}
</script>

<style scoped>
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

code {
  font-family: var(--font-mono);
}
</style>
