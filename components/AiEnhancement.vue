<template>
  <v-card class="h-100 d-flex flex-column">
    <v-card-title class="d-flex justify-space-between align-center flex-shrink-0">
      <span>AI Support</span>
    </v-card-title>
    <v-card-subtitle>
      Use AI to enhance your content
    </v-card-subtitle>
    
    <v-card-text class="pa-4 flex-grow-1 overflow-auto">
      <!-- Custom Prompt -->
      <div class="mb-4">

        <v-textarea
          v-model="customPrompt"
          placeholder="Enter your custom prompt to enhance this section..."
          variant="outlined"
          rows="3"
          auto-grow
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-send"
          :disabled="!customPrompt.trim()"
          :loading="isProcessing"
          @click="handleCustomPrompt"
        >
          Ask AI
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  sectionId?: string
  sectionContent?: string
  projectId?: string
}

interface Emits {
  (e: 'content-enhanced', content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { askAIForSection } = useProjects()

const customPrompt = ref('')
const isProcessing = ref(false)

const handleCustomPrompt = async () => {
  if (!props.sectionId || !customPrompt.value.trim() || !props.projectId) return
  
  isProcessing.value = true
  
  try {
    const result = await askAIForSection(props.projectId, props.sectionId, customPrompt.value)
    
    if (result) {
      emit('content-enhanced', result)
    }
    
    console.log('AI Enhancement result:', result)
  } catch (error) {
    console.error('AI Enhancement failed:', error)
  } finally {
    isProcessing.value = false
    customPrompt.value = ''
  }
}
</script>

<style scoped>
.flex-grow-1 {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}
</style>