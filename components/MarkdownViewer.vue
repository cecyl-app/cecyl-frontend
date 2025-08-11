<template>
  <div class="markdown-content" v-html="htmlContent"></div>
</template>

<script setup lang="ts">
interface Props {
  content: string
}

const props = defineProps<Props>()

// Convert Markdown to HTML for display
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return ''
  
  let html = markdown
    // Headers (must be in order from h6 to h1 to avoid conflicts)
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
    // Unordered lists
    .replace(/^\s*[\-\*\+]\s+(.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gis, (match) => {
      if (!match.includes('<ul>')) {
        return `<ol>${match}</ol>`
      }
      return match
    })
    // Blockquotes
    .replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>')
    // Line breaks (convert double newlines to paragraphs)
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    // Wrap in paragraphs
    .replace(/^(.*)$/gim, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/gim, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1')
    .replace(/<p>(<ul>.*<\/ul>)<\/p>/gims, '$1')
    .replace(/<p>(<ol>.*<\/ol>)<\/p>/gims, '$1')
    .replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/gim, '$1')
    .replace(/<p>(<pre>.*<\/pre>)<\/p>/gims, '$1')

  return html
}

const htmlContent = computed(() => convertMarkdownToHtml(props.content))
</script>

<style scoped>
.markdown-content {
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
  font-size: 14px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 2rem;
  color: #1976d2;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  color: #1976d2;
}

.markdown-content :deep(h3) {
  font-size: 1.25rem;
  color: #424242;
}

.markdown-content :deep(p) {
  margin-bottom: 16px;
}

.markdown-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.markdown-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #1976d2;
  padding-left: 16px;
  margin: 16px 0;
  font-style: italic;
  color: #666;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
}

.markdown-content :deep(a) {
  color: #1976d2;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 8px;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}
</style> 