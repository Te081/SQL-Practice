import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useHistoryStore = defineStore('history', () => {
  const exercises = ref([])
  const selectedExercise = ref(null)
  const loading = ref(false)

  async function fetchList(limit = 50, offset = 0) {
    loading.value = true
    try {
      const { data } = await axios.get('/api/history', { params: { limit, offset } })
      exercises.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id) {
    loading.value = true
    try {
      const { data } = await axios.get(`/api/history/${id}`)
      selectedExercise.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id) {
    await axios.delete(`/api/history/${id}`)
    exercises.value = exercises.value.filter(e => e.id !== id)
    if (selectedExercise.value?.id === id) {
      selectedExercise.value = null
    }
  }

  function clearSelection() {
    selectedExercise.value = null
  }

  return {
    exercises,
    selectedExercise,
    loading,
    fetchList,
    fetchDetail,
    deleteRecord,
    clearSelection,
  }
})
