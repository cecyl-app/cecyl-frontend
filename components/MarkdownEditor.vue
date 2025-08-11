<template>
  <v-card class="h-100" flat>
    <v-card-text class="pa-0" style="height: calc(100% - 48px);">
      <div class="d-flex h-100 editor-layout">
        <!-- Editor -->
        <div class="w-100 editor-container flex-shrink-0">
          <ClientOnly>
            <div ref="editorContainer" class="h-100 w-100"></div>
            <template #fallback>
              <div class="d-flex align-center justify-center h-100">
                <v-progress-circular indeterminate color="primary" size="24" />
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">

interface Props {
  modelValue: string
  title?: string
  placeholder?: string
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Editor',
  placeholder: 'Start writing...',
  readonly: false,
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
const quill = ref<any>(null)

const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  },
  placeholder: props.placeholder,
  readOnly: props.readonly
}

// Convert Quill Delta/HTML to Markdown
const convertToMarkdown = (html: string): string => {
  // Simple HTML to Markdown conversion
  let markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n'
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n'
    })
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks
    .trim()

  return markdown
}

// Convert Markdown to HTML for preview
const convertToHtml = (markdown: string): string => {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
    // Line breaks
    .replace(/\n/gim, '<br>')

  return html
}

const handleTextChange = (content: string) => {
  const markdown = convertToMarkdown(content)
  emit('update:modelValue', markdown)
  emit('change', markdown)
}

const initializeQuill = async () => {
  if (!editorContainer.value) return

  try {
    // Dynamic import to avoid SSR issues
    const { default: Quill } = await import('quill')
    
    // Import CSS dynamically as well
    await import('quill/dist/quill.snow.css')
    
    quill.value = new Quill(editorContainer.value, editorOptions)
    
    // Set initial content
    if (props.modelValue) {
      quill.value.root.innerHTML = convertToHtml(props.modelValue)
    }
    
    // Listen for text changes
    quill.value.on('text-change', () => {
      const html = quill.value.root.innerHTML
      handleTextChange(html)
    })
  } catch (error) {
    console.error('Failed to initialize Quill editor:', error)
  }
}

onMounted(() => {
  // ClientOnly wrapper ensures this only runs on client side
  nextTick(() => {
    initializeQuill()
  })
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (quill.value && newValue !== convertToMarkdown(quill.value.root.innerHTML)) {
    quill.value.root.innerHTML = convertToHtml(newValue)
  }
})
</script>

<style scoped>
.w-100 {
  width: 100%;
  flex: 1 1 100%;
}

.editor-layout {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.editor-container {
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
}

/* Quill Editor Styles */
:deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid #e0e0e0;
  padding: 4px 12px;
  background-color: #fafafa;
}

:deep(.ql-container) {
  border: none;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
}

:deep(.ql-editor) {
  padding: 8px 12px;
  line-height: 1.6;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  min-height: auto;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
}

:deep(.ql-toolbar .ql-formats) {
  margin-right: 12px;
}

:deep(.ql-editor.ql-blank::before) {
  left: 20px;
  font-style: italic;
  color: #aaa;
}

/* Fix for content that tries to expand beyond container */
:deep(.ql-editor p),
:deep(.ql-editor h1),
:deep(.ql-editor h2),
:deep(.ql-editor h3),
:deep(.ql-editor h4),
:deep(.ql-editor h5),
:deep(.ql-editor h6),
:deep(.ql-editor div),
:deep(.ql-editor span) {
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
</style> 