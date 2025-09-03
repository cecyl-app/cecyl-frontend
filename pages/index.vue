<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h3">Pharmaceutical Projects</h1>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openProjectDialog()"
        >
          New Project
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="project in projects"
        :key="project.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="h-100"
          hover
        >
          <v-card-item>
            <v-card-title>{{ project.name }}</v-card-title>
            <template v-slot:append>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                @click="openProjectDialog(project)"
                :disabled="loading"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="handleDeleteProject(project.id)"
                :disabled="loading"
              />
            </template>
          </v-card-item>
          <v-card-text>
            {{ project.context }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              :to="`/projects/${project.id}`"
            >
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Project Dialog -->
    <v-dialog v-model="projectDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingProject ? 'Edit Project' : 'New Project' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="projectForm.name"
            label="Project Name"
            required
          />
          <v-textarea
            v-model="projectForm.context"
            label="Context"
            auto-grow
            required
          />
          <v-select
            v-model="projectForm.language"
            :items="[
              { title: 'Italian', value: 'italian' },
              { title: 'English', value: 'english' },
              { title: 'Spanish', value: 'spanish' },
              { title: 'French', value: 'french' }
            ]"
            label="Language"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="projectDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveProject"
            :loading="loading"
            :disabled="!projectForm.name.trim() || !projectForm.context.trim()"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { Project } from '~/types/project'

definePageMeta({
  middleware: 'auth'
})

const { 
  projects, 
  createProject, 
  updateProject, 
  deleteProject,
  fetchProjects 
} = useProjects()

// Project Dialog
const projectDialog = ref(false)
const editingProject = ref<Project | null>(null)
const projectForm = ref<{
  name: string
  context: string
  language: string
}>({
  name: '',
  context: '',
  language: 'italian',
})

// Loading state
const loading = ref(false)

const openProjectDialog = (project?: Project) => {
  editingProject.value = project || null
  projectForm.value = {
    name: project?.name || '',
    context: project?.context || '',
    language: project?.language || 'italian',
  }
  projectDialog.value = true
}

const saveProject = async () => {
  loading.value = true
  try {
    if (editingProject.value) {
      await updateProject(editingProject.value.id, {
        ...projectForm.value,
        sectionIdsOrder: editingProject.value.sectionIdsOrder || []
      })
    } else {
      await createProject(projectForm.value)
    }
    projectDialog.value = false
  } catch (error) {
    console.error('Failed to save project:', error)
  } finally {
    loading.value = false
  }
}

const handleDeleteProject = async (id: string) => {
  loading.value = true
  try {
    await deleteProject(id)
  } catch (error) {
    console.error('Failed to delete project:', error)
  } finally {
    loading.value = false
  }
}

// Load projects when component mounts
onMounted(async () => {
  loading.value = true
  try {
    await fetchProjects()
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Component styles can go here */
</style>
