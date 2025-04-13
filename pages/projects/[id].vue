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
      <v-tab value="timeline">Timeline</v-tab>
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
                <template v-slot:item.referenceLinks="{ item }">
                  <div class="d-flex flex-wrap gap-1">
                    <v-tooltip
                      v-for="(link, index) in item.referenceLinks"
                      :key="index"
                      :text="link.trim()"
                      location="top"
                    >
                      <template v-slot:activator="{ props }">
                        <v-chip
                          v-bind="props"
                          :href="link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`"
                          target="_blank"
                          variant="outlined"
                          rel="noopener noreferrer"
                          class="text-decoration-none ma-1"
                          density="comfortable"
                        >
                          {{ getShortLink(link.trim()) }}
                        </v-chip>
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="timeline">
        <v-container>
          <v-row>
            <v-col cols="12" class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openTimelineDialog()"
              >
                Add Phase
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-timeline>
                <v-timeline-item
                  v-for="phase in projectTimeline"
                  :key="phase.id"
                  :color="getPhaseColor(phase.status)"
                  :icon="getPhaseIcon(phase.status)"
                >
                  <template v-slot:opposite>
                    {{ phase.duration }} {{ phase.durationUnit }}
                  </template>
                  <v-card>
                    <v-card-title>{{ phase.name }}</v-card-title>
                    <v-card-text>{{ phase.description }}</v-card-text>
                    <v-card-actions>
                      <v-chip :color="getPhaseColor(phase.status)">
                        {{ phase.status }}
                      </v-chip>
                      <v-spacer></v-spacer>
                      <v-btn icon @click="openTimelineDialog(phase)">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn icon @click="deleteTimelinePhase(phase.id)">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
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
          <v-textarea
            v-model="regulationForm.referenceLinks"
            label="Reference Links (one per line)"
            auto-grow
            required
            hint="Enter one reference link per line"
            persistent-hint
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

    <!-- Timeline Dialog -->
    <v-dialog v-model="timelineDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingTimeline ? 'Edit Phase' : 'New Phase' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="timelineForm.name"
            label="Name"
            required
          />
          <v-textarea
            v-model="timelineForm.description"
            label="Description"
            auto-grow
            required
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="timelineForm.duration"
                label="Duration"
                type="number"
                required
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="timelineForm.durationUnit"
                :items="['days', 'weeks', 'months']"
                label="Unit"
                required
              />
            </v-col>
          </v-row>
          <v-select
            v-model="timelineForm.status"
            :items="['not-started', 'in-progress', 'completed']"
            label="Status"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="timelineDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveTimeline"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { Project, Requirement, Regulation, TimelinePhase } from '~/types/project'

const route = useRoute()
const router = useRouter()
const { 
  getProjectById, 
  getProjectRequirements, 
  getProjectRegulations,
  getProjectTimeline,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  createRegulation,
  updateRegulation,
  deleteRegulation,
  createTimelinePhase,
  updateTimelinePhase,
  deleteTimelinePhase
} = useProjects()

const project = computed<Project | undefined>(() => getProjectById(route.params.id))
const projectRequirements = computed<Requirement[]>(() => getProjectRequirements(route.params.id))
const projectRegulations = computed<Regulation[]>(() => getProjectRegulations(route.params.id))
const projectTimeline = computed<TimelinePhase[]>(() => getProjectTimeline(route.params.id))

const activeTab = ref('requirements')

// Requirement Dialog
const requirementDialog = ref(false)
const editingRequirement = ref<Requirement | null>(null)
const requirementForm = ref({
  title: '',
  description: '',
  projectId: project?.id || '',
})

const openRequirementDialog = (requirement?: Requirement) => {
  editingRequirement.value = requirement || null
  requirementForm.value = {
    title: requirement?.title || '',
    description: requirement?.description || '',
    projectId: project?.id || '',
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
  referenceLinks: '',
  projectId: project?.id || '',
})

const openRegulationDialog = (regulation?: Regulation) => {
  editingRegulation.value = regulation || null
  regulationForm.value = {
    name: regulation?.name || '',
    description: regulation?.description || '',
    referenceLinks: regulation?.referenceLinks?.join('\n') || '',
    projectId: project?.id || '',
  }
  regulationDialog.value = true
}

const saveRegulation = () => {
  if (!project.value) return

  const regulationData = {
    name: regulationForm.value.name,
    description: regulationForm.value.description,
    referenceLinks: regulationForm.value.referenceLinks.split('\n').filter(link => link.trim()),
    projectId: project.value.id,
  }

  if (editingRegulation.value) {
    updateRegulation(editingRegulation.value.id, regulationData)
  } else {
    createRegulation(regulationData)
  }

  regulationDialog.value = false
}

// Timeline Dialog
const timelineDialog = ref(false)
const editingTimeline = ref<TimelinePhase | null>(null)
const timelineForm = ref({
  name: '',
  description: '',
  duration: 0,
  durationUnit: 'weeks',
  status: 'not-started',
  projectId: project?.id || '',
})

const openTimelineDialog = (phase?: TimelinePhase) => {
  editingTimeline.value = phase || null
  timelineForm.value = {
    name: phase?.name || '',
    description: phase?.description || '',
    duration: phase?.duration || 0,
    durationUnit: phase?.durationUnit || 'weeks',
    status: phase?.status || 'not-started',
    projectId: project?.id || '',
  }
  timelineDialog.value = true
}

const saveTimeline = () => {
  if (!project.value) return

  const timelineData = {
    name: timelineForm.value.name,
    description: timelineForm.value.description,
    duration: timelineForm.value.duration,
    durationUnit: timelineForm.value.durationUnit,
    status: timelineForm.value.status,
    projectId: project.value.id,
  }

  if (editingTimeline.value) {
    updateTimelinePhase(editingTimeline.value.id, timelineData)
  } else {
    createTimelinePhase(timelineData)
  }

  timelineDialog.value = false
}

const regulationHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Reference', key: 'referenceLinks' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'on-hold':
      return 'warning'
    case 'completed':
      return 'info'
    default:
      return 'grey'
  }
}

const getPhaseColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'primary'
    case 'not-started':
      return 'grey'
    default:
      return 'grey'
  }
}

const getPhaseIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return 'mdi-check-circle'
    case 'in-progress':
      return 'mdi-progress-clock'
    case 'not-started':
      return 'mdi-circle-outline'
    default:
      return 'mdi-circle'
  }
}

const getShortLink = (link: string) => {
  // Remove protocol and www if present
  const cleanLink = link.replace(/^(https?:\/\/)?(www\.)?/, '')
  // Get the domain and first part of the path
  const parts = cleanLink.split('/')
  return parts[0] + (parts[1] ? '/...' : '')
}
</script> 