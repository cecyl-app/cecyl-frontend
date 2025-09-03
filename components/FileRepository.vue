<template>
  <v-card class="h-100 d-flex flex-column">
    <v-card-title class="d-flex justify-space-between align-center flex-shrink-0">
      <span>File Repository</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-upload"
        size="small"
        @click="handleUploadClick"
      >
        Upload
      </v-btn>
    </v-card-title>
    
    <v-card-text class="pa-0 flex-grow-1 d-flex flex-column overflow-hidden">
      <!-- File Upload Area -->
      <div
        ref="dropZone"
        class="upload-zone pa-3 ma-3 text-center border-dashed flex-shrink-0"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="handleUploadClick"
      >
        <v-icon size="40" color="grey-lighten-1" class="mb-2">
          mdi-cloud-upload
        </v-icon>
        <p class="text-body-2 text-grey mb-1">
          Drop files here or click to upload
        </p>
        <p class="text-caption text-grey-lighten-1">
          Supported: PDF
        </p>
      </div>
      
      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        multiple
        class="d-none"
        @change="handleFileSelect"
      />
      
      <!-- Upload Progress -->
      <v-card v-if="isUploading" class="ma-3 flex-shrink-0" variant="outlined">
        <v-card-text class="py-2">
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              color="primary"
              size="20"
              class="me-3"
            />
            <span class="text-body-2">Uploading files...</span>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- File List Container -->
      <div class="file-list-wrapper flex-grow-1 d-flex flex-column min-h-0">
        <v-divider class="flex-shrink-0" />
        <div class="file-list flex-grow-1 overflow-y-auto">
          <div
            v-for="file in files"
            :key="file.id"
            class="file-item pa-3 d-flex align-center border-b"
          >
            <v-icon
              :icon="getFileIcon('pdf')"
              :color="getFileColor('pdf')"
              size="20"
              class="me-3"
            />
            
            <div class="flex-grow-1 min-w-0">
              <div class="text-body-2 font-weight-medium text-truncate">
                {{ file.filename }}
              </div>
            </div>
            
            <div class="ml-2 d-flex">
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="handleDelete(file.id)"
              />
            </div>
          </div>
          
          <div v-if="files.length === 0" class="text-center pa-6">
            <v-icon size="48" color="grey-lighten-2" class="mb-3">
              mdi-folder-open
            </v-icon>
            <p class="text-body-2 text-grey">No files uploaded yet</p>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ExtendedProjectFile } from '~/types/project'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const {  
  loadProjectFiles,
  uploadFiles, 
  deleteFile, 
  formatFileSize, 
  getFileIcon, 
  isUploading,
  files
} = useFiles()

const fileInput = ref<HTMLInputElement>()
const dropZone = ref<HTMLElement>()
const isDragOver = ref(false)

// Load files when component mounts or projectId changes
onMounted(() => {
  if (props.projectId) {
    loadProjectFiles(props.projectId)
  }
})

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    loadProjectFiles(newProjectId)
  }
})

const handleUploadClick = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return
  
  await handleFiles(Array.from(target.files))
  target.value = '' // Reset input
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (!event.dataTransfer?.files) return
  
  await handleFiles(Array.from(event.dataTransfer.files))
}

const handleFiles = async (files: File[]) => {
  if (files.length === 0) return
  
  // Filter supported file types
  const supportedTypes = [
    'application/pdf'
  ]
  
  const validFiles = files.filter(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.warn(`File ${file.name} is too large (max 10MB)`)
      return false
    }
    
    if (!supportedTypes.some(type => file.type.startsWith(type.split('/')[0]) || file.type === type)) {
      console.warn(`File type ${file.type} is not supported`)
      return false
    }
    
    return true
  })
  
  if (validFiles.length === 0) {
    console.warn('No valid files to upload')
    return
  }
  
  // Upload all files in a single request
  try {
    const uploadedFiles = await uploadFiles(validFiles, props.projectId)
    
    // Show success message
    if (uploadedFiles.length > 0) {
      console.log(`Successfully uploaded ${uploadedFiles.length} file(s)`)
      // Optionally trigger a refresh of the file list
      await loadProjectFiles(props.projectId)
    }
  } catch (error) {
    console.error('Failed to upload files:', error)
    // Could add user-friendly error notification here
  }
}

const handleDelete = async (fileId: string) => {
  if (confirm('Are you sure you want to delete this file?')) {
    try {
      await deleteFile(fileId, props.projectId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

const getFileColor = (fileType: string): string => {
  if (fileType.includes('pdf')) return 'red'
  return 'grey'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 100px;
  max-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: #1976d2;
  background-color: #f3f8ff;
}

.file-list-wrapper {
  min-height: 0;
  overflow: hidden;
}

.file-list {
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  height: 100%;
}

.file-item {
  border-bottom: 1px solid #e0e0e0;
  min-height: 64px;
  flex-shrink: 0;
}

.file-item:last-child {
  border-bottom: none;
}

.border-dashed {
  border-style: dashed !important;
}

.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.min-w-0 {
  min-width: 0;
}

.min-h-0 {
  min-height: 0;
}

.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.flex-grow-1 {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.d-flex {
  display: flex;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style> 