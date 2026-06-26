<template>
  <div>
    <div class="page-header">
      <h1>API 配置</h1>
      <p>配置 DeepSeek API 连接参数，用于生成 SQL 练习题和调优建议</p>
    </div>

    <div class="card">
      <div class="card-title">DeepSeek API 设置</div>

      <div class="form-group">
        <label class="form-label">API Key</label>
        <input
          v-model="form.apiKey"
          type="password"
          class="form-input"
          placeholder="sk-..."
          :style="{ fontFamily: 'var(--font-mono)' }"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Base URL</label>
        <input
          v-model="form.baseUrl"
          type="text"
          class="form-input"
          placeholder="https://api.deepseek.com"
        />
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
          {{ configStore.loading ? '保存中...' : '保存配置' }}
        </button>
        <button class="btn btn-secondary" @click="handleTest" :disabled="configStore.loading">
          测试连接
        </button>
      </div>

      <div
        v-if="configStore.connectionStatus"
        :class="['config-status', configStore.connectionStatus.ok ? 'connected' : 'disconnected']"
      >
        <span>{{ configStore.connectionStatus.ok ? '✅' : '❌' }}</span>
        <span>{{ configStore.connectionStatus.message }}</span>
      </div>
    </div>

    <!-- 已配置 Key 信息卡片 -->
    <div v-if="configStore.hasKey" class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title" style="margin-bottom:0;">🔑 当前 API Key</div>
        <button class="btn btn-danger btn-sm" @click="handleDeleteKey" :disabled="configStore.loading">
          {{ configStore.loading ? '删除中...' : '删除 Key' }}
        </button>
      </div>
      <div class="key-info-row" style="margin-top:14px;">
        <span class="key-info-label">脱敏显示</span>
        <code class="key-info-value">{{ configStore.maskedKey }}</code>
      </div>
      <div class="key-info-row">
        <span class="key-info-label">存储路径</span>
        <code class="key-info-value key-path">{{ configStore.storagePath }}</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const form = reactive({
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
})

onMounted(async () => {
  await configStore.fetchConfig()
  form.apiKey = ''
  form.baseUrl = configStore.baseUrl
  form.model = configStore.model
})

async function handleSave() {
  await configStore.saveConfig(form.apiKey, form.baseUrl, form.model)
  configStore.connectionStatus = { ok: true, message: '配置已保存' }
}

async function handleTest() {
  // 测试前先保存当前配置
  if (form.apiKey) {
    await configStore.saveConfig(form.apiKey, form.baseUrl, form.model)
  }
  await configStore.testConnection()
}

async function handleDeleteKey() {
  if (!confirm('确定要删除已保存的 API Key 吗？删除后需重新配置才能使用 AI 功能。')) return
  await configStore.deleteConfig()
  form.apiKey = ''
}
</script>

<style scoped>
.key-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.key-info-row:last-child {
  border-bottom: none;
}

.key-info-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 72px;
}

.key-info-value {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.key-path {
  font-size: 0.78rem;
  word-break: break-all;
  color: var(--color-text-secondary);
}
</style>
