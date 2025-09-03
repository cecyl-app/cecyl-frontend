interface GoogleUser {
    email: string
    name: string
    picture: string
    sub: string
}

interface AuthState {
    isAuthenticated: boolean
    user: GoogleUser | null
    isLoading: boolean
}

export const useAuth = () => {
    const config = useRuntimeConfig()

    // Reactive auth state
    const authState = reactive<AuthState>({
        isAuthenticated: false,
        user: null,
        isLoading: true
    })

    // Initialize Google Identity Services (new API)
    const initializeGoogleAuth = () => {
        if (typeof window === 'undefined' || !window.google?.accounts?.id) {
            console.warn('Google Identity Services not loaded')
            authState.isLoading = false
            return
        }

        try {
            console.log('Initializing Google Identity Services (GIS)')

            // Check if we're in development environment
            const isDevelopment = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('local')

            if (isDevelopment) {
                console.warn('Development environment detected - FedCM may have limitations on localhost')
            }

            window.google.accounts.id.initialize({
                client_id: config.public.googleClientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                // FedCM is handled automatically by Google Identity Services
                // Note: FedCM may not work properly on localhost during development
            })

            console.log('Google Identity Services initialized successfully')
            authState.isLoading = false
        } catch (error) {
            console.error('Failed to initialize Google Identity Services:', error)
            authState.isLoading = false
        }
    }

    // Handle JWT credential response (new API)
    const handleCredentialResponse = async (response: any) => {
        try {
            console.log('Received credential response from Google Identity Services')
            if (!response || !response.credential) {
                console.error('Invalid credential response:', response)
                handleAuthError('Invalid authentication response')
                return
            }

            const idToken = response.credential
            console.log('Successfully received ID token from Google')

            // Send ID token to backend for validation
            await authenticateWithBackend(idToken)

        } catch (error) {
            console.error('Error processing credential:', error)
            handleAuthError('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
    }

    // Authenticate with backend API
    const authenticateWithBackend = async (idToken: string) => {
        try {
            console.log("Id token: ", idToken)
            authState.isLoading = true

            const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000'

            await $fetch('/auth/signin/google', {
                method: 'POST',
                baseURL: apiBaseUrl,
                body: { idToken },
                credentials: 'include' // Important for setting cookies
            })

            // Decode JWT token to get user info for display
            const payload = JSON.parse(atob(idToken.split('.')[1]))
            const user: GoogleUser = {
                sub: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }

            // Authentication successful
            authState.isAuthenticated = true
            authState.user = user
            authState.isLoading = false

            // Store auth state in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth-state', JSON.stringify({
                    isAuthenticated: true,
                    user: user,
                    timestamp: Date.now()
                }))
            }

            console.log(`Access granted for email: ${user.email}`)

            // Redirect to home if on auth pages
            navigateTo('/')

        } catch (error: any) {
            console.error('Backend authentication failed:', error)
            authState.isLoading = false

            if (error.status === 403) {
                // User not authorized
                const payload = JSON.parse(atob(idToken.split('.')[1]))
                handleAuthError(`Access denied: ${payload.email} is not authorized to access this application`)
            } else {
                handleAuthError('Authentication failed. Please try again.')
            }
        }
    }

    // Handle authentication errors
    const handleAuthError = (message: string) => {
        authState.isAuthenticated = false
        authState.user = null
        authState.isLoading = false

        // Clear stored auth state
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-state')
        }

        // Redirect to error page with message
        navigateTo(`/auth/error?error=AccessDenied&message=${encodeURIComponent(message)}`)
    }

    // Sign in function (FedCM-compatible)
    const handleLogin = () => {
        if (typeof window === 'undefined' || !window.google?.accounts?.id) {
            console.error('Google Identity Services not available')
            return
        }

        try {
            console.log('Attempting to show Google sign-in prompt')

            // Use prompt without status method callbacks to be FedCM-compatible
            window.google.accounts.id.prompt()

            // Note: We removed the notification callback with status methods like
            // isNotDisplayed(), isSkippedMoment(), isDismissedMoment() as these
            // will stop working when FedCM becomes mandatory.
            // The button-based sign-in is the recommended approach.

        } catch (error) {
            console.error('Sign in prompt failed:', error)

            // Don't show error for FedCM issues in development
            const isDevelopment = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('local')

            if (isDevelopment) {
                console.warn('Sign-in prompt failed (likely due to FedCM limitations on localhost). The sign-in button should still work.')
            } else {
                console.log('Sign-in prompt may not be available - users can use the sign-in button')
            }
        }
    }

    // Render sign-in button (new API)
    const renderSignInButton = (elementId = 'google-signin-button') => {
        if (typeof window === 'undefined' || !window.google?.accounts?.id) {
            console.warn('Google Identity Services not available for button rendering')
            return
        }

        const element = document.getElementById(elementId)
        if (element) {
            try {
                window.google.accounts.id.renderButton(element, {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'rectangular'
                })
            } catch (error) {
                console.error('Failed to render Google sign-in button:', error)
            }
        }
    }

    // Sign out function (new API)
    const handleLogout = async () => {
        try {
            // Call backend to clear cookie
            const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000'
            await $fetch('/auth/logout', {
                method: 'POST',
                baseURL: apiBaseUrl,
                credentials: 'include'
            })
        } catch (error) {
            console.warn('Failed to call backend logout:', error)
            // Continue with local logout even if backend call fails
        }

        // Clear local auth state
        authState.isAuthenticated = false
        authState.user = null
        authState.isLoading = false

        // Clear stored auth state
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-state')

            // Disable auto-select for future sign-ins
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect()
            }
        }

        // Redirect to sign-in page
        navigateTo('/auth/signin')
    }



    // Handle global API errors (to be used by other composables)
    const handleApiError = (error: any) => {
        if (error.status === 401 || error.status === 403) {
            console.warn('Authentication error detected, redirecting to login')
            handleLogout()
        }
    }

    // Restore auth state from localStorage
    const restoreAuthState = () => {
        if (typeof window === 'undefined') {
            authState.isLoading = false
            return
        }

        try {
            const stored = localStorage.getItem('auth-state')
            if (stored) {
                const parsedState = JSON.parse(stored)

                // Check if stored state is recent (24 hours)
                const maxAge = 24 * 60 * 60 * 1000 // 24 hours
                if (Date.now() - parsedState.timestamp < maxAge) {
                    // Restore auth state
                    authState.isAuthenticated = parsedState.isAuthenticated
                    authState.user = parsedState.user
                } else {
                    // State is too old, clear it
                    localStorage.removeItem('auth-state')
                }
            }
        } catch (error) {
            console.error('Error restoring auth state:', error)
            localStorage.removeItem('auth-state')
        }

        authState.isLoading = false
    }

    // Initialize on client side
    onMounted(() => {
        // Restore auth state first
        restoreAuthState()

        // Initialize Google Identity Services when the script is loaded
        if (typeof window !== 'undefined') {
            const checkGoogleLoaded = () => {
                if (window.google?.accounts?.id) {
                    initializeGoogleAuth()
                } else {
                    setTimeout(checkGoogleLoaded, 100)
                }
            }
            checkGoogleLoaded()
        }
    })

    return {
        // State
        isAuthenticated: readonly(toRef(authState, 'isAuthenticated')),
        user: readonly(toRef(authState, 'user')),
        isLoading: readonly(toRef(authState, 'isLoading')),

        // Methods
        handleLogin,
        handleLogout,
        renderSignInButton,
        initializeGoogleAuth,
        handleCredentialResponse,
        handleApiError
    }
}

// Global type declarations for Google Identity Services (FedCM-compatible)
declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string
                        callback: (response: any) => void
                        auto_select?: boolean
                        cancel_on_tap_outside?: boolean
                    }) => void
                    prompt: () => void  // Simplified for FedCM compatibility - no callback
                    renderButton: (element: HTMLElement, options: {
                        theme?: 'outline' | 'filled_blue' | 'filled_black'
                        size?: 'large' | 'medium' | 'small'
                        width?: string | number
                        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
                        shape?: 'rectangular' | 'pill' | 'circle' | 'square'
                    }) => void
                    disableAutoSelect: () => void
                }
            }
        }
    }
}