import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useConfigStore = defineStore('config', () => {
  const configs = ref([])
  const storagePath = ref('')
  const hasAnyKey = ref(false)
  const loading = ref(false)

  const activeConfig = computed(() => configs.value.find(c => c.is_active) || null)
  const hasKey = computed(() => hasAnyKey.value)

  async function fetchConfigs() {
    try {
      const { data } = await axios.get('/api/config')
      configs.value = data.configs || []
      hasAnyKey.value = data.has_any_key || false
      storagePath.value = data.storage_path || ''
    } catch (err) {
      console.error('获取配置失败:', err)
    }
  }

  async function addConfig({ name, api_key, base_url, model }) {
    loading.value = true
    try {
      const { data } = await axios.post('/api/config', { name, api_key, base_url, model })
      await fetchConfigs()
      return data.entry
    } finally {
      loading.value = false
    }
  }

  async function updateConfig(id, { name, api_key, base_url, model }) {
    loading.value = true
    try {
      const { data } = await axios.put(`/api/config/${id}`, { name, api_key, base_url, model })
      await fetchConfigs()
      return data.entry
    } finally {
      loading.value = false
    }
  }

  async function deleteConfig(id) {
    await axios.delete(`/api/config/${id}`)
    await fetchConfigs()
  }

  async function activateConfig(id) {
    await axios.post(`/api/config/${id}/activate`)
    await fetchConfigs()
  }

  async function testConnection(id) {
    const { data } = await axios.post(`/api/config/${id}/test`)
    return data
  }

  return {
    configs,
    storagePath,
    hasAnyKey,
    hasKey,
    activeConfig,
    loading,
    fetchConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    testConnection,
  }
})
