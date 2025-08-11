export interface Report {
    id: string
    title: string
    projectId: string
    sections: Section[]
    createdAt: string
    updatedAt: string
}

export interface Section {
    id: string
    title: string
    content: string
    order: number
    reportId: string
    createdAt: string
    updatedAt: string
}

export interface ProjectFile {
    id: string
    name: string
    size: number
    type: string
    url: string
    projectId: string
    uploadedAt: string
}

export interface AiPrompt {
    id: string
    text: string
    type: 'enhance' | 'summarize' | 'expand' | 'rewrite'
    sectionId: string
    result?: string
    createdAt: string
} 