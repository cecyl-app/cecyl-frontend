<template>
  <div>
    <!-- Main Content Area -->
    <v-container fluid class="pa-0">
      <v-row no-gutters class="fill-height">
        <!-- Left Sidebar: Sections Navigation -->
        <v-col 
          cols="12" 
          sm="3" 
          md="2" 
          class="d-flex flex-column border-e"
        >
          <SectionSidebar
            v-if="activeProject || loading"
            :active-section="activeSection"
            :loading="loading"
            @section-selected="handleSectionSelected"
          />
          
          <!-- No Sections State -->
          <v-card v-else class="flex-grow-1 d-flex align-center justify-center" flat>
            <div class="text-center pa-4">
              <v-icon size="60" color="grey-lighten-2" class="mb-3">
                mdi-file-document-plus-outline
              </v-icon>
              <h3 class="text-subtitle-1 mb-3">No Sections Found</h3>
              <p class="text-body-2 text-grey mb-3">
                Create sections to start writing content
              </p>
            </div>
          </v-card>
        </v-col>

        <!-- Center: Markdown Editor -->
        <v-col 
          cols="12" 
          sm="6" 
          md="7" 
          class="d-flex flex-column"
        >
          <div v-if="activeSection" class="d-flex flex-column fill-height">
            <!-- Editor Header -->
            <v-sheet class="pa-3 border-b bg-grey-lighten-5" elevation="0">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <h2 class="text-subtitle-1 font-weight-bold">{{ activeSection.title }}</h2>
                  <p class="text-caption text-grey mt-1">
                    Last updated {{ formatRelativeTime(activeSection.updatedAt) }}
                  </p>
                </div>
                <div>
                  <v-btn
                    icon="mdi-content-save"
                    variant="text"
                    size="small"
                    :color="hasUnsavedChanges ? 'primary' : 'grey'"
                    @click="handleSaveSection"
                    :disabled="!hasUnsavedChanges"
                  />
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="handlePreviewProject"
                    :disabled="!activeProject"
                  />
                </div>
              </div>
            </v-sheet>
            
            <!-- Markdown Editor -->
            <div class="flex-grow-1">
              <MarkdownEditor
                v-model="sectionContent"
                :title="activeSection.title"
              />
            </div>
          </div>
          
          <!-- No Section Selected State -->
          <v-card v-else class="flex-grow-1 d-flex align-center justify-center" flat>
            <div class="text-center pa-6">
              <v-icon size="60" color="grey-lighten-2" class="mb-3">
                mdi-text-box-outline
              </v-icon>
              <h3 class="text-subtitle-1 mb-3">Select a Section</h3>
              <p class="text-body-2 text-grey">
                Choose a section from the sidebar to start editing
              </p>
            </div>
          </v-card>
        </v-col>

        <!-- Right Sidebar: AI Enhancement & File Repository -->
        <v-col 
          cols="12" 
          sm="3" 
          md="3" 
          class="d-flex flex-column border-s"
        >
          <!-- AI Enhancement Panel -->
          <v-sheet class="flex-grow-1 border-b" elevation="0">
            <AiEnhancement
              :section-id="activeSection?.id"
              :section-content="sectionContent"
              :project-id="projectId"
              @content-enhanced="handleContentEnhanced"
            />
          </v-sheet>
          
          <!-- File Repository Panel -->
          <v-sheet class="flex-grow-1" elevation="0">
            <FileRepository v-if="projectId" :project-id="projectId" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>



    <!-- Preview Project Dialog -->
    <v-dialog v-model="previewDialog" max-width="1000" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-eye</v-icon>
          {{ activeProject?.name || 'Project Preview' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0" style="max-height: 80vh;">
          <div v-if="previewContent.length === 0" class="text-center pa-6">
            <v-icon size="48" color="grey-lighten-2" class="mb-3">
              mdi-file-document-outline
            </v-icon>
            <p class="text-body-2 text-grey">No sections available to preview</p>
          </div>
          <div v-else class="pa-4">
            <div 
              v-for="(section, index) in previewContent" 
              :key="index"
              class="section-preview mb-6"
            >
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="bg-grey-lighten-5 pa-3">
                  <div class="d-flex align-center justify-space-between w-100">
                    <h3 class="text-h6">{{ section.title }}</h3>
                    <v-chip size="small" color="grey-lighten-1">
                      {{ formatRelativeTime(section.updatedAt) }}
                    </v-chip>
                  </div>
                </v-card-title>
                <v-card-text class="pa-4">
                  <MarkdownViewer :content="section.content" />
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="previewDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/project'
import type { Section } from '~/types/report'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const projectId = ref<string>('')
// Composables
const { 
  setActiveProject,
  improveSectionContent,
  createSection,
  updateSection: updateProjectSection,
  deleteSection,
  activeProject
} = useProjects()

watch(activeProject, (newProject) => {
  console.log('activeProject', newProject)
}, { immediate: true, deep: true })

// Reactive data
const loading = ref(false)

// Use local ref for project but keep it synchronized with global state

const activeSection = ref<Section | null>(null)
const sectionContent = ref('')
const originalContent = ref('')
const hasUnsavedChanges = computed(() => sectionContent.value !== originalContent.value)



// Preview Dialog
const previewDialog = ref(false)
const previewContent = ref<Array<{ title: string; content: string; updatedAt: string }>>([])

// Auto-save functionality
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const handleSectionSelected = (section: Section) => {
  // Save current section if there are unsaved changes
  if (hasUnsavedChanges.value && activeSection.value) {
    handleSaveSection()
  }
  
  activeSection.value = section
  sectionContent.value = section.content
  originalContent.value = section.content
}


const handleSaveSection = async () => {
  if (!activeSection.value || !hasUnsavedChanges.value || !projectId.value) return
  
  try {
    // Use the new API to improve section content
    await improveSectionContent(projectId.value, activeSection.value.id, sectionContent.value)
    
    
    originalContent.value = sectionContent.value
    
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  } catch (error) {
    console.error('Failed to save section:', error)
  }
}

const handleContentEnhanced = (enhancedContent: string) => {
  sectionContent.value = enhancedContent
}



const handlePreviewProject = () => {
  if (!activeProject.value?.sections) return
  
  previewContent.value = activeProject.value.sections.map((section) => ({
    title: section.name,
    content: section.history?.[section.history.length - 1]?.content || '',
    updatedAt: new Date().toISOString(),
  }))
  
  previewDialog.value = true
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

// Load project and initialize with first section if available
onMounted(async () => {
  loading.value = true
  try {
    // Try to set active project if it's already in local state 
    projectId.value = route.params.id as string
    let project = setActiveProject(projectId.value)
    
    // Wait for reactivity to update, then select first section
    await nextTick()
    
    if (activeProject.value?.sections && activeProject.value.sections.length > 0) {
      const firstSection = {
        id: activeProject.value.sections[0].id,
        title: activeProject.value.sections[0].name,
        content: activeProject.value.sections[0].history?.[activeProject.value.sections[0].history.length - 1]?.content || '',
        order: 0,
        projectId: activeProject.value.id,
        reportId: `project-${activeProject.value.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      handleSectionSelected(firstSection)
    }
  } catch (error) {
    console.error('Failed to load project:', error)
    // Redirect to projects page if project not found
    await router.push('/')
  } finally {
    loading.value = false
  }
})

// Save before leaving the page
onBeforeUnmount(() => {
  if (hasUnsavedChanges.value && activeSection.value) {
    handleSaveSection()
  }
  
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

<style scoped>
.border-e {
  border-inline-end: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-s {
  border-inline-start: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-b {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style> 