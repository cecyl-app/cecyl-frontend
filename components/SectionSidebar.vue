<template>
  <v-card class="h-100">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
      <h3 class="text-h6 mb-2">
          {{ activeProject?.name }}
        </h3>
        <div class="text-caption text-grey">
          Last updated: {{ formatDate(activeProject?.createdAt || new Date().toISOString()) }}
        </div>
        <div class="text-caption text-grey">
          {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}
        </div>
      </div>
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
      <div v-if="loading || !activeProject" class="pa-4 border-b">
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
      
      <div v-else-if="activeProject" class="pa-4 border-b">
        Report Sections
      </div>
      
      <!-- Download Button -->
      <div v-if="loading" class="pa-4 border-b">
        <v-skeleton-loader
          type="button"
          height="36"
          width="100%"
        />
      </div>
      
      <!-- Section List -->
      <div v-else class="section-list">
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
import type { Section } from '~/types/report'
import type { Project, Section as ProjectSection } from '~/types/project'

interface Props {
  activeSection?: Section | null
  loading?: boolean
}

interface Emits {
  (e: 'section-selected', section: Section): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  updateProject,
  createSection,
  updateSection,
  deleteSection,
  activeProject,
  downloadReport
} = useProjects()

// Debug watch for activeProject changes
watch(activeProject, (newProject, oldProject) => {
  console.log('SectionSidebar - activeProject changed:', {
    projectId: newProject?.id,
    projectName: newProject?.name,
    sectionsCount: newProject?.sections?.length || 0,
    sections: newProject?.sections?.map(s => ({ id: s.id, name: s.name })) || [],
    wasUndefined: !oldProject,
    isNowDefined: !!newProject
  })
}, { immediate: true, deep: true })

// Get sections from the activeProject ordered by sectionIdsOrder
const sections = computed(() => {
  if (activeProject.value?.sections) {
    const sectionsMap = new Map<string, ProjectSection>()
    
    // Create a map for quick section lookup
    activeProject.value.sections.forEach(section => {
      sectionsMap.set(section.id, section)
    })
    
    // If we have sectionIdsOrder, use that order; otherwise use natural order
    const orderedSections = activeProject.value.sectionIdsOrder && activeProject.value.sectionIdsOrder.length > 0
      ? activeProject.value.sectionIdsOrder
          .map(id => sectionsMap.get(id))
          .filter(Boolean) as ProjectSection[]
      : activeProject.value.sections
    
    // Convert project sections to section format for compatibility
    return orderedSections.map((section: ProjectSection, index: number) => ({
      id: section.id,
      title: section.name,
      content: section.history && section.history.length > 0 
        ? section.history[section.history.length - 1]?.content || ''
        : '',
      order: index,
      projectId: activeProject.value!.id,
      reportId: `project-${activeProject.value!.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
  return []
})

// Debug watch for sections changes
watch(sections, (newSections) => {
  console.log('SectionSidebar - sections changed:', {
    count: newSections.length,
    sections: newSections.map(s => ({ id: s.id, title: s.title })),
    projectSectionIdsOrder: activeProject.value?.sectionIdsOrder || [],
    rawSectionIds: activeProject.value?.sections?.map(s => s.id) || []
  })
}, { immediate: true })

// Debug watch for sectionIdsOrder changes specifically
watch(() => activeProject.value?.sectionIdsOrder, (newOrder, oldOrder) => {
  console.log('SectionSidebar - sectionIdsOrder changed:', {
    oldOrder,
    newOrder,
    changed: JSON.stringify(oldOrder) !== JSON.stringify(newOrder)
  })
}, { immediate: true, deep: true })

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
      if (activeProject.value?.id) {
        await updateSection(activeProject.value.id, editingSection.value.id, {
          name: sectionForm.value.title
        })
        console.log('Section updated successfully')
      }
    } else {
      // Create new section
      if (activeProject.value?.id) {
        const newSection = await createSection(activeProject.value.id, {
          name: sectionForm.value.title
        })
        
        console.log('New section created:', newSection)
        
        if (newSection) {
          // The reactive state should automatically update due to useProjects managing global state
          // Convert to section format for emission
          const sectionData = {
            id: newSection.id,
            title: newSection.name,
            content: '',
            order: sections.value.length,
            projectId: activeProject.value.id,
            reportId: `project-${activeProject.value.id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          // Wait for next tick to ensure reactive state is updated
          await nextTick()
          emit('section-selected', sectionData)
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
      if (activeProject.value?.id) {
        await deleteSection(activeProject.value.id, section.id)
        console.log('Section deleted successfully:', section.id)
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

const handleMoveUp = async (section: Section) => {
  const currentIndex = sections.value.findIndex((s: Section) => s.id === section.id)
  if (currentIndex > 0) {
    if (activeProject.value?.id) {
      try {
        // Create new section order array
        const currentOrder: string[] = activeProject.value.sectionIdsOrder && activeProject.value.sectionIdsOrder.length > 0
          ? [...activeProject.value.sectionIdsOrder]
          : activeProject.value.sections?.map(s => s.id) || []
        
        const newOrder: string[] = [...currentOrder]
        
        // Swap the sections
        const temp = newOrder[currentIndex]
        newOrder[currentIndex] = newOrder[currentIndex - 1]
        newOrder[currentIndex - 1] = temp
        
        console.log('Moving section up - Order change:', { 
          from: currentOrder, 
          to: newOrder,
          sectionName: section.title
        })
        
        // Update local state immediately for responsive UI
        activeProject.value.sectionIdsOrder = newOrder
        
        // Update project with new section order
        await updateProject(activeProject.value.id, {
          name: activeProject.value.name,
          context: activeProject.value.context,
          language: activeProject.value.language,
          sectionIdsOrder: newOrder
        })
        
        console.log('Section moved up successfully')
      } catch (error) {
        console.error('Failed to move section up:', error)
        // Revert local changes on error
        if (activeProject.value) {
          await nextTick()
          // You might want to reload the project here
        }
      }
    }
  }
}

const handleMoveDown = async (section: Section) => {
  const currentIndex = sections.value.findIndex((s: Section) => s.id === section.id)
  if (currentIndex < sections.value.length - 1) {
    if (activeProject.value?.id) {
      try {
        // Create new section order array
        const currentOrder: string[] = activeProject.value.sectionIdsOrder && activeProject.value.sectionIdsOrder.length > 0
          ? [...activeProject.value.sectionIdsOrder]
          : activeProject.value.sections?.map(s => s.id) || []
        
        const newOrder: string[] = [...currentOrder]
        
        // Swap the sections
        const temp = newOrder[currentIndex]
        newOrder[currentIndex] = newOrder[currentIndex + 1]
        newOrder[currentIndex + 1] = temp
        
        console.log('Moving section down - Order change:', { 
          from: currentOrder, 
          to: newOrder,
          sectionName: section.title
        })
        
        // Update local state immediately for responsive UI
        activeProject.value.sectionIdsOrder = newOrder
        
        // Update project with new section order
        await updateProject(activeProject.value.id, {
          name: activeProject.value.name,
          context: activeProject.value.context,
          language: activeProject.value.language,
          sectionIdsOrder: newOrder
        })
        
        console.log('Section moved down successfully')
      } catch (error) {
        console.error('Failed to move section down:', error)
        // Revert local changes on error
        if (activeProject.value) {
          await nextTick()
          // You might want to reload the project here
        }
      }
    }
  }
}

const handleDownloadReport = async () => {
  if (activeProject.value?.id) {
    console.log('Downloading report for project:', activeProject.value.id)
    const report: any = await downloadReport(activeProject.value.id)
    //report is an octet-stream to download as docx file
    const blob = new Blob([report], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
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