import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Layout = 'compact' | 'comfortable' | 'spacious';
type Language = 'it' | 'en';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
  read: boolean;
}

interface UIPreferences {
  theme: Theme;
  layout: Layout;
  language: Language;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showAnimations: boolean;
  compactMode: boolean;
}

interface UIState {
  // Preferences
  preferences: UIPreferences;
  
  // Navigation
  sidebarOpen: boolean;
  currentPage: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  
  // Modals and overlays
  activeModal: string | null;
  modalData: any;
  showCommandPalette: boolean;
  
  // Focus and accessibility
  focusMode: boolean;
  keyboardNavigation: boolean;
  screenReaderMode: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;
  
  // Error handling
  lastError: Error | null;
  errorBoundaryInfo: any;
  
  // ADHD-specific features
  distractionMode: 'minimal' | 'normal' | 'rich';
  showProgressIndicators: boolean;
  enableMicroFeedback: boolean;
  gentleReminders: boolean;
  
  // Actions
  setPreferences: (preferences: Partial<UIPreferences>) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => void;
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  
  // Focus actions
  setFocusMode: (enabled: boolean) => void;
  setKeyboardNavigation: (enabled: boolean) => void;
  setScreenReaderMode: (enabled: boolean) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Error actions
  setLastError: (error: Error | null) => void;
  setErrorBoundaryInfo: (info: any) => void;
  
  // ADHD actions
  setDistractionMode: (mode: 'minimal' | 'normal' | 'rich') => void;
  toggleProgressIndicators: () => void;
  toggleMicroFeedback: () => void;
  toggleGentleReminders: () => void;
  
  // Utility actions
  resetUI: () => void;
  exportPreferences: () => UIPreferences;
  importPreferences: (preferences: UIPreferences) => void;
}

const defaultPreferences: UIPreferences = {
  theme: 'system',
  layout: 'comfortable',
  language: 'it',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  showAnimations: true,
  compactMode: false
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        preferences: defaultPreferences,
        sidebarOpen: true,
        currentPage: '/',
        breadcrumbs: [],
        activeModal: null,
        modalData: null,
        showCommandPalette: false,
        focusMode: false,
        keyboardNavigation: false,
        screenReaderMode: false,
        notifications: [],
        unreadCount: 0,
        globalLoading: false,
        loadingMessage: '',
        lastError: null,
        errorBoundaryInfo: null,
        distractionMode: 'normal',
        showProgressIndicators: true,
        enableMicroFeedback: true,
        gentleReminders: true,

        // Preference actions
        setPreferences: (newPreferences) => set(
          (state) => ({
            preferences: { ...state.preferences, ...newPreferences }
          }),
          false,
          'setPreferences'
        ),

        // Navigation actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
        
        setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),
        
        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }, false, 'setBreadcrumbs'),

        // Modal actions
        openModal: (modalId, data) => set({
          activeModal: modalId,
          modalData: data
        }, false, 'openModal'),
        
        closeModal: () => set({
          activeModal: null,
          modalData: null
        }, false, 'closeModal'),
        
        toggleCommandPalette: () => set(
          (state) => ({ showCommandPalette: !state.showCommandPalette }),
          false,
          'toggleCommandPalette'
        ),

        // Focus actions
        setFocusMode: (enabled) => set({ focusMode: enabled }, false, 'setFocusMode'),
        
        setKeyboardNavigation: (enabled) => set(
          { keyboardNavigation: enabled },
          false,
          'setKeyboardNavigation'
        ),
        
        setScreenReaderMode: (enabled) => set(
          { screenReaderMode: enabled },
          false,
          'setScreenReaderMode'
        ),

        // Notification actions
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            read: false
          };
          
          set(
            (state) => ({
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + 1
            }),
            false,
            'addNotification'
          );
          
          // Auto-remove notification after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },
        
        removeNotification: (id) => set(
          (state) => {
            const notification = state.notifications.find(n => n.id === id);
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: notification && !notification.read 
                ? state.unreadCount - 1 
                : state.unreadCount
            };
          },
          false,
          'removeNotification'
        ),
        
        markNotificationRead: (id) => set(
          (state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (!notification || notification.read) return state;
            
            return {
              notifications: state.notifications.map(n => 
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: state.unreadCount - 1
            };
          },
          false,
          'markNotificationRead'
        ),
        
        clearAllNotifications: () => set({
          notifications: [],
          unreadCount: 0
        }, false, 'clearAllNotifications'),

        // Loading actions
        setGlobalLoading: (loading, message = '') => set({
          globalLoading: loading,
          loadingMessage: message
        }, false, 'setGlobalLoading'),

        // Error actions
        setLastError: (error) => set({ lastError: error }, false, 'setLastError'),
        
        setErrorBoundaryInfo: (info) => set(
          { errorBoundaryInfo: info },
          false,
          'setErrorBoundaryInfo'
        ),

        // ADHD actions
        setDistractionMode: (mode) => set(
          { distractionMode: mode },
          false,
          'setDistractionMode'
        ),
        
        toggleProgressIndicators: () => set(
          (state) => ({ showProgressIndicators: !state.showProgressIndicators }),
          false,
          'toggleProgressIndicators'
        ),
        
        toggleMicroFeedback: () => set(
          (state) => ({ enableMicroFeedback: !state.enableMicroFeedback }),
          false,
          'toggleMicroFeedback'
        ),
        
        toggleGentleReminders: () => set(
          (state) => ({ gentleReminders: !state.gentleReminders }),
          false,
          'toggleGentleReminders'
        ),

        // Utility actions
        resetUI: () => set({
          preferences: defaultPreferences,
          sidebarOpen: true,
          activeModal: null,
          modalData: null,
          showCommandPalette: false,
          focusMode: false,
          keyboardNavigation: false,
          screenReaderMode: false,
          notifications: [],
          unreadCount: 0,
          globalLoading: false,
          loadingMessage: '',
          lastError: null,
          errorBoundaryInfo: null,
          distractionMode: 'normal',
          showProgressIndicators: true,
          enableMicroFeedback: true,
          gentleReminders: true
        }, false, 'resetUI'),
        
        exportPreferences: () => get().preferences,
        
        importPreferences: (preferences) => set(
          { preferences },
          false,
          'importPreferences'
        )
      }),
      {
        name: 'tsunami-ui-store',
        partialize: (state) => ({
          preferences: state.preferences,
          sidebarOpen: state.sidebarOpen,
          focusMode: state.focusMode,
          distractionMode: state.distractionMode,
          showProgressIndicators: state.showProgressIndicators,
          enableMicroFeedback: state.enableMicroFeedback,
          gentleReminders: state.gentleReminders
        })
      }
    ),
    {
      name: 'UIStore'
    }
  )
);

// Selettori per ottimizzare le performance
export const useUISelectors = () => {
  const preferences = useUIStore(state => state.preferences);
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const currentPage = useUIStore(state => state.currentPage);
  const breadcrumbs = useUIStore(state => state.breadcrumbs);
  const activeModal = useUIStore(state => state.activeModal);
  const modalData = useUIStore(state => state.modalData);
  const focusMode = useUIStore(state => state.focusMode);
  const notifications = useUIStore(state => state.notifications);
  const unreadCount = useUIStore(state => state.unreadCount);
  const globalLoading = useUIStore(state => state.globalLoading);
  const loadingMessage = useUIStore(state => state.loadingMessage);
  const distractionMode = useUIStore(state => state.distractionMode);
  const enableMicroFeedback = useUIStore(state => state.enableMicroFeedback);
  
  return {
    preferences,
    sidebarOpen,
    currentPage,
    breadcrumbs,
    activeModal,
    modalData,
    focusMode,
    notifications,
    unreadCount,
    globalLoading,
    loadingMessage,
    distractionMode,
    enableMicroFeedback
  };
};

// Actions selectors
export const useUIActions = () => {
  const setPreferences = useUIStore(state => state.setPreferences);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const setCurrentPage = useUIStore(state => state.setCurrentPage);
  const setBreadcrumbs = useUIStore(state => state.setBreadcrumbs);
  const openModal = useUIStore(state => state.openModal);
  const closeModal = useUIStore(state => state.closeModal);
  const toggleCommandPalette = useUIStore(state => state.toggleCommandPalette);
  const setFocusMode = useUIStore(state => state.setFocusMode);
  const addNotification = useUIStore(state => state.addNotification);
  const removeNotification = useUIStore(state => state.removeNotification);
  const markNotificationRead = useUIStore(state => state.markNotificationRead);
  const clearAllNotifications = useUIStore(state => state.clearAllNotifications);
  const setGlobalLoading = useUIStore(state => state.setGlobalLoading);
  const setDistractionMode = useUIStore(state => state.setDistractionMode);
  const toggleMicroFeedback = useUIStore(state => state.toggleMicroFeedback);
  
  return {
    setPreferences,
    setSidebarOpen,
    setCurrentPage,
    setBreadcrumbs,
    openModal,
    closeModal,
    toggleCommandPalette,
    setFocusMode,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
    setGlobalLoading,
    setDistractionMode,
    toggleMicroFeedback
  };
};

// Hook per notifiche ADHD-friendly
export const useADHDNotifications = () => {
  const { addNotification, enableMicroFeedback } = useUIStore(state => ({
    addNotification: state.addNotification,
    enableMicroFeedback: state.enableMicroFeedback
  }));
  
  const showSuccess = (title: string, message?: string) => {
    if (!enableMicroFeedback) return;
    
    addNotification({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  };
  
  const showGentleError = (title: string, message?: string) => {
    addNotification({
      type: 'error',
      title: `Ops! ${title}`,
      message: message ? `${message} 💙 Non preoccuparti, puoi riprovare!` : undefined,
      duration: 5000
    });
  };
  
  const showEncouragement = (title: string, message?: string) => {
    if (!enableMicroFeedback) return;
    
    addNotification({
      type: 'info',
      title: `🌟 ${title}`,
      message,
      duration: 4000
    });
  };
  
  const showGentleReminder = (title: string, message?: string) => {
    const { gentleReminders } = useUIStore.getState();
    if (!gentleReminders) return;
    
    addNotification({
      type: 'warning',
      title: `💡 ${title}`,
      message,
      duration: 6000
    });
  };
  
  return {
    showSuccess,
    showGentleError,
    showEncouragement,
    showGentleReminder
  };
};