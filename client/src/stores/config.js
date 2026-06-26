import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useConfigStore = defineStore('config', () => {
  const apiKey = ref('')
  const maskedKey = ref('')
  const baseUrl = ref('https://api.deepseek.com')
  const model = ref('deepseek-chat')
  const hasKey = ref(false)
  const storagePath = ref('')
  const connectionStatus = ref(null) // { ok, message }
  const loading = ref(false)

  async function fetchConfig() {
    try {
      const { data } = await axios.get('/api/config')
      apiKey.value = data.api_key || ''
      maskedKey.value = data.masked_key || ''
      baseUrl.value = data.base_url || 'https://api.deepseek.com'
      model.value = data.model || 'deepseek-chat'
      hasKey.value = data.has_key || false
      storagePath.value = data.storage_path || ''
    } catch (err) {
      console.error('获取配置失败:', err)
    }
  }

  async function saveConfig(key, url, mdl) {
    loading.value = true
    try {
      const { data } = await axios.put('/api/config', {
        api_key: key,
        base_url: url,
        model: mdl,
      })
      hasKey.value = true
      return data
    } finally {
      loading.value = false
    }
  }

  async function testConnection() {
    loading.value = true
    try {
      const { data } = await axios.post('/api/config/test')
      connectionStatus.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function deleteConfig() {
    loading.value = true
    try {
      const { data } = await axios.delete('/api/config')
      hasKey.value = false
      maskedKey.value = ''
      connectionStatus.value = null
      return data
    } finally {
      loading.value = false
    }
  }

  return {
    apiKey,
    maskedKey,
    baseUrl,
    model,
    hasKey,
    storagePath,
    connectionStatus,
    loading,
    fetchConfig,
    saveConfig,
    testConnection,
    deleteConfig,
  }
})
