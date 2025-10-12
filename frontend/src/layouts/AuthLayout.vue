<template>
  <div class="min-h-screen bg-gradient-mun relative overflow-hidden">
    <!-- Grid Pattern Background -->
    <div class="absolute inset-0 bg-grid-pattern opacity-3"></div>

    <!-- Simple Auth Content - No navbar needed for guests -->
    <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white backdrop-blur-sm py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white/20">
          <!-- Dynamic route content -->
          <router-view />
        </div>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-32 w-80 h-80 bg-mun-blue-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-32 w-80 h-80 bg-mun-purple-400/20 rounded-full blur-3xl"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Set page title based on route
onMounted(() => {
  const titleMap = {
    'Login': 'Sign In',
    'QRLogin': 'QR Code Login',
    'EmailBinding': 'Complete Registration',
    'LanguageSelection': 'Select Language'
  }

  const pageTitle = titleMap[route.name] || 'Authentication'
  document.title = `${pageTitle} | MUN Platform`
})
</script>

<style scoped>
/* Grid Pattern Background - Exact same as 404 page */
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Glass morphism effect for auth card */
.bg-white\/80 {
  background-color: rgba(255, 255, 255, 0.8);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Gradient background */
.bg-gradient-mun {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%);
}

/* Transition optimizations */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Blur effects for background decoration */
.blur-3xl {
  filter: blur(64px);
}

/* Z-index management */
.-z-10 {
  z-index: -10;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .sm\:rounded-2xl {
    border-radius: 0;
  }

  .sm\:px-10 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>