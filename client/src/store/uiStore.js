import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toasts: [],
      showNotifications: false,
      showCreateChannel: false,
      showUserSearch: false,
      showProfile: false,

      showBrowseChannels: false,
      showPasswordPrompt: null, // holds { channel } when prompting
      editingMessage: null,
      imagePreview: null,

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', newTheme);
          return { theme: newTheme };
        });
      },

      addToast: (message, type = 'info') => {
        const id = Date.now();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 4000);
      },

      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      toggleNotifications: () => set((state) => ({ showNotifications: !state.showNotifications })),
      closeNotifications: () => set({ showNotifications: false }),
      toggleCreateChannel: () => set((state) => ({ showCreateChannel: !state.showCreateChannel })),
      closeCreateChannel: () => set({ showCreateChannel: false }),
      toggleUserSearch: () => set((state) => ({ showUserSearch: !state.showUserSearch })),
      closeUserSearch: () => set({ showUserSearch: false }),
      toggleProfile: () => set((state) => ({ showProfile: !state.showProfile })),
      closeProfile: () => set({ showProfile: false }),
      setEditingMessage: (message) => set({ editingMessage: message }),
      clearEditingMessage: () => set({ editingMessage: null }),
      setImagePreview: (url) => set({ imagePreview: url }),
      clearImagePreview: () => set({ imagePreview: null }),


      // Browse channels
      openBrowseChannels: () => set({ showBrowseChannels: true }),
      closeBrowseChannels: () => set({ showBrowseChannels: false }),

      // Password prompt
      openPasswordPrompt: (channel) => set({ showPasswordPrompt: channel }),
      closePasswordPrompt: () => set({ showPasswordPrompt: null }),
    }),
    { name: 'chatsphere-ui', partialize: (state) => ({ theme: state.theme }) }
  )
);

export default useUIStore;