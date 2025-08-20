<template>
  <v-card class="h-100">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Report Sections</span>
      <v-menu>
        <template v-slot:activator="{ props: menuProps }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            v-bind="menuProps"
          />
        </template>
        <v-list>
          <v-list-item @click="handleAddSection">
            <v-list-item-title>
              <v-icon start>mdi-plus</v-icon>
              Add Section
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleDownloadReport">
            <v-list-item-title>
              <v-icon start>mdi-download</v-icon>
              Download Report
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>
    
    <v-card-text class="pa-0">
      <!-- Project/Report Header -->
      <div v-if="loading" class="pa-4 border-b">
        <!-- Loading skeleton for header -->
        <v-skeleton-loader
          type="heading"
          height="24"
          width="60%"
          class="mb-2"
        />
        <v-skeleton-loader
          type="text"
          height="12"
          width="80%"
          class="mb-1"
        />
        <v-skeleton-loader
          type="text"
          height="12"
          width="40%"
        />
      </div>
      
      <div v-else-if="project || report" class="pa-4 border-b">
        <h3 class="text-h6 mb-2">
          {{ isProjectMode ? project?.name : report?.title }}
        </h3>
        <div class="text-caption text-grey">
          Last updated: {{ formatDate((project?.createdAt || report?.updatedAt) || new Date().toISOString()) }}
        </div>
        <div class="text-caption text-grey">
          {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}
        </div>
      </div>
      
      <!-- Download Button -->
      <div v-if="loading" class="pa-4 border-b">
        <v-skeleton-loader
          type="button"
          height="36"
          width="100%"
        />
      </div>
      
      <div v-else class="pa-4 border-b">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-download"
          block
          @click="handleDownloadReport"
        >
          Download Report
        </v-btn>
      </div>
      
      <!-- Section List -->
      <div class="section-list">
        <!-- Loading Skeleton -->
        <template v-if="loading">
          <div
            v-for="i in 3"
            :key="`skeleton-${i}`"
            class="section-skeleton pa-3 border-b"
          >
            <div class="d-flex align-center">
              <v-skeleton-loader
                type="avatar"
                height="24"
                width="24"
                class="flex-shrink-0"
              />
              <div class="flex-grow-1 ml-3">
                <v-skeleton-loader
                  type="text"
                  height="16"
                  width="70%"
                  class="mb-1"
                />
                <v-skeleton-loader
                  type="text"
                  height="12"
                  width="40%"
                />
              </div>
              <v-skeleton-loader
                type="button"
                height="20"
                width="20"
                class="ml-2"
              />
            </div>
          </div>
        </template>
        
        <!-- Actual Sections -->
        <template v-else>
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            class="section-item"
            :class="{ 'section-active': activeSection?.id === section.id }"
            @click="handleSectionClick(section)"
          >
            <div class="d-flex align-center pa-3">
              <div class="section-number">
                {{ index + 1 }}
              </div>
              <div class="flex-grow-1 ml-3">
                <div class="text-body-2 font-weight-medium">
                  {{ section.title }}
                </div>
                <div class="text-caption text-grey mt-1">
                  Updated {{ formatRelativeTime(section.updatedAt) }}
                </div>
              </div>
              <v-menu>
                <template v-slot:activator="{ props: menuProps }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="x-small"
                    v-bind="menuProps"
                    @click.stop
                  />
                </template>
                <v-list density="compact">
                  <v-list-item @click="handleEditSection(section)">
                    <v-list-item-title>
                      <v-icon start size="small">mdi-pencil</v-icon>
                      Edit
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="handleMoveUp(section)" :disabled="index === 0">
                    <v-list-item-title>
                      <v-icon start size="small">mdi-arrow-up</v-icon>
                      Move Up
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="handleMoveDown(section)" :disabled="index === sections.length - 1">
                    <v-list-item-title>
                      <v-icon start size="small">mdi-arrow-down</v-icon>
                      Move Down
                    </v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="handleDeleteSection(section)" class="text-error">
                    <v-list-item-title>
                      <v-icon start size="small">mdi-delete</v-icon>
                      Delete
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="sections.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">
              mdi-file-document-outline
            </v-icon>
            <p class="text-body-2 text-grey mb-4">No sections yet</p>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="handleAddSection"
            >
              Add First Section
            </v-btn>
          </div>
        </template>
      </div>
    </v-card-text>
    
    <!-- Add/Edit Section Dialog -->
    <v-dialog v-model="sectionDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingSection ? 'Edit Section' : 'Add Section' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="sectionForm.title"
            label="Section Title"
            variant="outlined"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="sectionDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="handleSaveSection"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import type { Section, Report } from '~/types/report'
import type { Project, Section as ProjectSection } from '~/types/project'

interface Props {
  reportId?: string
  projectId?: string
  project?: Project | null
  activeSection?: Section | null
  loading?: boolean
}

interface Emits {
  (e: 'section-selected', section: Section): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Import both systems for compatibility
const { 
  getReportById, 
  getReportSections, 
  createSection: createReportSection, 
  updateSection: updateReportSection, 
  deleteSection: deleteReportSection, 
  downloadReport 
} = useReports()

const {
  getProjectById,
  createSection: createProjectSection,
  updateSection: updateProjectSection,
  deleteSection: deleteProjectSection
} = useProjects()

// Determine which system to use
const isProjectMode = computed(() => !!props.projectId)
const project = computed(() => props.project || (props.projectId ? getProjectById(props.projectId) : null))
const report = computed(() => props.reportId ? getReportById(props.reportId) : null)

// Get sections from the appropriate source
const sections = computed(() => {
  if (isProjectMode.value && project.value?.sections) {
    // Convert project sections to report section format for compatibility
    return project.value.sections.map((section: ProjectSection, index: number) => ({
      id: section.id,
      title: section.name,
      content: section.history[section.history.length - 1]?.content || '',
      order: index,
      reportId: `project-${project.value!.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  } else if (props.reportId) {
    return getReportSections(props.reportId)
  }
  return []
})

// Debug: Watch for changes in project and sections
watch(
  () => [project.value, sections.value, project.value?.sections],
  ([newProject, newSections, projectSections]) => {
    console.log('SectionSidebar Debug - State Update:', {
      timestamp: new Date().toISOString(),
      isProjectMode: isProjectMode.value,
      projectId: props.projectId,
      hasProject: !!newProject,
      projectSectionsCount: Array.isArray(projectSections) ? projectSections.length : 0,
      convertedSectionsCount: Array.isArray(newSections) ? newSections.length : 0,
      projectSections: Array.isArray(projectSections) ? projectSections.map((s: any) => ({ id: s.id, name: s.name })) : [],
      convertedSections: Array.isArray(newSections) ? newSections.map((s: any) => ({ id: s.id, title: s.title })) : []
    })
  },
  { immediate: true, deep: true }
)

// Section Dialog
const sectionDialog = ref(false)
const editingSection = ref<Section | null>(null)
const sectionForm = ref({
  title: '',
})

const handleSectionClick = (section: Section) => {
  emit('section-selected', section)
}

const handleAddSection = () => {
  editingSection.value = null
  sectionForm.value = {
    title: '',
  }
  sectionDialog.value = true
}

const handleEditSection = (section: Section) => {
  editingSection.value = section
  sectionForm.value = {
    title: section.title,
  }
  sectionDialog.value = true
}

const handleSaveSection = async () => {
  if (!sectionForm.value.title.trim()) return
  
  try {
    if (editingSection.value) {
      // Update existing section
      if (isProjectMode.value && props.projectId) {
        await updateProjectSection(props.projectId, editingSection.value.id, {
          name: sectionForm.value.title
        })
        console.log('Section updated successfully')
      } else if (props.reportId) {
        updateReportSection(editingSection.value.id, {
          title: sectionForm.value.title,
        })
      }
    } else {
      // Create new section
      if (isProjectMode.value && props.projectId) {
        const newSection = await createProjectSection(props.projectId, {
          name: sectionForm.value.title
        })
        
        console.log('New section created:', newSection)
        
        if (newSection) {
          // The reactive state should automatically update due to useProjects managing global state
          // Convert to report section format for emission
          const reportSection = {
            id: newSection.id,
            title: newSection.name,
            content: '',
            order: sections.value.length,
            reportId: `project-${props.projectId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          // Wait for next tick to ensure reactive state is updated
          await nextTick()
          emit('section-selected', reportSection)
        }
      } else if (props.reportId) {
        const newOrder = sections.value.length + 1
        const newSection = createReportSection({
          title: sectionForm.value.title,
          content: `# ${sectionForm.value.title}\n\nStart writing your content here...`,
          order: newOrder,
          reportId: props.reportId,
        })
        
        if (newSection) {
          emit('section-selected', newSection)
        }
      }
    }
    
    sectionDialog.value = false
  } catch (error) {
    console.error('Failed to save section:', error)
  }
}

const handleDeleteSection = async (section: Section) => {
  if (confirm(`Are you sure you want to delete "${section.title}"?`)) {
    try {
      if (isProjectMode.value && props.projectId) {
        await deleteProjectSection(props.projectId, section.id)
        console.log('Section deleted successfully:', section.id)
      } else if (props.reportId) {
        deleteReportSection(section.id)
      }
      
      // Wait for reactivity to update
      await nextTick()
      
      // If this was the active section, select another section
      if (props.activeSection?.id === section.id) {
        const remainingSections = sections.value.filter((s: Section) => s.id !== section.id)
        if (remainingSections.length > 0) {
          emit('section-selected', remainingSections[0])
        } else {
          // No sections left, emit null to clear selection
          emit('section-selected', null as any)
        }
      }
    } catch (error) {
      console.error('Failed to delete section:', error)
    }
  }
}

const handleMoveUp = (section: Section) => {
  const currentIndex = sections.value.findIndex((s: Section) => s.id === section.id)
  if (currentIndex > 0) {
    const targetSection = sections.value[currentIndex - 1]
    
    if (isProjectMode.value && props.projectId) {
      // For project mode, we need to update the sectionIdsOrder
      // This would require an API endpoint or project update
      console.log('Move up not yet implemented for project mode')
    } else {
      // Swap orders for reports
      updateReportSection(section.id, { order: targetSection.order })
      updateReportSection(targetSection.id, { order: section.order })
    }
  }
}

const handleMoveDown = (section: Section) => {
  const currentIndex = sections.value.findIndex((s: Section) => s.id === section.id)
  if (currentIndex < sections.value.length - 1) {
    const targetSection = sections.value[currentIndex + 1]
    
    if (isProjectMode.value && props.projectId) {
      // For project mode, we need to update the sectionIdsOrder
      // This would require an API endpoint or project update
      console.log('Move down not yet implemented for project mode')
    } else {
      // Swap orders for reports
      updateReportSection(section.id, { order: targetSection.order })
      updateReportSection(targetSection.id, { order: section.order })
    }
  }
}

const handleDownloadReport = () => {
  if (report.value) {
    downloadReport(report.value.id)
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  
  return formatDate(dateString)
}
</script>

<style scoped>
.section-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.section-item {
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.section-item:hover {
  background-color: #f5f5f5;
}

.section-item.section-active {
  background-color: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.section-item:last-child {
  border-bottom: none;
}

.section-number {
  width: 24px;
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #757575;
}

.section-active .section-number {
  background-color: #1976d2;
  color: white;
}

.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.section-skeleton {
  min-height: 64px;
  flex-shrink: 0;
}

.section-skeleton .v-skeleton-loader {
  background-color: transparent;
}

.section-skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style> 