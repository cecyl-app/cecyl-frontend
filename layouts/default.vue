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