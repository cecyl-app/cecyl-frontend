<template>
  <v-card class="auth-card" elevation="12">
    <v-card-title class="text-center pb-4">
      <h2 class="text-h4 font-weight-bold">Welcome Back</h2>
    </v-card-title>
    
    <v-card-text class="text-center px-8 pb-8">
      <p class="text-body-1 text-grey-700 mb-8">
        Please sign in with your Google account to access Cecyl
      </p>
      
      <!-- Google Identity Services Sign-In Button Container -->
      <div id="google-signin-button" class="mb-6 mx-auto"></div>
      
      <!-- Fallback button if Google button doesn't load -->
      <v-btn
        v-if="showFallbackButton"
        @click="handleGoogleSignIn"
        :loading="isLoading"
        :disabled="isLoading"
        color="primary"
        size="large"
        variant="elevated"
        prepend-icon="mdi-google"
        block
        class="mt-4 mx-auto"
      >
        Sign in with Google
      </v-btn>
      
      <!-- Loading state -->
      <div v-if="isLoading" class="mt-6">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <p class="mt-3 text-body-2 text-grey-600">Authenticating...</p>
      </div>
      
      <!-- Error state -->
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-6"
        :text="errorMessage"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false // This page should be accessible without authentication
})

const { handleLogin, renderSignInButton, isLoading, isAuthenticated } = useAuth()
const showFallbackButton = ref(false)
const errorMessage = ref('')

const route = useRoute()

const handleGoogleSignIn = () => {
  errorMessage.value = ''
  handleLogin()
}

// Check for error message from URL params
onMounted(() => {
  const error = route.query.error as string
  const message = route.query.message as string
  
  if (message) {
    errorMessage.value = decodeURIComponent(message)
  } else if (error) {
    switch (error) {
      case 'AccessDenied':
        errorMessage.value = 'Access denied. Please use a different Google account.'
        break
      case 'AuthFailed':
        errorMessage.value = 'Authentication failed. Please try again.'
        break
      default:
        errorMessage.value = 'Authentication error. Please try again.'
    }
  }
})

// Redirect if already authenticated
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    navigateTo('/')
  }
})

// Initialize Google Sign-In button when component mounts
onMounted(() => {
  // Wait for Google Identity Services to load, then render button
  setTimeout(() => {
    renderSignInButton('google-signin-button')
    
    // Show fallback button if Google button doesn't render after a delay
    setTimeout(() => {
      const googleButton = document.getElementById('google-signin-button')
      if (!googleButton || googleButton.children.length === 0) {
        showFallbackButton.value = true
      }
    }, 2000)
  }, 1000)
})
</script>

<style scoped>
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
