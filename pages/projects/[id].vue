<template>
  <v-container v-if="project">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 mb-4">{{ project.name }}</h1>
        <v-chip
          :color="getStatusColor(project.status)"
          class="mb-4"
        >
          {{ project.status }}
        </v-chip>
        <p class="text-body-1 mb-6">{{ project.description }}</p>
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" color="primary">
      <v-tab value="requirements">Requirements</v-tab>
      <v-tab value="regulations">Regulations</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="requirements">
        <v-container>
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openRequirementDialog()"
              >
                Add Requirement
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-card
                v-for="requirement in projectRequirements"
                :key="requirement.id"
                class="mb-4"
              >
                <v-card-item>
                  <v-card-title>{{ requirement.title }}</v-card-title>
                  <v-card-subtitle>
                    Last updated: {{ new Date(requirement.updatedAt).toLocaleDateString() }}
                  </v-card-subtitle>
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      @click="openRequirementDialog(requirement)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      @click="deleteRequirement(requirement.id)"
                    />
                  </template>
                </v-card-item>
                <v-card-text>
                  <v-textarea
                    v-model="requirement.description"
                    auto-grow
                    variant="outlined"
                    readonly
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="regulations">
        <v-container>
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openRegulationDialog()"
              >
                Add Regulation
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="regulationHeaders"
                :items="projectRegulations"
                :items-per-page="5"
              >
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    @click="openRegulationDialog(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="deleteRegulation(item.id)"
                  />
                </template>
                <template v-slot:item.referenceLink="{ item }">
                  <v-btn
                    :href="item.referenceLink"
                    target="_blank"
                    variant="text"
                    color="primary"
                  >
                    View Reference
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>

    <!-- Requirement Dialog -->
    <v-dialog v-model="requirementDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingRequirement ? 'Edit Requirement' : 'New Requirement' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="requirementForm.title"
            label="Title"
            required
          />
          <v-textarea
            v-model="requirementForm.description"
            label="Description"
            auto-grow
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="requirementDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveRequirement"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Regulation Dialog -->
    <v-dialog v-model="regulationDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingRegulation ? 'Edit Regulation' : 'New Regulation' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="regulationForm.name"
            label="Name"
            required
          />
          <v-textarea
            v-model="regulationForm.description"
            label="Description"
            auto-grow
            required
          />
          <v-text-field
            v-model="regulationForm.referenceLink"
            label="Reference Link"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="regulationDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveRegulation"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { Project, Requirement, Regulation } from '~/types/project'

const route = useRoute()
const router = useRouter()
const { 
  getProjectById, 
  getProjectRequirements, 
  getProjectRegulations,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  createRegulation,
  updateRegulation,
  deleteRegulation,
} = useProjects()

const project = computed<Project | undefined>(() => getProjectById(route.params.id))
const projectRequirements = computed<Requirement[]>(() => getProjectRequirements(route.params.id))
const projectRegulations = computed<Regulation[]>(() => getProjectRegulations(route.params.id))

const activeTab = ref('requirements')

// Requirement Dialog
const requirementDialog = ref(false)
const editingRequirement = ref<Requirement | null>(null)
const requirementForm = ref({
  title: '',
  description: '',
})

const openRequirementDialog = (requirement?: Requirement) => {
  editingRequirement.value = requirement || null
  requirementForm.value = {
    title: requirement?.title || '',
    description: requirement?.description || '',
  }
  requirementDialog.value = true
}

const saveRequirement = () => {
  if (!project.value) return

  const requirementData = {
    title: requirementForm.value.title,
    description: requirementForm.value.description,
    projectId: project.value.id,
  }

  if (editingRequirement.value) {
    updateRequirement(editingRequirement.value.id, requirementData)
  } else {
    createRequirement(requirementData)
  }

  requirementDialog.value = false
}

// Regulation Dialog
const regulationDialog = ref(false)
const editingRegulation = ref<Regulation | null>(null)
const regulationForm = ref({
  name: '',
  description: '',
  referenceLink: '',
})

const openRegulationDialog = (regulation?: Regulation) => {
  editingRegulation.value = regulation || null
  regulationForm.value = {
    name: regulation?.name || '',
    description: regulation?.description || '',
    referenceLink: regulation?.referenceLink || '',
  }
  regulationDialog.value = true
}

const saveRegulation = () => {
  if (!project.value) return

  const regulationData = {
    name: regulationForm.value.name,
    description: regulationForm.value.description,
    referenceLink: regulationForm.value.referenceLink,
    projectId: project.value.id,
  }

  if (editingRegulation.value) {
    updateRegulation(editingRegulation.value.id, regulationData)
  } else {
    createRegulation(regulationData)
  }

  regulationDialog.value = false
}

const regulationHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Reference', key: 'referenceLink' },
  { title: 'Actions', key: 'actions', sortable: false },
]

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