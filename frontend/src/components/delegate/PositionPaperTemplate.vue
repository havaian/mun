<template>
    <div class="bg-white border border-mun-gray-200 rounded-lg p-6">
        <!-- Header -->
        <div class="border-b border-mun-gray-200 pb-4 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <DocumentTextIcon class="h-8 w-8 text-mun-blue" />
                    </div>
                    <div>
                        <h2 class="text-xl font-semibold text-mun-gray-900">
                            Position Paper Template
                        </h2>
                        <p class="text-sm text-mun-gray-600 mt-1">
                            Write your position paper using our structured template
                        </p>
                    </div>
                </div>

                <!-- Word Count -->
                <div class="text-right">
                    <div class="text-lg font-medium text-mun-gray-900">
                        {{ wordCount }} words
                    </div>
                    <div class="text-xs text-mun-gray-500">
                        {{ characterCount }} characters
                    </div>
                </div>
            </div>
        </div>

        <!-- Guidelines Section -->
        <div v-if="showGuidelines" class="mb-6 bg-mun-blue-50 border border-mun-blue-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
                <InformationCircleIcon class="h-5 w-5 text-mun-blue mt-0.5" />
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-mun-blue-900 mb-2">
                        Position Paper Guidelines
                    </h4>
                    <ul class="text-sm text-mun-blue-800 space-y-1">
                        <li>• Position papers should be 1-2 pages (500-1000 words)</li>
                        <li>• Address your country's stance on the committee topic</li>
                        <li>• Include background information and policy recommendations</li>
                        <li>• Use formal diplomatic language</li>
                        <li>• Cite reliable sources where appropriate</li>
                    </ul>
                </div>
                <button @click="showGuidelines = false" class="text-mun-blue-600 hover:text-mun-blue-800">
                    <XMarkIcon class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitPositionPaper">
            <!-- Title -->
            <div class="mb-6">
                <label for="title" class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Position Paper Title *
                </label>
                <input id="title" v-model="formData.title" type="text"
                    class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent"
                    :class="{ 'border-mun-red-300': errors.title }"
                    placeholder="e.g., The Position of [Your Country] on [Committee Topic]" maxlength="200" />
                <div class="flex justify-between items-center mt-1">
                    <p v-if="errors.title" class="text-sm text-mun-red-600">
                        {{ errors.title }}
                    </p>
                    <span class="text-xs text-mun-gray-500">
                        {{ formData.title.length }}/200
                    </span>
                </div>
            </div>

            <!-- Content Sections -->
            <div class="space-y-6">
                <!-- Section 1: Background -->
                <div class="border border-mun-gray-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-3 flex items-center">
                        <span
                            class="bg-mun-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                        Background and Context
                    </h3>
                    <p class="text-sm text-mun-gray-600 mb-3">
                        Provide historical context and current situation regarding the topic.
                    </p>
                    <textarea v-model="formData.sections.background" rows="5"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                        placeholder="Describe the historical background, current situation, and why this topic is important to your country..."
                        @input="updateWordCount"></textarea>
                    <div class="text-xs text-mun-gray-500 mt-1 text-right">
                        {{ getSectionWordCount('background') }} words
                    </div>
                </div>

                <!-- Section 2: Country's Position -->
                <div class="border border-mun-gray-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-3 flex items-center">
                        <span
                            class="bg-mun-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                        Your Country's Position
                    </h3>
                    <p class="text-sm text-mun-gray-600 mb-3">
                        Outline your country's official stance and policy on this issue.
                    </p>
                    <textarea v-model="formData.sections.position" rows="6"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                        placeholder="Explain your country's official position, policies, and interests regarding this topic..."
                        @input="updateWordCount"></textarea>
                    <div class="text-xs text-mun-gray-500 mt-1 text-right">
                        {{ getSectionWordCount('position') }} words
                    </div>
                </div>

                <!-- Section 3: Proposed Solutions -->
                <div class="border border-mun-gray-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-3 flex items-center">
                        <span
                            class="bg-mun-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
                        Proposed Solutions and Recommendations
                    </h3>
                    <p class="text-sm text-mun-gray-600 mb-3">
                        Suggest concrete actions and solutions that the committee should consider.
                    </p>
                    <textarea v-model="formData.sections.solutions" rows="6"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                        placeholder="Propose specific solutions, recommendations, and actions that your country supports..."
                        @input="updateWordCount"></textarea>
                    <div class="text-xs text-mun-gray-500 mt-1 text-right">
                        {{ getSectionWordCount('solutions') }} words
                    </div>
                </div>

                <!-- Section 4: Conclusion -->
                <div class="border border-mun-gray-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-3 flex items-center">
                        <span
                            class="bg-mun-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
                        Conclusion
                    </h3>
                    <p class="text-sm text-mun-gray-600 mb-3">
                        Summarize your country's position and call for action.
                    </p>
                    <textarea v-model="formData.sections.conclusion" rows="4"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                        placeholder="Summarize your main points and emphasize your country's commitment to finding solutions..."
                        @input="updateWordCount"></textarea>
                    <div class="text-xs text-mun-gray-500 mt-1 text-right">
                        {{ getSectionWordCount('conclusion') }} words
                    </div>
                </div>
            </div>

            <!-- Content Guidelines -->
            <div class="mt-6 flex items-center space-x-4 text-sm">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full"
                        :class="wordCount >= 100 ? 'bg-mun-green-400' : 'bg-mun-gray-300'"></div>
                    <span class="text-mun-gray-600">Minimum 100 words</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full"
                        :class="wordCount >= 500 ? 'bg-mun-green-400' : 'bg-mun-gray-300'"></div>
                    <span class="text-mun-gray-600">Recommended 500+ words</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full"
                        :class="wordCount <= 1500 ? 'bg-mun-green-400' : 'bg-mun-red-400'"></div>
                    <span class="text-mun-gray-600">Under 1500 words</span>
                </div>
            </div>

            <!-- Validation Errors -->
            <div v-if="Object.keys(errors).length > 0"
                class="mt-4 bg-mun-red-50 border border-mun-red-200 rounded-lg p-3">
                <div class="flex items-center space-x-2">
                    <ExclamationTriangleIcon class="h-4 w-4 text-mun-red-600" />
                    <span class="text-sm font-medium text-mun-red-800">Please fix the following errors:</span>
                </div>
                <ul class="mt-2 text-sm text-mun-red-700">
                    <li v-for="(error, key) in errors" :key="key">• {{ error }}</li>
                </ul>
            </div>

            <!-- Action Buttons -->
            <div class="mt-8 flex justify-between items-center">
                <!-- Secondary Actions -->
                <div class="flex space-x-3">
                    <AppButton variant="outline" size="md" @click="saveDraft" :loading="isDraftSaving"
                        :disabled="isSubmitting || !formData.title.trim()">
                        <DocumentIcon class="h-4 w-4 mr-2" />
                        Save Draft
                    </AppButton>

                    <AppButton variant="outline" size="md" @click="previewDocument" :disabled="!isValid">
                        <EyeIcon class="h-4 w-4 mr-2" />
                        Preview
                    </AppButton>
                </div>

                <!-- Primary Action -->
                <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting" :disabled="!isValid">
                    <PaperAirplaneIcon class="h-4 w-4 mr-2" />
                    Submit Position Paper
                </AppButton>
            </div>
        </form>

        <!-- Character/Word Limits Warning -->
        <div v-if="isNearLimit" class="mt-4 bg-mun-orange-50 border border-mun-orange-200 rounded-lg p-3">
            <div class="flex items-center space-x-2">
                <ExclamationTriangleIcon class="h-4 w-4 text-mun-orange-600" />
                <span class="text-sm text-mun-orange-800">
                    Approaching character limit ({{ characterCount }}/50,000)
                </span>
            </div>
        </div>
    </div>

    <!-- Preview Modal -->
    <ModalWrapper v-model="showPreview" title="Position Paper Preview"
        :subtitle="`${delegate.countryName} - ${committee.name}`" size="xl">
        <template #content>
            <div class="prose prose-mun max-w-none">
                <div class="text-center border-b pb-4 mb-6">
                    <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">
                        {{ formData.title }}
                    </h1>
                    <p class="text-lg text-mun-gray-700">
                        {{ delegate.countryName }}
                    </p>
                    <p class="text-sm text-mun-gray-500">
                        {{ committee.name }} • {{ formatDate(new Date()) }}
                    </p>
                </div>

                <div v-if="formData.sections.background" class="mb-6">
                    <h2 class="text-xl font-semibold text-mun-gray-900 mb-3">Background and Context</h2>
                    <div class="text-mun-gray-700 whitespace-pre-line">{{ formData.sections.background }}</div>
                </div>

                <div v-if="formData.sections.position" class="mb-6">
                    <h2 class="text-xl font-semibold text-mun-gray-900 mb-3">{{ delegate.countryName }}'s Position</h2>
                    <div class="text-mun-gray-700 whitespace-pre-line">{{ formData.sections.position }}</div>
                </div>

                <div v-if="formData.sections.solutions" class="mb-6">
                    <h2 class="text-xl font-semibold text-mun-gray-900 mb-3">Proposed Solutions and Recommendations</h2>
                    <div class="text-mun-gray-700 whitespace-pre-line">{{ formData.sections.solutions }}</div>
                </div>

                <div v-if="formData.sections.conclusion" class="mb-6">
                    <h2 class="text-xl font-semibold text-mun-gray-900 mb-3">Conclusion</h2>
                    <div class="text-mun-gray-700 whitespace-pre-line">{{ formData.sections.conclusion }}</div>
                </div>
            </div>
        </template>

        <template #footer-buttons>
            <AppButton variant="outline" @click="showPreview = false">Close Preview</AppButton>
            <AppButton variant="primary" @click="submitFromPreview" :loading="isSubmitting">
                Submit Position Paper
            </AppButton>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    DocumentTextIcon,
    InformationCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    DocumentIcon,
    EyeIcon,
    PaperAirplaneIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    committee: {
        type: Object,
        required: true
    },
    event: {
        type: Object,
        required: true
    },
    delegate: {
        type: Object,
        required: true
    }
})

// Emits
const emit = defineEmits(['position-paper-submitted', 'draft-saved'])

// Composables
const toast = useToast()

// State
const isSubmitting = ref(false)
const isDraftSaving = ref(false)
const showGuidelines = ref(true)
const showPreview = ref(false)
const errors = ref({})

// Form data
const formData = reactive({
    title: '',
    sections: {
        background: '',
        position: '',
        solutions: '',
        conclusion: ''
    }
})

// Computed
const fullContent = computed(() => {
    return Object.values(formData.sections).join('\n\n')
})

const wordCount = computed(() => {
    return fullContent.value.split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
    return fullContent.value.length
})

const isNearLimit = computed(() => {
    return characterCount.value > 45000 // Warning at 45k characters
})

const isValid = computed(() => {
    return formData.title.trim() !== '' &&
        wordCount.value >= 100 &&
        characterCount.value <= 50000 &&
        Object.keys(errors.value).length === 0
})

// Methods
const getSectionWordCount = (section) => {
    return formData.sections[section].split(/\s+/).filter(word => word.length > 0).length
}

const updateWordCount = () => {
    // This method is called on input to trigger reactivity
}

const validateForm = () => {
    errors.value = {}

    if (!formData.title.trim()) {
        errors.value.title = 'Title is required'
    }

    if (wordCount.value < 100) {
        errors.value.content = 'Position paper must be at least 100 words'
    }

    if (wordCount.value > 2000) {
        errors.value.content = 'Position paper should not exceed 2000 words'
    }

    if (characterCount.value > 50000) {
        errors.value.content = 'Content exceeds 50,000 character limit'
    }

    if (!formData.sections.background.trim() && !formData.sections.position.trim()) {
        errors.value.content = 'Please provide at least background information and your country\'s position'
    }

    return Object.keys(errors.value).length === 0
}

const submitPositionPaper = async () => {
    if (!validateForm()) {
        toast.error('Please fix the errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        const submissionData = {
            committeeId: props.committee._id,
            title: formData.title,
            content: fullContent.value
        }

        const response = await apiMethods.positionPapers.submitText(submissionData)

        if (response.data.success) {
            toast.success('Position paper submitted successfully')
            emit('position-paper-submitted', response.data.document)

            // Reset form
            formData.title = ''
            Object.keys(formData.sections).forEach(key => {
                formData.sections[key] = ''
            })
        }

    } catch (error) {
        console.error('Submit error:', error)
        toast.error(error.message || 'Failed to submit position paper')
    } finally {
        isSubmitting.value = false
    }
}

const submitFromPreview = async () => {
    showPreview.value = false
    await submitPositionPaper()
}

const saveDraft = async () => {
    if (!formData.title.trim()) {
        toast.error('Please enter a title before saving draft')
        return
    }

    try {
        isDraftSaving.value = true

        // Save to localStorage as draft
        const draftData = {
            title: formData.title,
            sections: { ...formData.sections },
            savedAt: new Date().toISOString(),
            committeeId: props.committee._id
        }

        localStorage.setItem(`position_paper_draft_${props.committee._id}`, JSON.stringify(draftData))

        toast.success('Draft saved locally')
        emit('draft-saved', draftData)

    } catch (error) {
        console.error('Save draft error:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const previewDocument = () => {
    if (!validateForm()) {
        toast.error('Please fix the errors before previewing')
        return
    }
    showPreview.value = true
}

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Load draft from localStorage if available
const loadDraft = () => {
    try {
        const draftKey = `position_paper_draft_${props.committee._id}`
        const savedDraft = localStorage.getItem(draftKey)

        if (savedDraft) {
            const draftData = JSON.parse(savedDraft)
            formData.title = draftData.title || ''

            if (draftData.sections) {
                Object.keys(draftData.sections).forEach(key => {
                    if (formData.sections[key] !== undefined) {
                        formData.sections[key] = draftData.sections[key] || ''
                    }
                })
            }

            toast.log('Draft loaded from local storage')
        }
    } catch (error) {
        console.error('Load draft error:', error)
    }
}

// Watch for changes to auto-save draft
watch(formData,
    () => {
        if (formData.title.trim() || Object.values(formData.sections).some(section => section.trim())) {
            // Auto-save draft after 2 seconds of no changes
            setTimeout(() => {
                if (formData.title.trim()) {
                    saveDraft()
                }
            }, 2000)
        }
    },
    { deep: true }
)

// Load draft on component mount
loadDraft()
</script>

<style scoped>
.prose-mun {
    @apply text-mun-gray-700;
}

.prose-mun h1 {
    @apply text-mun-gray-900;
}

.prose-mun h2 {
    @apply text-mun-gray-900;
}
</style>