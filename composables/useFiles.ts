import type { ProjectFile } from '~/types/report'

// Mock data for files
const mockFiles: ProjectFile[] = [
    {
        id: '1',
        name: 'research_data.pdf',
        size: 2048576, // 2MB
        type: 'application/pdf',
        url: '/uploads/research_data.pdf',
        projectId: '1',
        uploadedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: '2',
        name: 'trial_results.xlsx',
        size: 1024000, // 1MB
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '/uploads/trial_results.xlsx',
        projectId: '1',
        uploadedAt: '2024-01-15T11:45:00Z',
    },
    {
        id: '3',
        name: 'safety_profile.docx',
        size: 512000, // 500KB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '/uploads/safety_profile.docx',
        projectId: '1',
        uploadedAt: '2024-01-15T12:15:00Z',
    }
]

export const useFiles = () => {
    const files = ref<ProjectFile[]>(mockFiles)
    const isUploading = ref(false)

    // File operations
    const getProjectFiles = (projectId: string | string[]): ProjectFile[] => {
        const id = Array.isArray(projectId) ? projectId[0] : projectId
        return files.value
            .filter(file => file.projectId === id)
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    }

    const getFileById = (fileId: string): ProjectFile | undefined => {
        return files.value.find(file => file.id === fileId)
    }

    const uploadFile = async (file: File, projectId: string): Promise<ProjectFile> => {
        isUploading.value = true

        try {
            // Simulate file upload delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // In real implementation, this would upload to a server
            const newFile: ProjectFile = {
                id: Date.now().toString(),
                name: file.name,
                size: file.size,
                type: file.type,
                url: `/uploads/${file.name}`, // Mock URL
                projectId,
                uploadedAt: new Date().toISOString(),
            }

            files.value.push(newFile)
            return newFile
        } finally {
            isUploading.value = false
        }
    }

    const deleteFile = (fileId: string) => {
        files.value = files.value.filter(f => f.id !== fileId)
    }

    const downloadFile = (fileId: string) => {
        const file = getFileById(fileId)
        if (!file) return

        // In real implementation, this would handle file download
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (fileType: string): string => {
        if (fileType.includes('pdf')) return 'mdi-file-pdf-box'
        if (fileType.includes('word') || fileType.includes('document')) return 'mdi-file-word-box'
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'mdi-file-excel-box'
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'mdi-file-powerpoint-box'
        if (fileType.includes('image')) return 'mdi-file-image-box'
        if (fileType.includes('video')) return 'mdi-file-video-box'
        if (fileType.includes('audio')) return 'mdi-file-music-box'
        return 'mdi-file-document-box'
    }

    return {
        files,
        isUploading,
        getProjectFiles,
        getFileById,
        uploadFile,
        deleteFile,
        downloadFile,
        formatFileSize,
        getFileIcon,
    }
} 