<template>
    <div class="rich-text-editor rounded-xl border border-mun-gray-200 overflow-hidden bg-white">
        <!-- Toolbar -->
        <div v-if="editor"
            class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-mun-gray-200 bg-mun-gray-50">
            <!-- Text style -->
            <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="toolbarBtnClass(editor.isActive('heading', { level: 2 }))" title="Heading 2">
                <span class="text-xs font-bold">H2</span>
            </button>
            <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                :class="toolbarBtnClass(editor.isActive('heading', { level: 3 }))" title="Heading 3">
                <span class="text-xs font-bold">H3</span>
            </button>
            <button type="button" @click="editor.chain().focus().setParagraph().run()"
                :class="toolbarBtnClass(editor.isActive('paragraph'))" title="Paragraph">
                <span class="text-xs">P</span>
            </button>

            <div class="w-px h-5 bg-mun-gray-200 mx-1"></div>

            <!-- Formatting -->
            <button type="button" @click="editor.chain().focus().toggleBold().run()"
                :class="toolbarBtnClass(editor.isActive('bold'))" title="Bold">
                <span class="text-xs font-bold">B</span>
            </button>
            <button type="button" @click="editor.chain().focus().toggleItalic().run()"
                :class="toolbarBtnClass(editor.isActive('italic'))" title="Italic">
                <span class="text-xs italic">I</span>
            </button>

            <div class="w-px h-5 bg-mun-gray-200 mx-1"></div>

            <!-- Lists -->
            <button type="button" @click="editor.chain().focus().toggleBulletList().run()"
                :class="toolbarBtnClass(editor.isActive('bulletList'))" title="Bullet list">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
            </button>
            <button type="button" @click="editor.chain().focus().toggleOrderedList().run()"
                :class="toolbarBtnClass(editor.isActive('orderedList'))" title="Numbered list">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M10 6h11M10 12h11M10 18h11M4 6V4l-2 2M2 6h4M4 18H2v-2h2v1h1v1H2M2 12h3l-3 3h4" />
                </svg>
            </button>

            <div class="w-px h-5 bg-mun-gray-200 mx-1"></div>

            <!-- Blockquote -->
            <button type="button" @click="editor.chain().focus().toggleBlockquote().run()"
                :class="toolbarBtnClass(editor.isActive('blockquote'))" title="Quote">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                        d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
            </button>

            <!-- Link -->
            <button type="button" @click="addLink" :class="toolbarBtnClass(editor.isActive('link'))" title="Add link">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </button>

            <!-- Image -->
            <button type="button" @click="addImage" title="Add image">
                <span :class="toolbarBtnClass(false)">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
            </button>

            <div class="w-px h-5 bg-mun-gray-200 mx-1"></div>

            <!-- Horizontal rule -->
            <button type="button" @click="editor.chain().focus().setHorizontalRule().run()"
                :class="toolbarBtnClass(false)" title="Divider">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14" />
                </svg>
            </button>
        </div>

        <!-- Editor content -->
        <EditorContent :editor="editor" class="rich-text-editor-content" />
    </div>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Start writing...' }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
    content: props.modelValue,
    extensions: [
        StarterKit.configure({
            heading: { levels: [2, 3] }
        }),
        Image.configure({
            HTMLAttributes: {
                class: 'rounded-lg max-w-full h-auto my-4'
            }
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-mun-blue underline'
            }
        }),
        Placeholder.configure({
            placeholder: props.placeholder
        })
    ],
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose max-w-none px-4 py-3 min-h-[200px] focus:outline-none'
        }
    },
    onUpdate: () => {
        emit('update:modelValue', editor.value.getHTML())
    }
})

// Sync external changes
watch(() => props.modelValue, (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
        editor.value.commands.setContent(val || '', false)
    }
})

onBeforeUnmount(() => {
    editor.value?.destroy()
})

const toolbarBtnClass = (active) => [
    'w-7 h-7 rounded flex items-center justify-center transition-colors',
    active
        ? 'bg-mun-blue-100 text-mun-blue-700'
        : 'text-mun-gray-500 hover:bg-mun-gray-100 hover:text-mun-gray-700'
]

const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
        editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
}

const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
        editor.value.chain().focus().setImage({ src: url }).run()
    }
}
</script>

<style>
/* Editor placeholder */
.rich-text-editor-content .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #9ca3af;
    pointer-events: none;
    height: 0;
}

/* Basic prose styling inside editor */
.rich-text-editor-content .tiptap {
    min-height: 200px;
}

.rich-text-editor-content .tiptap h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
}

.rich-text-editor-content .tiptap h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
}

.rich-text-editor-content .tiptap p {
    margin-bottom: 0.75rem;
    line-height: 1.7;
}

.rich-text-editor-content .tiptap ul,
.rich-text-editor-content .tiptap ol {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
}

.rich-text-editor-content .tiptap ul {
    list-style-type: disc;
}

.rich-text-editor-content .tiptap ol {
    list-style-type: decimal;
}

.rich-text-editor-content .tiptap li {
    margin-bottom: 0.25rem;
}

.rich-text-editor-content .tiptap blockquote {
    border-left: 3px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
    font-style: italic;
}

.rich-text-editor-content .tiptap hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1.5rem 0;
}

.rich-text-editor-content .tiptap a {
    color: #2563eb;
    text-decoration: underline;
}

.rich-text-editor-content .tiptap img {
    border-radius: 0.75rem;
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
}
</style>