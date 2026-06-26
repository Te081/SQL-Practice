<template>
  <div v-if="result" class="result-panel">
    <!-- 错误提示 -->
    <div v-if="!result.valid" class="result-header error">
      <span>❌ 执行错误</span>
    </div>

    <!-- 结果正确 -->
    <div v-else-if="result.isCorrect" class="result-header success">
      <span>✅ 结果正确！</span>
    </div>

    <!-- 结果不正确 -->
    <div v-else class="result-header error">
      <span>⚠️ 结果与预期不符</span>
    </div>

    <div class="result-body">
      <!-- 错误信息 -->
      <div v-if="result.error" style="color:var(--color-danger);font-size:0.875rem;margin-bottom:12px;">
        {{ result.error }}
      </div>

      <!-- 比对展示 -->
      <div v-if="result.valid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div class="section-title" style="margin-bottom:8px;">你的查询结果</div>
          <DataTable :data="result.userResult || []" />
        </div>
        <div>
          <div class="section-title" style="margin-bottom:8px;">预期结果</div>
          <DataTable :data="result.expectedResult || []" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DataTable from './DataTable.vue'

defineProps({
  result: { type: Object, default: null },
})
</script>
