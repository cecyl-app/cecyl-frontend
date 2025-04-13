import type { Project, Requirement, Regulation, TimelinePhase } from '~/types/project'

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'COVID-19 Vaccine Development',
    description: 'Development of a new mRNA-based COVID-19 vaccine',
    status: 'active',
    createdAt: '2024-01-15',
    timeline: [
      {
        id: '1',
        name: 'Research & Development',
        description: 'Initial research and development phase',
        duration: 12,
        durationUnit: 'weeks',
        status: 'completed',
        projectId: '1',
      },
      {
        id: '2',
        name: 'Pre-clinical Trials',
        description: 'Animal testing and safety assessment',
        duration: 8,
        durationUnit: 'weeks',
        status: 'completed',
        projectId: '1',
      },
      {
        id: '3',
        name: 'Phase I Clinical Trials',
        description: 'Safety testing in healthy volunteers',
        duration: 6,
        durationUnit: 'weeks',
        status: 'in-progress',
        projectId: '1',
      },
    ],
  },
  {
    id: '2',
    name: 'Cancer Drug Research',
    description: 'Research and development of new cancer treatment drugs',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Diabetes Medication',
    description: 'Development of new insulin delivery system',
    status: 'on-hold',
    createdAt: '2024-03-10',
  },
]

const mockRequirements: Requirement[] = [
  {
    id: '1',
    title: 'Clinical Trial Protocol',
    description: 'Detailed protocol for Phase III clinical trials including patient selection criteria, dosage regimen, and monitoring procedures.',
    projectId: '1',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
  },
  {
    id: '2',
    title: 'Manufacturing Process',
    description: 'Standard operating procedures for vaccine manufacturing including quality control measures and batch testing protocols.',
    projectId: '1',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },
]

const mockRegulations: Regulation[] = [
  {
    id: '1',
    name: 'EMA Regulation N. 21',
    description: 'Good Manufacturing Practice (GMP) guidelines for pharmaceutical products',
    referenceLinks: ['www.ema.it/rule21', 'www.fda.gov/regulations/guidelines/21'],
    projectId: '1',
  },
  {
    id: '2',
    name: 'Clean Room Standards',
    description: 'All pharmaceutical instruments need to be cleaned before use according to ISO 14644-1 standards',
    referenceLinks: ['www.iso.org/14644-1', 'www.gov.uk/iso14644'],
    projectId: '1',
  },
]

export const useProjects = () => {
  const projects = ref<Project[]>(mockProjects)
  const requirements = ref<Requirement[]>(mockRequirements)
  const regulations = ref<Regulation[]>(mockRegulations)

  // Project CRUD
  const createProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    projects.value.push(newProject)
    return newProject
  }

  const updateProject = (id: string, project: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...project }
    }
  }

  const deleteProject = (id: string) => {
    projects.value = projects.value.filter(p => p.id !== id)
    // Also delete related requirements and regulations
    requirements.value = requirements.value.filter(r => r.projectId !== id)
    regulations.value = regulations.value.filter(r => r.projectId !== id)
  }

  // Requirement CRUD
  const createRequirement = (requirement: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRequirement: Requirement = {
      ...requirement,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    requirements.value.push(newRequirement)
    return newRequirement
  }

  const updateRequirement = (id: string, requirement: Partial<Requirement>) => {
    const index = requirements.value.findIndex(r => r.id === id)
    if (index !== -1) {
      requirements.value[index] = {
        ...requirements.value[index],
        ...requirement,
        updatedAt: new Date().toISOString(),
      }
    }
  }

  const deleteRequirement = (id: string) => {
    requirements.value = requirements.value.filter(r => r.id !== id)
  }

  // Regulation CRUD
  const createRegulation = (regulation: Omit<Regulation, 'id'>) => {
    const newRegulation: Regulation = {
      ...regulation,
      id: Date.now().toString(),
    }
    regulations.value.push(newRegulation)
    return newRegulation
  }

  const updateRegulation = (id: string, regulation: Partial<Regulation>) => {
    const index = regulations.value.findIndex(r => r.id === id)
    if (index !== -1) {
      regulations.value[index] = { ...regulations.value[index], ...regulation }
    }
  }

  const deleteRegulation = (id: string) => {
    regulations.value = regulations.value.filter(r => r.id !== id)
  }

  // Timeline CRUD
  const createTimelinePhase = (phase: Omit<TimelinePhase, 'id'>) => {
    const newPhase: TimelinePhase = {
      ...phase,
      id: Date.now().toString(),
    }
    const project = projects.value.find(p => p.id === phase.projectId)
    if (project) {
      if (!project.timeline) {
        project.timeline = []
      }
      project.timeline.push(newPhase)
    }
    return newPhase
  }

  const updateTimelinePhase = (id: string, phase: Partial<TimelinePhase>) => {
    const project = projects.value.find(p => p.timeline?.some(t => t.id === id))
    if (project?.timeline) {
      const index = project.timeline.findIndex(t => t.id === id)
      if (index !== -1) {
        project.timeline[index] = { ...project.timeline[index], ...phase }
      }
    }
  }

  const deleteTimelinePhase = (id: string) => {
    const project = projects.value.find(p => p.timeline?.some(t => t.id === id))
    if (project?.timeline) {
      project.timeline = project.timeline.filter(t => t.id !== id)
    }
  }

  const getProjectTimeline = (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId)
    return project?.timeline || []
  }

  // Getters
  const getProjectById = (id: string) => {
    return projects.value.find(project => project.id === id)
  }

  const getProjectRequirements = (projectId: string) => {
    return requirements.value.filter(req => req.projectId === projectId)
  }

  const getProjectRegulations = (projectId: string) => {
    return regulations.value.filter(reg => reg.projectId === projectId)
  }

  return {
    projects,
    requirements,
    regulations,
    createProject,
    updateProject,
    deleteProject,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    createRegulation,
    updateRegulation,
    deleteRegulation,
    createTimelinePhase,
    updateTimelinePhase,
    deleteTimelinePhase,
    getProjectTimeline,
    getProjectById,
    getProjectRequirements,
    getProjectRegulations,
  }
} 