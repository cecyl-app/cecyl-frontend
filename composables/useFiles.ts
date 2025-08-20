import type { ExtendedProjectFile } from '~/types/project'

export const useFiles = () => {
    const files = ref<ExtendedProjectFile[]>([])
    const isUploading = ref(false)

    // Get file management functions from useProjects
    const { fetchProjectFiles, uploadProjectFiles, deleteProjectFile } = useProjects()

    // Convert API ProjectFile to ExtendedProjectFile for UI
    const convertToExtendedFile = (apiFile: any): ExtendedProjectFile => {
        const sizeInBytes = typeof apiFile.size === 'string' ? parseInt(apiFile.size) : apiFile.size
        const fileExtension = apiFile.filename.split('.').pop()?.toLowerCase() || ''

        return {
            id: apiFile.id,
            filename: apiFile.filename,
            name: apiFile.filename, // alias for backward compatibility
            size: apiFile.size,
            sizeBytes: sizeInBytes,
            type: getMimeTypeFromExtension(fileExtension),
            url: `/api/projects/files/${apiFile.id}/download`, // Construct download URL
            uploadedAt: apiFile.uploadedAt || new Date().toISOString(),
        }
    }

    // Get MIME type from file extension
    const getMimeTypeFromExtension = (extension: string): string => {
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain',
            csv: 'text/csv',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
        }
        return mimeTypes[extension] || 'application/octet-stream'
    }

    // File operations
    const getProjectFiles = (projectId: string | string[]): ExtendedProjectFile[] => {
        const id = Array.isArray(projectId) ? projectId[0] : projectId
        return files.value
            .filter(file => file.id.includes(id) || true) // Filter by project if needed
            .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
    }

    const loadProjectFiles = async (projectId: string) => {
        try {
            const apiFiles = await fetchProjectFiles(projectId)
            files.value = apiFiles.map(convertToExtendedFile)
        } catch (error) {
            console.error('Failed to load project files:', error)
        }
    }

    const getFileById = (fileId: string): ExtendedProjectFile | undefined => {
        return files.value.find(file => file.id === fileId)
    }

    const uploadFile = async (file: File, projectId: string): Promise<ExtendedProjectFile> => {
        isUploading.value = true

        try {
            const uploadedFiles = await uploadProjectFiles(projectId, [file])
            const newExtendedFiles = uploadedFiles.map(convertToExtendedFile)

            files.value.push(...newExtendedFiles)
            return newExtendedFiles[0]
        } catch (error) {
            console.error('Failed to upload file:', error)
            throw error
        } finally {
            isUploading.value = false
        }
    }

    const uploadFiles = async (filesToUpload: File[], projectId: string): Promise<ExtendedProjectFile[]> => {
        if (filesToUpload.length === 0) return []

        isUploading.value = true

        try {
            // Upload all files in a single request
            const uploadedFiles = await uploadProjectFiles(projectId, filesToUpload)

            // Convert API response to ExtendedProjectFile and add to files list
            const newExtendedFiles = uploadedFiles.map(convertToExtendedFile)
            files.value.push(...newExtendedFiles)

            console.log(`Successfully uploaded ${newExtendedFiles.length} files:`, newExtendedFiles.map(f => f.filename))
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

    const downloadFile = (fileId: string) => {
        const file = getFileById(fileId)
        if (!file) return

        // Create download link
        const link = document.createElement('a')
        link.href = file.url || `/api/files/${fileId}/download`
        link.download = file.name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
        getProjectFiles,
        loadProjectFiles,
        getFileById,
        uploadFile,
        uploadFiles,
        deleteFile,
        downloadFile,
        formatFileSize,
        getFileIcon,
    }
} 