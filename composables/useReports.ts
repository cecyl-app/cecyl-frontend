import type { Report, Section, AiPrompt } from '~/types/report'

// Mock data for reports and sections
const mockReports: Report[] = [
    {
        id: '1',
        title: 'COVID-19 Vaccine Development Report',
        projectId: '1',
        sections: [
            {
                id: '1',
                title: 'Executive Summary',
                content: '# Executive Summary\n\nThis report presents the development progress of our COVID-19 mRNA vaccine candidate...',
                order: 1,
                reportId: '1',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
            },
            {
                id: '2',
                title: 'Research Methodology',
                content: '# Research Methodology\n\n## Approach\n\nOur research approach follows industry best practices...',
                order: 2,
                reportId: '1',
                createdAt: '2024-01-15T11:00:00Z',
                updatedAt: '2024-01-15T11:00:00Z',
            },
            {
                id: '3',
                title: 'Findings and Results',
                content: '# Findings and Results\n\n## Key Findings\n\n- Efficacy rate: 95%\n- Safety profile: Excellent',
                order: 3,
                reportId: '1',
                createdAt: '2024-01-15T12:00:00Z',
                updatedAt: '2024-01-15T12:00:00Z',
            },
            {
                id: '4',
                title: 'Conclusions',
                content: '# Conclusions\n\nBased on our comprehensive analysis...',
                order: 4,
                reportId: '1',
                createdAt: '2024-01-15T13:00:00Z',
                updatedAt: '2024-01-15T13:00:00Z',
            }
        ],
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
    }
]

const mockAiPrompts: AiPrompt[] = []

export const useReports = () => {
    const reports = ref<Report[]>(mockReports)
    const aiPrompts = ref<AiPrompt[]>(mockAiPrompts)

    // Report CRUD
    const getProjectReports = (projectId: string | string[]): Report[] => {
        const id = Array.isArray(projectId) ? projectId[0] : projectId
        return reports.value.filter(report => report.projectId === id)
    }

    const getReportById = (reportId: string): Report | undefined => {
        return reports.value.find(report => report.id === reportId)
    }

    const createReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'sections'>) => {
        const newReport: Report = {
            ...reportData,
            id: Date.now().toString(),
            sections: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        reports.value.push(newReport)
        return newReport
    }

    const updateReport = (reportId: string, reportData: Partial<Report>) => {
        const index = reports.value.findIndex(r => r.id === reportId)
        if (index !== -1) {
            reports.value[index] = {
                ...reports.value[index],
                ...reportData,
                updatedAt: new Date().toISOString(),
            }
        }
    }

    const deleteReport = (reportId: string) => {
        reports.value = reports.value.filter(r => r.id !== reportId)
    }

    // Section CRUD
    const getReportSections = (reportId: string): Section[] => {
        const report = getReportById(reportId)
        return report?.sections.sort((a, b) => a.order - b.order) || []
    }

    const getSectionById = (sectionId: string): Section | undefined => {
        for (const report of reports.value) {
            const section = report.sections.find(s => s.id === sectionId)
            if (section) return section
        }
        return undefined
    }

    const createSection = (sectionData: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>) => {
        const report = getReportById(sectionData.reportId)
        if (!report) return null

        const newSection: Section = {
            ...sectionData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        report.sections.push(newSection)
        updateReport(report.id, { sections: report.sections })
        return newSection
    }

    const updateSection = (sectionId: string, sectionData: Partial<Section>) => {
        const report = reports.value.find(r => r.sections.some(s => s.id === sectionId))
        if (!report) return

        const sectionIndex = report.sections.findIndex(s => s.id === sectionId)
        if (sectionIndex !== -1) {
            report.sections[sectionIndex] = {
                ...report.sections[sectionIndex],
                ...sectionData,
                updatedAt: new Date().toISOString(),
            }
            updateReport(report.id, { sections: report.sections })
        }
    }

    const deleteSection = (sectionId: string) => {
        const report = reports.value.find(r => r.sections.some(s => s.id === sectionId))
        if (!report) return

        report.sections = report.sections.filter(s => s.id !== sectionId)
        updateReport(report.id, { sections: report.sections })
    }

    // AI Enhancement functions
    const enhanceSection = async (sectionId: string, prompt: string, type: AiPrompt['type'] = 'enhance') => {
        // Mock AI enhancement - in real implementation, this would call an API
        const aiPrompt: AiPrompt = {
            id: Date.now().toString(),
            text: prompt,
            type,
            sectionId,
            result: `AI enhanced content based on: "${prompt}"\n\nThis is a simulated AI response that would enhance the section content.`,
            createdAt: new Date().toISOString(),
        }

        aiPrompts.value.push(aiPrompt)
        return aiPrompt
    }

    // Convert markdown to HTML for PDF generation
    const convertMarkdownToHtml = (markdown: string): string => {
        let html = markdown
            // Headers
            .replace(/^######\s(.*)$/gim, '<h6>$1</h6>')
            .replace(/^#####\s(.*)$/gim, '<h5>$1</h5>')
            .replace(/^####\s(.*)$/gim, '<h4>$1</h4>')
            .replace(/^###\s(.*)$/gim, '<h3>$1</h3>')
            .replace(/^##\s(.*)$/gim, '<h2>$1</h2>')
            .replace(/^#\s(.*)$/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            // Lists
            .replace(/^\s*-\s(.*)$/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
            // Links
            .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
            // Images
            .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" style="max-width: 100%; height: auto;" />')
            // Line breaks
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>')

        // Wrap in paragraphs
        html = '<p>' + html + '</p>'

        // Clean up empty paragraphs and fix nested elements
        html = html
            .replace(/<p><\/p>/gim, '')
            .replace(/<p>(<h[1-6]>)/gim, '$1')
            .replace(/(<\/h[1-6]>)<\/p>/gim, '$1')
            .replace(/<p>(<ul>)/gim, '$1')
            .replace(/(<\/ul>)<\/p>/gim, '$1')

        return html
    }

    const downloadReport = async (reportId: string) => {
        const report = getReportById(reportId)
        if (!report) return

        try {
            // Dynamic import to avoid SSR issues
            const jsPDF = (await import('jspdf')).default

            // Create new PDF document
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            // Set fonts and styling
            pdf.setFont('helvetica')

            // Add title page
            pdf.setFontSize(24)
            pdf.setTextColor(0, 0, 0)
            const title = report.title
            const titleLines = pdf.splitTextToSize(title, 170)
            pdf.text(titleLines, 20, 40)

            // Add generation date
            pdf.setFontSize(12)
            pdf.setTextColor(100, 100, 100)
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 60)

            // Add a line separator
            pdf.setDrawColor(200, 200, 200)
            pdf.line(20, 70, 190, 70)

            let yPosition = 90
            const pageHeight = 297 // A4 height in mm
            const marginBottom = 20
            const lineHeight = 7

            const sections = getReportSections(reportId)

            for (const section of sections) {
                // Check if we need a new page
                if (yPosition > pageHeight - marginBottom - 30) {
                    pdf.addPage()
                    yPosition = 20
                }

                // Add section title
                pdf.setFontSize(16)
                pdf.setTextColor(0, 0, 0)
                const sectionTitle = section.title
                pdf.text(sectionTitle, 20, yPosition)
                yPosition += lineHeight + 5

                // Add section content
                pdf.setFontSize(11)
                pdf.setTextColor(50, 50, 50)

                // Convert markdown to plain text for PDF
                let content = section.content
                    .replace(/^#+\s/gm, '') // Remove markdown headers
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
                    .replace(/`(.*?)`/g, '$1') // Remove code formatting
                    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1') // Convert links to text
                    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, '[Image: $1]') // Convert images to text
                    .trim()

                const contentLines = pdf.splitTextToSize(content, 170)

                for (const line of contentLines) {
                    // Check if we need a new page
                    if (yPosition > pageHeight - marginBottom) {
                        pdf.addPage()
                        yPosition = 20
                    }

                    pdf.text(line, 20, yPosition)
                    yPosition += lineHeight
                }

                yPosition += 10 // Add space between sections
            }

            // Add page numbers
            const pageCount = pdf.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i)
                pdf.setFontSize(10)
                pdf.setTextColor(150, 150, 150)
                pdf.text(`Page ${i} of ${pageCount}`, 190, pageHeight - 10, { align: 'right' })
            }

            // Save the PDF
            const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            pdf.save(filename)

        } catch (error) {
            console.error('Failed to generate PDF:', error)

            // Fallback to markdown download if PDF generation fails
            const sections = getReportSections(reportId)
            let markdownContent = `# ${report.title}\n\n`
            markdownContent += `**Generated on:** ${new Date().toLocaleDateString()}\n\n`

            for (const section of sections) {
                markdownContent += `${section.content}\n\n---\n\n`
            }

            const blob = new Blob([markdownContent], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${report.title.replace(/\s+/g, '_')}.md`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    }

    return {
        reports,
        aiPrompts,
        getProjectReports,
        getReportById,
        createReport,
        updateReport,
        deleteReport,
        getReportSections,
        getSectionById,
        createSection,
        updateSection,
        deleteSection,
        enhanceSection,
        downloadReport,
    }
} 