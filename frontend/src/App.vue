<template>
  <div class="min-h-screen gradient-bg">
    <AppHeader v-if="!isComingSoonMode" />
    <main v-if="!isComingSoonMode" class="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
    <main v-else>
      <router-view />
    </main>
    <AppFooter v-if="!isComingSoonMode" />
    <Vue3Toastify position="bottom-right" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()

// Check if we're on the home page (coming soon mode)
const isComingSoonMode = computed(() => {
  return route.name === 'home'
})
</script>