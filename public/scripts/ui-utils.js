/**
 * UI utilities for Automatic Pet Feeder
 * Contains helper functions for UI manipulation, animations, and interactions
 */

// UI utilities object
const uiUtils = {
    /**
     * Initialize UI utilities
     */
    init() {
        this.initDarkModeToggle();
        this.initSidebarToggle();
        this.initDropdowns();
        this.initModals();
        
        // Initialize device card interactions
        this.initDeviceCards();
        
        // Initialize responsive tables
        this.initResponsiveTables();
        
        console.log('UI utilities initialized');
    },
    
    /**
     * Initialize dark mode toggle
     */
    initDarkModeToggle() {
        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            this.updateDarkModeToggleIcon(true);
        } else if (savedDarkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // If no saved preference, check system preference
            document.body.classList.add('dark-mode');
            this.updateDarkModeToggleIcon(true);
        }
        
        // Add event listeners to dark mode toggles
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDarkMode = document.body.classList.contains('dark-mode');
                localStorage.setItem('darkMode', isDarkMode);
                this.updateDarkModeToggleIcon(isDarkMode);
            });
        });
    },
    
    /**
     * Update dark mode toggle icon
     * @param {boolean} isDarkMode - Whether dark mode is active
     */
    updateDarkModeToggleIcon(isDarkMode) {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                if (isDarkMode) {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        });
    },
    
    /**
     * Initialize sidebar toggle
     */
    initSidebarToggle() {
        const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar, .ios-sidebar');
        
        if (sidebar && sidebarToggles.length) {
            sidebarToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                    document.body.classList.toggle('sidebar-collapsed');
                    
                    // Save preference
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    localStorage.setItem('sidebarCollapsed', isCollapsed);
                });
            });
            
            // Check for saved preference
            const savedCollapsed = localStorage.getItem('sidebarCollapsed');
            if (savedCollapsed === 'true') {
                sidebar.classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        }
        
        // Mobile menu toggle
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const closeMenu = document.querySelector('.mobile-menu-close');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('open');
                document.body.classList.add('menu-open');
            });
            
            if (closeMenu) {
                closeMenu.addEventListener('click', () => {
                    mobileMenu.classList.remove('open');
                    document.body.classList.remove('menu-open');
                });
            }
        }
    },
    
    /**
     * Initialize dropdowns
     */
    initDropdowns() {
        const dropdownToggles = document.querySelectorAll('[data-toggle="dropdown"]');
        
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(toggle.getAttribute('data-target'));
                if (target) {
                    target.classList.toggle('show');
                    
                    // Close when clicking outside
                    const closeDropdown = (event) => {
                        if (!target.contains(event.target) && !toggle.contains(event.target)) {
                            target.classList.remove('show');
                            document.removeEventListener('click', closeDropdown);
                        }
                    };
                    
                    document.addEventListener('click', closeDropdown);
                }
            });
        });
    },
    
    /**
     * Initialize modals
     */
    initModals() {
        // Modal open triggers
        const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
        
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-target');
                const modal = document.querySelector(modalId);
                
                if (modal) {
                    this.openModal(modal);
                }
            });
        });
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('[data-dismiss="modal"], .modal-close');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal, .ios-modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Close modal on outside click
        const modals = document.querySelectorAll('.modal, .ios-modal');
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    },
    
    /**
     * Open a modal
     * @param {HTMLElement} modal - The modal element to open
     */
    openModal(modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('open');
        }, 10);
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Close a modal
     * @param {HTMLElement} modal - The modal element to close
     */
    closeModal(modal) {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    },
    
    /**
     * Initialize device cards
     */
    initDeviceCards() {
        // Update progress bars in device cards
        const progressBars = document.querySelectorAll('.progress-bar');
        
        progressBars.forEach(progressBar => {
            const value = progressBar.getAttribute('data-value');
            if (value) {
                const fill = document.createElement('div');
                fill.className = 'progress-bar-fill';
                fill.style.width = `${value}%`;
                
                // Add color classes based on value
                if (value <= 25) {
                    fill.classList.add('low');
                } else if (value <= 60) {
                    fill.classList.add('medium');
                } else {
                    fill.classList.add('good');
                }
                
                progressBar.appendChild(fill);
            }
        });
    },
    
    /**
     * Initialize responsive tables
     */
    initResponsiveTables() {
        const tables = document.querySelectorAll('.responsive-table');
        
        tables.forEach(table => {
            const headerCells = table.querySelectorAll('thead th');
            const dataCells = table.querySelectorAll('tbody td');
            
            if (headerCells.length) {
                const headerTexts = [];
                headerCells.forEach(cell => {
                    headerTexts.push(cell.textContent);
                });
                
                dataCells.forEach((cell, index) => {
                    const headerIndex = index % headerCells.length;
                    cell.setAttribute('data-label', headerTexts[headerIndex]);
                });
            }
        });
    },
    
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Add content
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                               type === 'error' ? 'fa-exclamation-circle' :
                               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('visible');
        }, 10);
        
        // Auto dismiss
        const dismissTimeout = setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(dismissTimeout);
                this.dismissToast(toast);
            });
        }
        
        return toast;
    },
    
    /**
     * Dismiss a toast notification
     * @param {HTMLElement} toast - The toast element to dismiss
     */
    dismissToast(toast) {
        if (!toast) return;
        
        toast.classList.add('toast-hiding');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Initialize UI utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    uiUtils.init();
    
    // Make uiUtils globally available
    window.uiUtils = uiUtils;
});
