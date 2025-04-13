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
      <v-container>
        <slot />
      </v-container>
    </v-main>

    <v-footer
      app
      color="primary"
      class="text-white"
    >
      <v-container>
        <v-row justify="center">
          <v-col cols="12" class="text-center">
            <p class="mb-0">© 2025 Cecyl - From Bench to Bedside</p>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template> 