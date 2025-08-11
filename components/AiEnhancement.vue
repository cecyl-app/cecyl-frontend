<template>
  <v-card class="h-100 d-flex flex-column">
    <v-card-title class="d-flex justify-space-between align-center flex-shrink-0">
      <span>AI Enhancement</span>
      <v-chip 
        size="small" 
        color="primary" 
        variant="outlined"
      >
        Beta
      </v-chip>
    </v-card-title>
    
    <v-card-text class="pa-4 flex-grow-1 overflow-auto">
      <!-- Custom Prompt -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 mb-3">Custom Prompt</h4>
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
          :loading="isProcessing && currentPromptType === 'custom'"
          @click="handleCustomPrompt"
        >
          Apply Enhancement
        </v-btn>
      </div>

      <!-- Auto-Applied Enhancement Notice -->
      <v-alert
        v-if="lastAppliedResult"
        type="info"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="handleRevertChanges"
      >
        <template v-slot:prepend>
          <v-icon>mdi-auto-fix</v-icon>
        </template>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="font-weight-medium">AI Enhancement Applied</div>
            <div class="text-caption">{{ lastAppliedResult.type }} - {{ formatTime(lastAppliedResult.createdAt) }}</div>
          </div>
          <div>
            <v-btn
              size="small"
              variant="outlined"
              prepend-icon="mdi-undo"
              @click="handleRevertChanges"
            >
              Revert
            </v-btn>
          </div>
        </div>
      </v-alert>
      
      <!-- Recent Enhancements -->
      <div v-if="recentPrompts.length > 0">
        <h4 class="text-subtitle-2 mb-3">Recent Enhancements</h4>
        <div class="enhancement-list">
          <v-card
            v-for="prompt in recentPrompts"
            :key="prompt.id"
            variant="outlined"
            class="mb-3"
          >
            <v-card-text class="pb-2">
              <div class="d-flex align-center mb-2">
                <v-chip
                  :color="getPromptTypeColor(prompt.type)"
                  size="x-small"
                  class="me-2"
                >
                  {{ prompt.type }}
                </v-chip>
                <span class="text-caption text-grey">
                  {{ formatTime(prompt.createdAt) }}
                </span>
                <v-spacer />
                <v-btn
                  icon="mdi-content-copy"
                  variant="text"
                  size="x-small"
                  @click="handleCopyResult(prompt.result || '')"
                />
              </div>
              <p class="text-body-2 mb-2">
                <strong>Prompt:</strong> {{ prompt.text }}
              </p>
              <div v-if="prompt.result">
                <p class="text-body-2 mb-2">
                  <strong>Result:</strong>
                </p>
                <div class="result-content pa-2 bg-grey-lighten-5 rounded">
                  <pre class="text-caption">{{ prompt.result }}</pre>
                </div>
                <div class="mt-2">
                  <v-btn
                    size="small"
                    variant="outlined"
                    prepend-icon="mdi-check"
                    @click="handleApplyResult(prompt)"
                  >
                    Apply to Section
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center pa-4">
        <v-icon size="64" color="grey-lighten-2" class="mb-4">
          mdi-robot-outline
        </v-icon>
        <p class="text-body-2 text-grey mb-4">
          Use AI to enhance your content
        </p>
        <p class="text-caption text-grey-lighten-1">
          Write a custom prompt to get started
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { AiPrompt } from '~/types/report'

interface Props {
  sectionId?: string
  sectionContent?: string
}

interface Emits {
  (e: 'content-enhanced', content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { enhanceSection, aiPrompts } = useReports()

const customPrompt = ref('')
const isProcessing = ref(false)
const currentPromptType = ref<string | null>(null)
const lastAppliedResult = ref<AiPrompt | null>(null)
const originalContent = ref<string>('')

const recentPrompts = computed(() => {
  if (!props.sectionId) return []
  
  return aiPrompts.value
    .filter(prompt => prompt.sectionId === props.sectionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) // Show last 5 enhancements
})

const handleCustomPrompt = async () => {
  if (!props.sectionId || !customPrompt.value.trim()) return
  
  await processPrompt(customPrompt.value, 'custom')
  customPrompt.value = ''
}

const processPrompt = async (prompt: string, type: string) => {
  if (!props.sectionId) return
  
  // Store original content before applying enhancement
  originalContent.value = props.sectionContent || ''
  
  isProcessing.value = true
  currentPromptType.value = type
  
  try {
    const result = await enhanceSection(
      props.sectionId, 
      prompt, 
      type as AiPrompt['type']
    )
    
    if (result && result.result) {
      // Auto-apply the result
      handleApplyResult(result)
    }
    
    console.log('AI Enhancement result:', result)
  } catch (error) {
    console.error('AI Enhancement failed:', error)
  } finally {
    isProcessing.value = false
    currentPromptType.value = null
  }
}

const handleApplyResult = (prompt: AiPrompt) => {
  // Store original content if not already stored
  if (!originalContent.value && props.sectionContent) {
    originalContent.value = props.sectionContent
  }
  
  lastAppliedResult.value = prompt
  emit('content-enhanced', prompt.result || '')
}

const handleRevertChanges = () => {
  if (originalContent.value) {
    emit('content-enhanced', originalContent.value)
    lastAppliedResult.value = null
    originalContent.value = ''
  }
}

const handleCopyResult = async (result: string) => {
  try {
    await navigator.clipboard.writeText(result)
    // You could show a toast notification here
    console.log('Copied to clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const getPromptTypeColor = (type: string): string => {
  const colors = {
    enhance: 'purple',
    summarize: 'blue',
    expand: 'green',
    rewrite: 'orange',
    custom: 'teal'
  }
  return colors[type as keyof typeof colors] || 'grey'
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

// Watch for section changes to clear applied results
watch(() => props.sectionId, () => {
  lastAppliedResult.value = null
  originalContent.value = ''
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.enhancement-list {
  max-height: none; /* Remove height restriction */
}

.result-content {
  max-height: 200px;
  overflow-y: auto;
}

.result-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
}

.flex-grow-1 {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.overflow-auto {
  overflow: auto;
}
</style> 