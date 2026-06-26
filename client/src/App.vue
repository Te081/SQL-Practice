<template>
  <div id="app-shell">
    <BackgroundScroll />
    <AppNav />
    <main class="page">
      <router-view />
    </main>
    <StudyPet />
  </div>
</template>

<script setup>
import AppNav from './components/AppNav.vue'
import StudyPet from './components/StudyPet.vue'
import BackgroundScroll from './components/BackgroundScroll.vue'
</script>
