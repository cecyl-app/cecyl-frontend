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
            <v-card-subtitle>
              <v-chip
                :color="getStatusColor(project.status)"
                size="small"
                class="mt-2"
              >
                {{ project.status }}
              </v-chip>
            </v-card-subtitle>
            <template v-slot:append>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                @click="openProjectDialog(project)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="deleteProject(project.id)"
              />
            </template>
          </v-card-item>
          <v-card-text>
            {{ project.description }}
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
            v-model="projectForm.description"
            label="Description"
            auto-grow
            required
          />
          <v-select
            v-model="projectForm.status"
            :items="['active', 'on-hold', 'completed']"
            label="Status"
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

const { 
  projects, 
  createProject, 
  updateProject, 
  deleteProject 
} = useProjects()

// Project Dialog
const projectDialog = ref(false)
const editingProject = ref<Project | null>(null)
const projectForm = ref<{
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
}>({
  name: '',
  description: '',
  status: 'active',
})

const openProjectDialog = (project?: Project) => {
  editingProject.value = project || null
  projectForm.value = {
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
  }
  projectDialog.value = true
}

const saveProject = () => {
  if (editingProject.value) {
    updateProject(editingProject.value.id, projectForm.value)
  } else {
    createProject(projectForm.value)
  }
  projectDialog.value = false
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'on-hold':
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped>
/* Component styles can go here */
</style>
