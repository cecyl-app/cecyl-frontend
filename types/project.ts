import type { Report } from './report'

export interface Project {
  id: string
  name: string
  context: string
  language: string
  sectionIdsOrder: string[]
  sections?: Section[]
  createdAt?: string
}

export interface Section {
  id: string
  name: string
  history: HistoryItem[]
}

export interface HistoryItem {
  content: string
  type: string
}

// API Response types for section operations
export interface SectionCreateRequest {
  name: string
}

export interface SectionUpdateRequest {
  name: string
}

export interface AIPromptRequest {
  prompt: string
}

export interface AIPromptResponse {
  output: string
}

export interface ContentUpdateRequest {
  prompt: string
}

// File management types
export interface ProjectFile {
  id: string
  filename: string
  size: string
}

export interface FileUploadResponse {
  files: ProjectFile[]
}

// Extended file interface for UI (includes additional computed fields)
export interface ExtendedProjectFile extends ProjectFile {
  name: string        // alias for filename for backward compatibility
  type?: string      // mime type (computed from extension)
  url?: string       // download URL
  uploadedAt?: string // upload timestamp
  sizeBytes?: number // size in bytes for calculations
}

// Keep existing interfaces for backward compatibility
export interface Requirement {
  id: string
  title: string
  description: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface Regulation {
  id: string
  name: string
  description: string
  referenceLinks: string[]
  projectId: string
}

export interface TimelinePhase {
  id: string
  name: string
  description: string
  duration: number
  durationUnit: 'days' | 'weeks' | 'months'
  startDate?: string
  endDate?: string
  status: 'planned' | 'in-progress' | 'completed'
  projectId: string
} 