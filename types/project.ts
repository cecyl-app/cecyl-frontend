export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  createdAt: string
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