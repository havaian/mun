// Modal Registry - Central registration system for all modal components
// This file provides a centralized way to register and access all modal components

// Import all modal components
import SessionTimeoutModal from '@/components/modals/SessionTimeoutModal.vue'
import CreateDocumentModal from '@/components/modals/CreateDocumentModal.vue'
import DocumentViewModal from '@/components/modals/DocumentViewModal.vue'
import EditDocumentModal from '@/components/modals/EditDocumentModal.vue'
import CreateCoalitionModal from '@/components/modals/CreateCoalitionModal.vue'
import CoalitionDetailsModal from '@/components/modals/CoalitionDetailsModal.vue'
import ManageCoalitionModal from '@/components/modals/ManageCoalitionModal.vue'
import MessagesModal from '@/components/modals/MessagesModal.vue'
import StatisticsModal from '@/components/modals/StatisticsModal.vue'
import EditEventModal from '@/components/modals/EditEventModal.vue'
import EditUserModal from '@/components/modals/EditUserModal.vue'
import ViewUserModal from '@/components/modals/ViewUserModal.vue'

// Additional modal components that would be created
// import CreateEventModal from '@/components/modals/CreateEventModal.vue'
// import EditCommitteeModal from '@/components/modals/EditCommitteeModal.vue'
// import CreateAmendmentModal from '@/components/modals/CreateAmendmentModal.vue'
// import VotingModal from '@/components/modals/VotingModal.vue'
// import TimerModal from '@/components/modals/TimerModal.vue'
// import AttendanceModal from '@/components/modals/AttendanceModal.vue'
// import SpeakerListModal from '@/components/modals/SpeakerListModal.vue'
// import ProcedureModal from '@/components/modals/ProcedureModal.vue'
// import SettingsModal from '@/components/modals/SettingsModal.vue'
// import HelpModal from '@/components/modals/HelpModal.vue'

/**
 * Modal Registry - Maps modal names to their components and configurations
 * 
 * Each modal entry contains:
 * - component: The Vue component
 * - defaultSize: Default modal size (sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, full)
 * - defaultOptions: Default modal options (backdrop, keyboard, centered, etc.)
 * - category: Modal category for organization
 * - description: Brief description of the modal's purpose
 */
export const modalRegistry = {
  // === SYSTEM MODALS ===
  SessionTimeoutModal: {
    component: SessionTimeoutModal,
    defaultSize: 'md',
    defaultOptions: {
      backdrop: false,
      keyboard: false,
      closable: false,
      centered: true,
      static: true
    },
    category: 'system',
    description: 'Session timeout warning and extension modal'
  },

  // === DOCUMENT MODALS ===
  CreateDocumentModal: {
    component: CreateDocumentModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'documents',
    description: 'Create new documents with templates and multiple input methods'
  },

  DocumentViewModal: {
    component: DocumentViewModal,
    defaultSize: '6xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'documents',
    description: 'View document content with history and related information'
  },

  EditDocumentModal: {
    component: EditDocumentModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'documents',
    description: 'Edit existing documents with version control'
  },

  // === COALITION MODALS ===
  CreateCoalitionModal: {
    component: CreateCoalitionModal,
    defaultSize: '3xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'coalitions',
    description: 'Create new coalitions and invite countries'
  },

  CoalitionDetailsModal: {
    component: CoalitionDetailsModal,
    defaultSize: '5xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'coalitions',
    description: 'View detailed coalition information and member management'
  },

  ManageCoalitionModal: {
    component: ManageCoalitionModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'coalitions',
    description: 'Manage coalition members, settings, and documents'
  },

  // === COMMUNICATION MODALS ===
  MessagesModal: {
    component: MessagesModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'communication',
    description: 'Diplomatic messaging system with multiple conversation types'
  },

  // === ANALYTICS MODALS ===
  StatisticsModal: {
    component: StatisticsModal,
    defaultSize: '6xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'analytics',
    description: 'Personal performance statistics and achievements'
  },

  // === ADMIN MODALS ===
  EditEventModal: {
    component: EditEventModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'admin',
    description: 'Create and edit MUN events with full configuration'
  },

  EditUserModal: {
    component: EditUserModal,
    defaultSize: '3xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'admin',
    description: 'Create and edit user accounts with role management'
  },

  ViewUserModal: {
    component: ViewUserModal,
    defaultSize: '4xl',
    defaultOptions: {
      backdrop: true,
      keyboard: true,
      closable: true,
      centered: false
    },
    category: 'admin',
    description: 'View detailed user information and activity'
  }

  // === PLACEHOLDER FOR ADDITIONAL MODALS ===
  // Add more modals as they are created...
}

/**
 * Helper function to get modal configuration by name
 * @param {string} modalName - Name of the modal
 * @returns {object|null} Modal configuration or null if not found
 */
export function getModalConfig(modalName) {
  return modalRegistry[modalName] || null
}

/**
 * Helper function to get all modals by category
 * @param {string} category - Modal category
 * @returns {array} Array of modal configurations
 */
export function getModalsByCategory(category) {
  return Object.entries(modalRegistry)
    .filter(([, config]) => config.category === category)
    .map(([name, config]) => ({ name, ...config }))
}

/**
 * Helper function to get all available modal categories
 * @returns {array} Array of unique categories
 */
export function getModalCategories() {
  const categories = new Set(
    Object.values(modalRegistry).map(config => config.category)
  )
  return Array.from(categories).sort()
}

/**
 * Enhanced modal service that integrates with the registry
 */
export class EnhancedModalService {
  constructor(baseModalService) {
    this.baseModalService = baseModalService
  }

  /**
   * Show a modal using the registry
   * @param {string} modalName - Name of the modal in the registry
   * @param {object} props - Props to pass to the modal component
   * @param {object} options - Modal options (will be merged with defaults)
   * @returns {string} Modal ID
   */
  show(modalName, props = {}, options = {}) {
    const config = getModalConfig(modalName)
    
    if (!config) {
      console.error(`Modal "${modalName}" not found in registry`)
      return null
    }

    const modalOptions = {
      component: config.component,
      size: options.size || config.defaultSize,
      props,
      ...config.defaultOptions,
      ...options
    }

    return this.baseModalService.show(modalOptions)
  }

  /**
   * Hide a modal
   * @param {string} modalId - Modal ID to hide
   */
  hide(modalId) {
    return this.baseModalService.hide(modalId)
  }

  /**
   * Hide all modals
   */
  hideAll() {
    return this.baseModalService.hideAll()
  }

  /**
   * Get current modal
   */
  getCurrent() {
    return this.baseModalService.getCurrent()
  }

  /**
   * Check if any modals are open
   */
  hasOpenModals() {
    return this.baseModalService.hasOpenModals()
  }

  /**
   * Show a confirmation dialog
   * @param {object} options - Confirmation options
   * @returns {Promise<boolean>} Promise that resolves to true if confirmed
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const modalId = this.baseModalService.show({
        component: 'ConfirmDialog',
        size: 'md',
        props: {
          title: options.title || 'Confirm Action',
          message: options.message || 'Are you sure?',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          type: options.type || 'warning',
          onConfirm: () => {
            this.hide(modalId)
            resolve(true)
          },
          onCancel: () => {
            this.hide(modalId)
            resolve(false)
          }
        },
        backdrop: false,
        keyboard: false,
        centered: true
      })
    })
  }
}

/**
 * Vue composable for using the enhanced modal service
 * @param {object} baseModalService - Base modal service instance
 * @returns {object} Enhanced modal service methods
 */
export function useEnhancedModal(baseModalService) {
  const enhancedService = new EnhancedModalService(baseModalService)

  return {
    // Direct service access
    modal: enhancedService,
    
    // Convenience methods
    show: enhancedService.show.bind(enhancedService),
    hide: enhancedService.hide.bind(enhancedService),
    hideAll: enhancedService.hideAll.bind(enhancedService),
    confirm: enhancedService.confirm.bind(enhancedService),
    
    // Registry access
    getModalConfig,
    getModalsByCategory,
    getModalCategories,
    
    // Quick access methods for common modals
    showSessionTimeout: (props = {}) => enhancedService.show('SessionTimeoutModal', props),
    showCreateDocument: (props = {}) => enhancedService.show('CreateDocumentModal', props),
    showDocumentView: (props = {}) => enhancedService.show('DocumentViewModal', props),
    showEditDocument: (props = {}) => enhancedService.show('EditDocumentModal', props),
    showCreateCoalition: (props = {}) => enhancedService.show('CreateCoalitionModal', props),
    showCoalitionDetails: (props = {}) => enhancedService.show('CoalitionDetailsModal', props),
    showManageCoalition: (props = {}) => enhancedService.show('ManageCoalitionModal', props),
    showMessages: (props = {}) => enhancedService.show('MessagesModal', props),
    showStatistics: (props = {}) => enhancedService.show('StatisticsModal', props),
    showEditEvent: (props = {}) => enhancedService.show('EditEventModal', props),
    showEditUser: (props = {}) => enhancedService.show('EditUserModal', props),
    showViewUser: (props = {}) => enhancedService.show('ViewUserModal', props)
  }
}

/**
 * Global modal shortcuts for use in components
 * Usage: this.$modal.showCreateDocument({ committeeId: '123' })
 */
export const globalModalMethods = {
  // Document modals
  showCreateDocument: (props = {}) => window.$modal?.show('CreateDocumentModal', props),
  showDocumentView: (props = {}) => window.$modal?.show('DocumentViewModal', props),
  showEditDocument: (props = {}) => window.$modal?.show('EditDocumentModal', props),
  
  // Coalition modals
  showCreateCoalition: (props = {}) => window.$modal?.show('CreateCoalitionModal', props),
  showCoalitionDetails: (props = {}) => window.$modal?.show('CoalitionDetailsModal', props),
  showManageCoalition: (props = {}) => window.$modal?.show('ManageCoalitionModal', props),
  
  // Communication modals
  showMessages: (props = {}) => window.$modal?.show('MessagesModal', props),
  
  // Analytics modals
  showStatistics: (props = {}) => window.$modal?.show('StatisticsModal', props),
  
  // Admin modals
  showEditEvent: (props = {}) => window.$modal?.show('EditEventModal', props),
  showEditUser: (props = {}) => window.$modal?.show('EditUserModal', props),
  showViewUser: (props = {}) => window.$modal?.show('ViewUserModal', props),
  
  // System modals
  showSessionTimeout: (props = {}) => window.$modal?.show('SessionTimeoutModal', props)
}

export default modalRegistry