<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>Cecyl - From Bench to Bedside</v-app-bar-title>
      <template v-slot:append>
        <v-btn
          to="/"
          variant="text"
        >
          Home
        </v-btn>
        
        <!-- User Menu - Auth is now required so user is always authenticated here -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              :prepend-icon="'mdi-account-circle'"
            >
              {{ user?.name || user?.email }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user?.email }}</v-list-item-title>
              <v-list-item-subtitle>Signed in</v-list-item-subtitle>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="handleLogout">
              <v-list-item-title>
                <v-icon start>mdi-logout</v-icon>
                Sign Out
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <v-footer
      app
      color="primary"
      class="text-white"
    >
            <p class="mb-0 text-center w-100">© 2025 Cecyl - From Bench to Bedside</p>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
const { user, handleLogout } = useAuth()
</script>