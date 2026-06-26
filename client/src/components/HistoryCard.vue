<template>
  <div class="history-card" @click="$emit('select', exercise)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-weight:600;font-size:0.95rem;">{{ exercise.title || 'SQL 练习题' }}</div>
        <div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:4px;">
          {{ exercise.requirements?.slice(0, 100) }}{{ exercise.requirements?.length > 100 ? '...' : '' }}
        </div>
      </div>
      <span :class="['badge', exercise.difficulty === 'easy' ? 'badge-success' : exercise.difficulty === 'hard' ? 'badge-error' : 'badge-warning']">
        {{ { easy: '简单', medium: '中等', hard: '困难' }[exercise.difficulty] || '中等' }}
      </span>
    </div>
    <div class="meta">
      <span>📝 {{ exercise.attempt_count || 0 }} 次答题</span>
      <span v-if="exercise.last_attempt_at">🕐 {{ formatDate(exercise.last_attempt_at) }}</span>
      <span>📅 {{ formatDate(exercise.created_at) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  exercise: { type: Object, required: true },
})

defineEmits(['select'])

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str + 'Z')
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
