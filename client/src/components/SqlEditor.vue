<template>
  <div class="sql-editor-wrap">
    <textarea
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :readonly="readonly"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入 SQL 语句...' },
  readonly: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
