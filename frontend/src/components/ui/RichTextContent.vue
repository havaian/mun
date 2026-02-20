<template>
    <div v-if="content" class="rich-text-content" v-html="content"></div>
</template>

<script setup>
defineProps({
    content: { type: String, default: '' }
})
</script>

<style>
.rich-text-content {
    line-height: 1.7;
    color: #374151;
}

.rich-text-content h2 {
    font-size: 1.375rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    color: #111827;
}

.rich-text-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #111827;
}

.rich-text-content p {
    margin-bottom: 1rem;
}

.rich-text-content ul,
.rich-text-content ol {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
}

.rich-text-content ul {
    list-style-type: disc;
}

.rich-text-content ol {
    list-style-type: decimal;
}

.rich-text-content li {
    margin-bottom: 0.25rem;
}

.rich-text-content blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 1rem;
    margin: 1.25rem 0;
    color: #6b7280;
    font-style: italic;
}

.rich-text-content hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2rem 0;
}

.rich-text-content a {
    color: #2563eb;
    text-decoration: underline;
}

.rich-text-content a:hover {
    color: #1d4ed8;
}

.rich-text-content img {
    border-radius: 0.75rem;
    max-width: 100%;
    height: auto;
    margin: 1.25rem 0;
}

.rich-text-content strong {
    font-weight: 600;
    color: #111827;
}

.rich-text-content em {
    font-style: italic;
}
</style>