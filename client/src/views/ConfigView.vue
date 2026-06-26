<template>
  <div>
    <div class="page-header">
      <h1>API 配置</h1>
      <p>管理多个API Key，支持按名称区分不同用途</p>
    </div>

    <!-- Key 列表 -->
    <div v-if="configStore.configs.length > 0" class="key-list">
      <div
        v-for="cfg in configStore.configs"
        :key="cfg.id"
        class="card key-card"
        :class="{ 'key-active': cfg.is_active }"
      >
        <div class="key-card-header">
          <div class="key-card-title">
            <span v-if="cfg.is_active" class="badge badge-success" style="margin-right:6px;">激活</span>
            <strong>{{ cfg.name }}</strong>
          </div>
          <div class="key-card-actions">
            <button
              v-if="!cfg.is_active"
              class="btn btn-sm btn-primary"
              @click="handleActivate(cfg.id)"
            >启用</button>
            <button class="btn btn-sm btn-secondary" @click="openEdit(cfg)">编辑</button>
            <button class="btn btn-sm btn-secondary" @click="handleTest(cfg.id)">测试</button>
            <button class="btn btn-sm btn-danger" @click="handleDelete(cfg.id)">删除</button>
          </div>
        </div>
        <div class="key-card-body">
          <div class="key-info-row">
            <span class="key-info-label">Key</span>
            <code class="key-info-value">{{ cfg.masked_key }}</code>
          </div>
          <div class="key-info-row">
            <span class="key-info-label">接口</span>
            <code class="key-info-value key-path">{{ cfg.base_url }}</code>
          </div>
          <div class="key-info-row">
            <span class="key-info-label">模型</span>
            <code class="key-info-value">{{ cfg.model }}</code>
          </div>
        </div>
        <!-- 测试结果 -->
        <div
          v-if="testResults[cfg.id]"
          :class="['config-status', testResults[cfg.id].ok ? 'connected' : 'disconnected']"
        >
          <span>{{ testResults[cfg.id].ok ? '✅' : '❌' }}</span>
          <span>{{ testResults[cfg.id].message }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="card" style="text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:10px;">🔑</div>
      <div style="font-weight:600;font-size:0.95rem;margin-bottom:4px;">尚未添加 API Key</div>
      <div style="color:var(--color-text-secondary);font-size:0.85rem;">在下方添加你的第一个 DeepSeek API Key</div>
    </div>

    <!-- 添加 / 编辑表单 -->
    <div class="card">
      <div class="card-title">{{ editingId ? '✏️ 编辑 Key' : '➕ 添加新 Key' }}</div>
      <div class="form-group">
        <label class="form-label">名称（用于区分不同 Key）</label>
        <input v-model="form.name" class="form-input" placeholder="如：个人账号、公司账号、测试用..." />
      </div>
      <div class="form-group">
        <label class="form-label">API Key</label>
        <input v-model="form.api_key" type="password" class="form-input" placeholder="sk-..." :style="{ fontFamily: 'var(--font-mono)' }" />
      </div>
      <div class="form-group">
        <label class="form-label">Base URL</label>
        <input v-model="form.base_url" class="form-input" placeholder="https://api.deepseek.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Model</label>
        <select v-model="form.model" class="form-select">
          <option value="deepseek-chat">deepseek-chat</option>
          <option value="deepseek-reasoner">deepseek-reasoner</option>
        </select>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" @click="handleSave" :disabled="configStore.loading">
          {{ editingId ? '更新' : '添加' }}
        </button>
        <button v-if="editingId" class="btn btn-secondary" @click="cancelEdit">取消编辑</button>
      </div>
    </div>

    <!-- 存储路径 -->
    <div class="card">
      <div class="card-title">💾 配置文件存储路径</div>
      <code class="storage-path-display">{{ configStore.storagePath }}</code>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const editingId = ref(null)
const testResults = ref({})
const form = reactive({ name: '', api_key: '', base_url: 'https://api.deepseek.com', model: 'deepseek-chat' })

onMounted(() => { configStore.fetchConfigs() })

function resetForm() {
  editingId.value = null
  form.name = ''
  form.api_key = ''
  form.base_url = 'https://api.deepseek.com'
  form.model = 'deepseek-chat'
}

function openEdit(cfg) {
  editingId.value = cfg.id
  form.name = cfg.name
  form.api_key = ''
  form.base_url = cfg.base_url
  form.model = cfg.model
}

function cancelEdit() { resetForm() }

async function handleSave() {
  if (!form.api_key.trim()) return alert('API Key 不能为空')
  if (!form.name.trim()) return alert('请填写 Key 名称')
  if (editingId.value) {
    await configStore.updateConfig(editingId.value, { ...form })
  } else {
    await configStore.addConfig({ ...form })
  }
  resetForm()
}

async function handleDelete(id) {
  if (!confirm('确定删除这个 Key 吗？')) return
  await configStore.deleteConfig(id)
}

async function handleActivate(id) {
  await configStore.activateConfig(id)
}

async function handleTest(id) {
  const result = await configStore.testConnection(id)
  testResults.value = { ...testResults.value, [id]: result }
}
</script>

<style scoped>
.key-list { display: flex; flex-direction: column; gap: 14px; }

.key-card { padding: 18px 20px; }
.key-card.key-active { border-left: 3px solid var(--color-success); }

.key-card-header {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 10px; margin-bottom: 12px;
}
.key-card-title { font-size: 0.95rem; display: flex; align-items: center; }
.key-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.key-card-body { margin-bottom: 8px; }

.key-info-row {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 0; font-size: 0.85rem;
}
.key-info-label { color: var(--color-text-secondary); min-width: 40px; font-weight: 500; }
.key-info-value {
  font-family: var(--font-mono); font-size: 0.82rem;
  background: var(--color-bg); padding: 3px 8px; border-radius: 4px;
}
.key-path { font-size: 0.76rem; word-break: break-all; color: var(--color-text-secondary); }

.storage-path-display {
  display: block; font-family: var(--font-mono); font-size: 0.8rem;
  background: var(--color-bg); padding: 10px 14px; border-radius: var(--radius);
  word-break: break-all; color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .key-card-actions { width: 100%; }
  .key-card-actions .btn { flex: 1; justify-content: center; }
}
</style>
