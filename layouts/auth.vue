<template>
  <v-app>
    <v-main class="auth-layout">
      <v-container fluid class="fill-height">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4" xl="3">
            <div class="text-center mb-8">
              <h1 class="text-h3 font-weight-bold text-primary mb-2">
                Cecyl
              </h1>
              <p class="text-h6 text-grey-600">
                From Bench to Bedside
              </p>
            </div>
            
            <slot />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-layout {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.v-container {
  position: relative;
}

.v-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.v-col {
  position: relative;
  z-index: 1;
}
</style>
