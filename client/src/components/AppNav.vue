<template>
  <nav class="app-nav">
    <router-link to="/" class="logo">🐘 SQL Practice</router-link>
    <div class="nav-links">
      <router-link to="/history">📋 练习</router-link>
      <router-link to="/profile">👤 个人</router-link>
      <router-link to="/config">⚙️ 配置</router-link>
    </div>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
