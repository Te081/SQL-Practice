<template>
  <div class="bg-scroll" aria-hidden="true">
    <div v-for="track in tracks" :key="track.id" class="bg-scroll-track" :style="trackStyle(track)">
      <!-- 每轨 4 份拷贝确保无缝循环 -->
      <template v-for="copy in 4" :key="'cp' + copy">
        <span
          v-for="item in track.items"
          :key="track.id + '-c' + copy + '-' + item.idx"
          class="bg-scroll-item"
          :style="{ color: item.color, opacity: track.opacity, fontWeight: item.bold ? 700 : track.weight }"
        >{{ item.text }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
function stringHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
  return Math.abs(h)
}

function hashColor(str) {
  const h = stringHash(str)
  const clamp = (v) => Math.min(235, Math.max(100, v))
  return `rgb(${clamp((h & 0xFF0000) >> 16)}, ${clamp((h & 0x00FF00) >> 8)}, ${clamp(h & 0x0000FF)})`
}

const sqlKW = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'INNER JOIN',
  'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
  'LIKE', 'IS NULL', 'IS NOT NULL', 'COUNT(*)', 'SUM()',
  'AVG()', 'MAX()', 'MIN()', 'UNION', 'UNION ALL',
  'CASE WHEN', 'THEN', 'ELSE', 'END', 'COALESCE',
  'CAST()', 'EXISTS', 'ANY', 'ALL', 'PRIMARY KEY',
  'FOREIGN KEY', 'REFERENCES', 'INDEX', 'UNIQUE',
  'CHECK', 'DEFAULT', 'NOT NULL',
  'ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'OVER()',
  'PARTITION BY', 'LAG()', 'LEAD()',
  'CROSS JOIN', 'SELF JOIN',
  'TRANSACTION', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
  'VIEW', 'CREATE VIEW', 'TRIGGER',
  'EXPLAIN', 'ANALYZE', 'VACUUM', 'PRAGMA',
]

const sqlOpt = [
  '☆ SELECT 只取需要的列，避免 SELECT *',
  '☆ WHERE 条件列建索引，加速过滤',
  '☆ JOIN 小表驱动大表，减少扫描',
  '☆ 避免在 WHERE 中对列做函数运算',
  '☆ LIKE "%xxx" 无法使用索引',
  '☆ 用 EXISTS 替代 IN 处理子查询',
  '☆ UNION ALL 比 UNION 快（不去重）',
  '☆ GROUP BY 列尽量建索引',
  '☆ 合理使用 LIMIT 限制返回行数',
  '☆ 避免 SELECT DISTINCT 滥用',
  '☆ COUNT(*) 比 COUNT(col) 更快',
  '☆ 多表 JOIN 时先过滤再关联',
  '☆ 用覆盖索引避免回表查询',
  '☆ 避免隐式类型转换破坏索引',
  '☆ 大表分页用游标替代 OFFSET',
  '☆ 定期 ANALYZE 更新表统计信息',
  '☆ 用 EXPLAIN 分析执行计划',
  '☆ 批量 INSERT 代替逐条插入',
  '☆ 合理使用连接池减少开销',
  '☆ 冷热数据分离存储',
  '☆ 慢查询日志定位性能瓶颈',
  '☆ 索引列避免 NULL 值',
  '☆ 前缀索引节省空间',
  '☆ 分区表提升大表查询效率',
  '☆ OR 条件可改写为 UNION',
  '☆ HAVING 过滤放 WHERE 中更高效',
  '☆ 子查询可改写为 JOIN 优化',
  '☆ 避免锁表，使用行级锁',
]

function buildTrack(id, source, speed, opacity, weight) {
  const items = source.map((text, idx) => ({
    text, idx,
    color: hashColor(text),
    bold: text.startsWith('☆'),
  }))
  return { id, items, speed, opacity, weight }
}

const tracks = [
  buildTrack('t1', sqlKW, 90, 0.5, 600),
  buildTrack('t2', sqlOpt, 130, 0.5, 400),
  buildTrack('t3', [...sqlKW].reverse(), 75, 0.5, 600),
  buildTrack('t4', sqlOpt.slice(10).concat(sqlOpt.slice(0, 10)), 115, 0.5, 400),
  buildTrack('t5', sqlKW.slice(20).concat(sqlKW.slice(0, 20)), 65, 0.5, 500),
]

function trackStyle(track) {
  return {
    animationDuration: track.speed + 's',
    fontSize: (track.id === 't2' || track.id === 't4')
      ? 'clamp(0.62rem, 0.75vw, 0.78rem)'
      : 'clamp(0.7rem, 0.9vw, 0.9rem)',
  }
}
</script>

<style scoped>
.bg-scroll {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 1.5vh 0;
}

.bg-scroll-track {
  display: flex;
  gap: 38px;
  white-space: nowrap;
  flex-shrink: 0;
  animation: marquee 140s linear infinite;
}

.bg-scroll-track:nth-child(even) {
  animation-direction: reverse;
}

.bg-scroll-item {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@media (prefers-color-scheme: dark) {
  .bg-scroll-item { filter: brightness(1.4); }
}
</style>
