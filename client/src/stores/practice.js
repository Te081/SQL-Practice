import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const usePracticeStore = defineStore('practice', () => {
  const currentExercise = ref(null)
  const tableData = ref('')
  const tables = ref([])            // 服务端预解析的表数据
  const userSql = ref('')
  const validationResult = ref(null)
  const optimizationSuggestions = ref([])
  const lastAttemptId = ref(null)
  const loading = ref(false)
  const generating = ref(false)
  const optimizing = ref(false)
  const error = ref('')

  async function generateExercise(difficulty = 'medium', topic = '') {
    generating.value = true
    error.value = ''
    validationResult.value = null
    optimizationSuggestions.value = []
    userSql.value = ''

    try {
      const { data } = await axios.post('/api/practice/generate', { difficulty, topic })
      currentExercise.value = data.exercise
      tableData.value = data.tableData || ''
      tables.value = data.tables || []
      return data.exercise
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      error.value = msg
      throw err
    } finally {
      generating.value = false
    }
  }

  async function validateSql() {
    if (!userSql.value.trim() || !currentExercise.value) return

    loading.value = true
    error.value = ''
    optimizationSuggestions.value = []

    try {
      const { data } = await axios.post('/api/practice/validate', {
        exerciseId: currentExercise.value.id,
        userSql: userSql.value,
        tableData: tableData.value,
      })
      validationResult.value = data.validation
      lastAttemptId.value = data.attempt.id
      return data
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      error.value = msg
    } finally {
      loading.value = false
    }
  }

  async function getOptimization() {
    if (!lastAttemptId.value || !validationResult.value?.isCorrect) return

    optimizing.value = true
    try {
      const { data } = await axios.post('/api/practice/optimize', {
        exerciseId: currentExercise.value.id,
        userSql: userSql.value,
        attemptId: lastAttemptId.value,
      })
      optimizationSuggestions.value = data.suggestions || []
      return data
    } finally {
      optimizing.value = false
    }
  }

  function reset() {
    currentExercise.value = null
    tableData.value = ''
    tables.value = []
    userSql.value = ''
    validationResult.value = null
    optimizationSuggestions.value = []
    lastAttemptId.value = null
    error.value = ''
  }

  return {
    currentExercise,
    tableData,
    tables,
    userSql,
    validationResult,
    optimizationSuggestions,
    lastAttemptId,
    loading,
    generating,
    optimizing,
    error,
    generateExercise,
    validateSql,
    getOptimization,
    reset,
  }
})
