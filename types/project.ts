export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  createdAt: string
  timeline?: TimelinePhase[]
}

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
  referenceLink: string
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