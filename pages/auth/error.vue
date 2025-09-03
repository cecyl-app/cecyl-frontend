<template>
  <v-card class="auth-card" elevation="12">
    <v-card-title class="text-center pb-4">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <h2 class="text-h4 font-weight-bold">Authentication Error</h2>
    </v-card-title>
    
    <v-card-text class="text-center px-8 pb-8">
      <p class="text-body-1 text-grey-700 mb-8">{{ errorMessage }}</p>
      
      <v-btn
        @click="handleRetry"
        color="primary"
        size="large"
        variant="elevated"
        block
        class="mb-4"
      >
        Try Again
      </v-btn>
      
      <v-btn
        @click="handleGoHome"
        color="grey"
        size="large"
        variant="outlined"
        block
      >
        Go to Home
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false
})

const route = useRoute()
const router = useRouter()

const errorMessage = computed(() => {
  const error = route.query.error as string
  const customMessage = route.query.message as string
  
  // If there's a custom message, use it
  if (customMessage) {
    return decodeURIComponent(customMessage)
  }
  
  // Otherwise, use predefined messages
  switch (error) {
    case 'AccessDenied':
      return 'Access denied. Your email address is not authorized to access this application.'
    case 'Signin':
      return 'There was an error signing you in. Please try again.'
    case 'GoogleAuth':
      return 'There was an error signing in with Google. Please try again.'
    case 'SessionRequired':
      return 'You need to be signed in to access this page.'
    default:
      return 'An authentication error occurred. Please try again.'
  }
})

const handleRetry = () => {
  router.push('/auth/signin')
}

const handleGoHome = () => {
  router.push('/')
}
</script>

<style scoped>
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
