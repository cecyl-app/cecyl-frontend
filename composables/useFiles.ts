import type { ProjectFile } from '~/types/project'

const files = ref<ProjectFile[]>([])
export const useFiles = () => {
    const isUploading = ref(false)

    // Get file management functions from useProjects
    const { fetchProjectFiles, uploadProjectFiles, deleteProjectFile } = useProjects()

    // File operations
    const loadProjectFiles = async (projectId: string) => {
        try {
            const apiFiles = await fetchProjectFiles(projectId)
            files.value = apiFiles
        } catch (error) {
            console.error('Failed to load project files:', error)
        }
    }

    const getFileById = (fileId: string): ProjectFile | undefined => {
        return files.value.find(file => file.id === fileId)
    }

    const uploadFile = async (file: File, projectId: string): Promise<ProjectFile> => {
        isUploading.value = true

        try {
            const uploadedFiles = await uploadProjectFiles(projectId, [file])
            const newExtendedFiles = Array.isArray(uploadedFiles) ? uploadedFiles : []
            if (newExtendedFiles.length > 0) {
                files.value.push(...newExtendedFiles)
                return newExtendedFiles[0]
            } else {
                throw new Error('No files were returned from API after upload')
            }
        } catch (error) {
            console.error('Failed to upload file:', error)
            throw error
        } finally {
            isUploading.value = false
        }
    }

    const uploadFiles = async (filesToUpload: File[], projectId: string): Promise<ProjectFile[]> => {
        if (filesToUpload.length === 0) return []

        isUploading.value = true

        try {
            // Upload all files in a single request
            const uploadedFiles = await uploadProjectFiles(projectId, filesToUpload)
            // Ensure uploadedFiles is an array
            const newExtendedFiles = Array.isArray(uploadedFiles) ? uploadedFiles : []

            if (newExtendedFiles.length > 0) {
                files.value.push(...newExtendedFiles)
                console.log(`Successfully uploaded ${newExtendedFiles.length} files:`, newExtendedFiles.map(f => f.filename))
            } else {
                console.warn('Upload completed but no files were returned from API')
            }

            return newExtendedFiles
        } catch (error) {
            console.error('Failed to upload files:', error)
            throw error
        } finally {
            isUploading.value = false
        }
    }

    const deleteFile = async (fileId: string, projectId: string) => {
        try {
            await deleteProjectFile(projectId, fileId)
            files.value = files.value.filter(f => f.id !== fileId)
        } catch (error) {
            console.error('Failed to delete file:', error)
            throw error
        }
    }

    const formatFileSize = (bytes: number | string): string => {
        const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
        if (numBytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(numBytes) / Math.log(k))

        return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        loadProjectFiles,
        getFileById,
        uploadFile,
        uploadFiles,
        deleteFile,
        formatFileSize,
        getFileIcon,
    }
} 