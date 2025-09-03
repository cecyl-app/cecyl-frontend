export default defineNuxtRouteMiddleware((to, from) => {
    // Skip auth check for auth pages
    if (to.path.startsWith('/auth/')) {
        return
    }

    const { isAuthenticated, isLoading } = useAuth()

    // If auth is still loading, allow the request to continue
    // The auth state will be restored on the client
    if (isLoading.value) {
        return
    }

    // If user is not authenticated, redirect to sign in page
    if (!isAuthenticated.value) {
        return navigateTo('/auth/signin')
    }
})