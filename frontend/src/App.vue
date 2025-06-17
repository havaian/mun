<template>
  <div class="min-h-screen">
    <AppHeader v-if="!isHomePage" />
    <main :class="isHomePage ? '' : 'container mx-auto py-6 px-4 sm:px-6 lg:px-8'">
      <router-view />
    </main>
    <AppFooter v-if="!isHomePage" />
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

const isHomePage = computed(() => route.name === 'home')
</script>
</template>