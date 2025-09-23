import axios, { type AxiosResponse } from 'axios'
import type {
  Project,
  Section,
  ProjectFile,
  FileUploadResponse,
  Requirement,
  Regulation,
  TimelinePhase
} from '~/types/project'

// Base API URL from environment variable
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for handling cookies
  timeout: 300000, // 300 seconds timeout
})

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)

    // Handle authentication errors globally
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Use the auth composable's error handler
      const { handleApiError } = useAuth()
      handleApiError(error.response)
    }

    return Promise.reject(error)
  }
)

// Global reactive state - shared across all component instances
const projects = ref<Project[]>([])
const requirements = ref<Requirement[]>([])
const regulations = ref<Regulation[]>([])
const activeProject = ref<Project | null>(null)

export const useProjects = () => {
  // API Helper function
  //This function is correct, never change it.
  const apiCall = async <T>(endpoint: string, options: any = {}): Promise<T> => {
    try {
      if (options.method !== 'PUT') {
        const response = await apiClient.request<T>({
          url: endpoint,
          ...options,
        })
        return response.data
      }
      else {
        await apiClient.request<T>({
          url: endpoint,
          ...options,
        })
        return options.data
      }
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Project CRUD Operations
  const createProject = async (projectData: { name: string; context: string; language: string }) => {
    try {
      const response = await apiCall<Project>('/projects', {
        method: 'POST',
        data: {
          name: projectData.name,
          context: projectData.context,
          language: projectData.language || 'italian'
        },
      })

      projects.value.push({
        id: response.id,
        ...projectData,
        sectionIdsOrder: []
      })
      return response
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  const updateProject = async (id: string, projectData: { name: string; context: string; language: string; sectionIdsOrder: string[] }) => {
    try {
      const response = await apiCall<Project>(`/projects/${id}`, {
        method: 'PUT',
        data: { ...projectData, language: 'italian' }
      })
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        // Preserve existing sections if response doesn't include them
        const updatedProject = {
          ...response,
          id,
          sections: response.sections || projects.value[index].sections
        }
        projects.value[index] = updatedProject

        // Update activeProject only if this is the active project
        if (activeProject.value?.id === id) {
          activeProject.value = { ...updatedProject }
        }
      }

      console.log('updateProject - activeProject after update:', {
        projectId: activeProject.value?.id,
        projectName: activeProject.value?.name,
        sectionsCount: activeProject.value?.sections?.length || 0
      })

      return response
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await apiCall<Project[]>('/projects', {
        method: 'GET',
      })
      projects.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    }
  }

  const fetchProjectById = async (id: string) => {
    try {
      const response = await apiCall<Project>(`/projects/${id}`, {
        method: 'GET',
      })

      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = {
          ...response,
          id
        }
        activeProject.value = {
          ...response,
          id
        }
      } else {
        projects.value.push({
          ...response,
          id
        })
        activeProject.value = {
          ...response,
          id
        }
      }

      console.log('useProjects - activeProject updated:', {
        projectId: activeProject.value?.id,
        projectName: activeProject.value?.name,
        sectionsCount: activeProject.value?.sections?.length || 0
      })

      return response
    } catch (error) {
      console.error('Failed to fetch project details:', error)
      throw error
    }
  }

  const deleteProject = async (id: string) => {
    try {
      await apiCall(`/projects/${id}`, {
        method: 'DELETE',
      })

      projects.value = projects.value.filter(p => p.id !== id)
      // Also delete related requirements and regulations
      requirements.value = requirements.value.filter(r => r.projectId !== id)
      regulations.value = regulations.value.filter(r => r.projectId !== id)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  // Section CRUD Operations
  const createSection = async (projectId: string, sectionData: { name: string }) => {
    try {
      const response = await apiCall<Section>(`/projects/${projectId}/sections`, {
        method: 'POST',
        data: {
          name: sectionData.name
        },
      })
      activeProject.value?.sections?.push({ ...sectionData, id: response.id, history: [] })

      return response
    } catch (error) {
      console.error('Failed to create section:', error)
      throw error
    }
  }

  const updateSection = async (projectId: string, sectionId: string, sectionData: { name: string }) => {
    try {
      const response = await apiCall<Section>(`/projects/${projectId}/sections/${sectionId}`, {
        method: 'PUT',
        data: {
          name: sectionData.name
        },
      })

      // Update the local project section
      const projectIndex = projects.value.findIndex(p => p.id === projectId)
      if (projectIndex !== -1 && projects.value[projectIndex].sections) {
        const sectionIndex = projects.value[projectIndex].sections!.findIndex(s => s.id === sectionId)
        if (sectionIndex !== -1) {
          projects.value[projectIndex].sections![sectionIndex] = response

          // Update activeProject to trigger reactivity
          if (activeProject.value && activeProject.value.id === projectId) {
            activeProject.value = { ...projects.value[projectIndex] }
          }
        }
      }

      return response
    } catch (error) {
      console.error('Failed to update section:', error)
      throw error
    }
  }

  const deleteSection = async (projectId: string, sectionId: string) => {
    try {
      await apiCall(`/projects/${projectId}/sections/${sectionId}`, {
        method: 'DELETE',
      })

      // Remove the section from local project
      // Update activeProject to trigger reactivity
      if (activeProject.value && activeProject.value.id === projectId) {
        activeProject.value.sections = activeProject.value.sections!.filter(s => s.id !== sectionId)
      }

    } catch (error) {
      console.error('Failed to delete section:', error)
      throw error
    }
  }

  const askAIForSection = async (projectId: string, sectionId: string, prompt: string) => {
    try {
      const response = await apiCall<{ output: string }>(`/projects/${projectId}/sections/${sectionId}/ask`, {
        method: 'POST',
        data: {
          prompt: prompt
        },
      })

      return response.output
    } catch (error) {
      console.error('Failed to get AI response for section:', error)
      throw error
    }
  }

  const improveSectionContent = async (projectId: string, sectionId: string, content: string) => {
    try {
      const response = await apiCall(`/projects/${projectId}/sections/${sectionId}/improve`, {
        method: 'POST',
        data: {
          prompt: content
        },
      })

      // Update the section content in the local project if needed
      const projectIndex = projects.value.findIndex(p => p.id === projectId)
      if (projectIndex !== -1 && projects.value[projectIndex].sections) {
        const sectionIndex = projects.value[projectIndex].sections!.findIndex(s => s.id === sectionId)
        if (sectionIndex !== -1) {
          // Add new history entry
          const newHistoryItem = {
            content: content,
            type: 'user_edit'
          }
          projects.value[projectIndex].sections![sectionIndex].history.push(newHistoryItem)
        }
      }

      return response
    } catch (error) {
      console.error('Failed to improve section content:', error)
      throw error
    }
  }

  // File Management Operations
  const fetchProjectFiles = async (projectId: string) => {
    try {
      const response = await apiCall<ProjectFile[]>(`/projects/${projectId}/search-files`, {
        method: 'GET',
      })
      return response
    } catch (error) {
      console.error('Failed to fetch project files:', error)
      throw error
    }
  }

  const uploadProjectFiles = async (projectId: string, files: File[]) => {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append(`search_file_${i}`, files[i])
      }

      const response = await apiCall<FileUploadResponse>(`/projects/${projectId}/search-files`, {
        method: 'POST',
        data: formData,
        headers: {
          // Remove Content-Type to let browser set it with boundary for FormData
          'Content-Type': undefined,
        },
      })

      return response
    } catch (error) {
      console.error('Failed to upload files:', error)
      throw error
    }
  }

  const deleteProjectFile = async (projectId: string, fileId: string) => {
    try {
      await apiCall(`/projects/${projectId}/search-files/${fileId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  const setActiveProject = async (id: string) => {
    console.log('Setting active project:', id)
    const project = await fetchProjectById(id)
    if (project) {
      activeProject.value = {
        ...project,
        id
      }
    }
    return project
  }

  const getProjectRequirements = (projectId: string) => {
    return requirements.value.filter(req => req.projectId === projectId)
  }

  const getProjectRegulations = (projectId: string) => {
    return regulations.value.filter(reg => reg.projectId === projectId)
  }

  // Legacy functions for backward compatibility (using mock data for now)
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

  const createTimelinePhase = (phase: Omit<TimelinePhase, 'id'>) => {
    const newPhase: TimelinePhase = {
      ...phase,
      id: Date.now().toString(),
    }
    // Note: Timeline functionality may need backend API support
    return newPhase
  }

  const updateTimelinePhase = (id: string, phase: Partial<TimelinePhase>) => {
    // Note: Timeline functionality may need backend API support
  }

  const deleteTimelinePhase = (id: string) => {
    // Note: Timeline functionality may need backend API support
  }

  const getProjectTimeline = (projectId: string) => {
    // Note: Timeline functionality may need backend API support
    return []
  }

  const downloadReport = async (projectId: string) => {
    try {
      const response = await apiCall(`/projects/${projectId}/generateDocx`, {
        method: 'POST',
      })
      return response
    } catch (error) {
      console.error('Failed to download report:', error)
      throw error
    }
  }

  return {
    projects,
    requirements,
    regulations,
    activeProject,
    // Main project API functions
    createProject,
    updateProject,
    deleteProject,
    fetchProjects,
    fetchProjectById,
    setActiveProject,
    // Section API functions
    createSection,
    updateSection,
    deleteSection,
    askAIForSection,
    improveSectionContent,
    // File management API functions
    fetchProjectFiles,
    uploadProjectFiles,
    deleteProjectFile,
    // Legacy functions for compatibility
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
    getProjectRequirements,
    getProjectRegulations,
    downloadReport,
  }
} 