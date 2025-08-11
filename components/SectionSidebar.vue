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
      <!-- Report Header -->
      <div v-if="report" class="pa-4 border-b">
        <h3 class="text-h6 mb-2">{{ report.title }}</h3>
        <div class="text-caption text-grey">
          Last updated: {{ formatDate(report.updatedAt) }}
        </div>
        <div class="text-caption text-grey">
          {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}
        </div>
      </div>
      
      <!-- Download Button -->
      <div class="pa-4 border-b">
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

interface Props {
  reportId: string
  activeSection?: Section | null
}

interface Emits {
  (e: 'section-selected', section: Section): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { 
  getReportById, 
  getReportSections, 
  createSection, 
  updateSection, 
  deleteSection, 
  downloadReport 
} = useReports()

const report = computed(() => getReportById(props.reportId))
const sections = computed(() => getReportSections(props.reportId))

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

const handleSaveSection = () => {
  if (!sectionForm.value.title.trim()) return
  
  if (editingSection.value) {
    // Update existing section
    updateSection(editingSection.value.id, {
      title: sectionForm.value.title,
    })
  } else {
    // Create new section
    const newOrder = sections.value.length + 1
    const newSection = createSection({
      title: sectionForm.value.title,
      content: `# ${sectionForm.value.title}\n\nStart writing your content here...`,
      order: newOrder,
      reportId: props.reportId,
    })
    
    if (newSection) {
      emit('section-selected', newSection)
    }
  }
  
  sectionDialog.value = false
}

const handleDeleteSection = (section: Section) => {
  if (confirm(`Are you sure you want to delete "${section.title}"?`)) {
    deleteSection(section.id)
    
    // If this was the active section, clear the selection
    if (props.activeSection?.id === section.id) {
      const remainingSections = sections.value.filter(s => s.id !== section.id)
      if (remainingSections.length > 0) {
        emit('section-selected', remainingSections[0])
      }
    }
  }
}

const handleMoveUp = (section: Section) => {
  const currentIndex = sections.value.findIndex(s => s.id === section.id)
  if (currentIndex > 0) {
    const targetSection = sections.value[currentIndex - 1]
    
    // Swap orders
    updateSection(section.id, { order: targetSection.order })
    updateSection(targetSection.id, { order: section.order })
  }
}

const handleMoveDown = (section: Section) => {
  const currentIndex = sections.value.findIndex(s => s.id === section.id)
  if (currentIndex < sections.value.length - 1) {
    const targetSection = sections.value[currentIndex + 1]
    
    // Swap orders
    updateSection(section.id, { order: targetSection.order })
    updateSection(targetSection.id, { order: section.order })
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
</style> 