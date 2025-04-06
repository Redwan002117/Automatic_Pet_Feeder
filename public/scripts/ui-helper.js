/**
 * UI Helper for iOS-style interactions and animations
 * Provides functionality for interactive iOS-inspired UI elements
 */

const iOSUI = {
    /**
     * Initialize iOS UI helpers
     */
    init() {
        this.initThemeToggle();
        this.initSidebar();
        this.initModals();
        this.initSegmentedControls();
        this.initTabs();
        this.initTooltips();
        this.initAnimations();
        console.log('iOS UI helpers initialized');
    },

    /**
     * Initialize theme toggle functionality
     */
    initThemeToggle() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-mode');
        } else if (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // If no preference is saved, check system preference
            document.body.classList.add('dark-mode');
        }
        
        // Set up theme toggle listeners
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
                this.updateThemeToggleIcons();
            });
        });
        
        // Initialize theme toggle icons
        this.updateThemeToggleIcons();
    },
    
    /**
     * Update theme toggle icons based on current theme
     */
    updateThemeToggleIcons() {
        const isDarkMode = document.body.classList.contains('dark-mode');
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
     * Initialize sidebar functionality
     */
    initSidebar() {
        const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
        const sidebar = document.querySelector('.ios-sidebar');
        
        if (sidebar && sidebarToggles.length) {
            // Check for saved sidebar state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
            }
            
            // Set up sidebar toggle listeners
            sidebarToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
                });
            });
            
            // Handle mobile sidebar
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            const mobileClose = document.querySelector('.mobile-menu-close');
            
            if (mobileToggle) {
                mobileToggle.addEventListener('click', () => {
                    sidebar.classList.add('open');
                });
            }
            
            if (mobileClose) {
                mobileClose.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                });
            }
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (event) => {
                if (window.innerWidth < 992 && 
                    sidebar.classList.contains('open') && 
                    !sidebar.contains(event.target) && 
                    !mobileToggle.contains(event.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    },
    
    /**
     * Initialize modal functionality
     */
    initModals() {
        // Modal triggers
        const modalTriggers = document.querySelectorAll('[data-modal]');
        
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                
                if (modal) {
                    this.openModal(modal);
                }
            });
        });
        
        // Close buttons
        const closeButtons = document.querySelectorAll('.ios-modal-close, [data-dismiss="modal"]');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.ios-modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Close on backdrop click
        const modals = document.querySelectorAll('.ios-modal');
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    },
    
    /**
     * Open a modal with iOS animation
     * @param {HTMLElement} modal - The modal element to open
     */
    openModal(modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Close a modal with iOS animation
     * @param {HTMLElement} modal - The modal element to close
     */
    closeModal(modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    },
    
    /**
     * Initialize segmented controls
     */
    initSegmentedControls() {
        const segmentedControls = document.querySelectorAll('.ios-segmented-control');
        
        segmentedControls.forEach(control => {
            const segments = control.querySelectorAll('.ios-segment');
            const highlighter = document.createElement('div');
            highlighter.className = 'ios-segment-highlighter';
            control.appendChild(highlighter);
            
            // Find active segment
            let activeSegment = control.querySelector('.ios-segment.active');
            if (!activeSegment && segments.length) {
                activeSegment = segments[0];
                activeSegment.classList.add('active');
            }
            
            // Position highlighter
            if (activeSegment) {
                const rect = activeSegment.getBoundingClientRect();
                const controlRect = control.getBoundingClientRect();
                
                highlighter.style.width = `${rect.width}px`;
                highlighter.style.transform = `translateX(${rect.left - controlRect.left}px)`;
            }
            
            // Add click listeners
            segments.forEach(segment => {
                segment.addEventListener('click', () => {
                    segments.forEach(s => s.classList.remove('active'));
                    segment.classList.add('active');
                    
                    // Move highlighter
                    const rect = segment.getBoundingClientRect();
                    const controlRect = control.getBoundingClientRect();
                    
                    highlighter.style.width = `${rect.width}px`;
                    highlighter.style.transform = `translateX(${rect.left - controlRect.left}px)`;
                    
                    // Trigger change event
                    const event = new CustomEvent('segment:change', {
                        detail: {
                            control,
                            segment,
                            value: segment.getAttribute('data-value') || segment.innerText
                        }
                    });
                    control.dispatchEvent(event);
                });
            });
        });
    },
    
    /**
     * Initialize tabs
     */
    initTabs() {
        const tabGroups = document.querySelectorAll('[data-tab-group]');
        
        tabGroups.forEach(group => {
            const tabs = group.querySelectorAll('.ios-tab');
            const panes = document.querySelectorAll(`[data-tab-pane="${group.getAttribute('data-tab-group')}"]`);
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Deactivate all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // Activate clicked tab
                    tab.classList.add('active');
                    
                    // Hide all panes
                    panes.forEach(pane => pane.style.display = 'none');
                    
                    // Show corresponding pane
                    const targetPane = document.querySelector(`[data-tab-pane="${group.getAttribute('data-tab-group')}"][data-tab-id="${tab.getAttribute('data-tab-id')}"]`);
                    if (targetPane) {
                        targetPane.style.display = 'block';
                    }
                });
            });
            
            // Activate first tab by default
            if (tabs.length && !group.querySelector('.ios-tab.active')) {
                tabs[0].click();
            }
        });
    },
    
    /**
     * Initialize tooltips
     */
    initTooltips() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
        
        tooltipTriggers.forEach(trigger => {
            const tooltipText = trigger.getAttribute('data-tooltip');
            const tooltipPosition = trigger.getAttribute('data-tooltip-position') || 'top';
            
            trigger.addEventListener('mouseenter', () => {
                const tooltip = document.createElement('div');
                tooltip.className = `ios-tooltip ios-tooltip-${tooltipPosition}`;
                tooltip.innerText = tooltipText;
                document.body.appendChild(tooltip);
                
                const triggerRect = trigger.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                // Position the tooltip
                switch (tooltipPosition) {
                    case 'top':
                        tooltip.style.bottom = `${window.innerHeight - triggerRect.top + 10}px`;
                        tooltip.style.left = `${triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)}px`;
                        break;
                    case 'bottom':
                        tooltip.style.top = `${triggerRect.bottom + 10}px`;
                        tooltip.style.left = `${triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)}px`;
                        break;
                    case 'left':
                        tooltip.style.top = `${triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)}px`;
                        tooltip.style.right = `${window.innerWidth - triggerRect.left + 10}px`;
                        break;
                    case 'right':
                        tooltip.style.top = `${triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)}px`;
                        tooltip.style.left = `${triggerRect.right + 10}px`;
                        break;
                }
                
                // Show the tooltip
                setTimeout(() => {
                    tooltip.classList.add('visible');
                }, 10);
                
                // Store the tooltip reference
                trigger._tooltip = tooltip;
            });
            
            trigger.addEventListener('mouseleave', () => {
                if (trigger._tooltip) {
                    trigger._tooltip.classList.remove('visible');
                    
                    setTimeout(() => {
                        if (trigger._tooltip && trigger._tooltip.parentNode) {
                            trigger._tooltip.parentNode.removeChild(trigger._tooltip);
                            trigger._tooltip = null;
                        }
                    }, 300);
                }
            });
        });
    },
    
    /**
     * Initialize animations for iOS effects
     */
    initAnimations() {
        // Animation for list items entrance
        const animateItems = document.querySelectorAll('.ios-animate');
        
        if (animateItems.length) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('ios-animated');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            animateItems.forEach(item => {
                observer.observe(item);
            });
        }
    },
    
    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, title = '', type = 'info', duration = 4000) {
        // Create container if it doesn't exist
        let container = document.querySelector('.ios-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'ios-toast-container';
            document.body.appendChild(container);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `ios-toast ios-toast-${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        toast.innerHTML = `
            <div class="ios-toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="ios-toast-content">
                ${title ? `<div class="ios-toast-title">${title}</div>` : ''}
                <div class="ios-toast-message">${message}</div>
            </div>
            <button class="ios-toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        container.appendChild(toast);
        
        // Set up auto-dismiss
        const timeoutId = setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
        
        // Set up close button
        const closeBtn = toast.querySelector('.ios-toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.dismissToast(toast);
        });
        
        return toast;
    },
    
    /**
     * Dismiss a toast notification
     * @param {HTMLElement} toast - The toast element
     */
    dismissToast(toast) {
        if (!toast) return;
        
        toast.classList.add('ios-toast-hiding');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    iOSUI.init();
    // Make iOSUI globally available
    window.iOSUI = iOSUI;
});

/**
 * Toast Notification System
 * 
 * This script provides an iOS-styled toast notification system
 * for displaying temporary messages to the user.
 */

// Create toast container if it doesn't exist
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - How long to show the toast in ms
 */
function showToast(message, type = 'info', duration = 3000) {
    // Make this function available globally
    window.showToast = showToast;
    
    // Get or create toast container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    // Create icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Set content with icon and message
    toastContent.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', () => {
        hideToast(toast);
    });
    
    // Assemble toast
    toast.appendChild(toastContent);
    toast.appendChild(closeBtn);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Set timeout to remove toast
    const timeoutId = setTimeout(() => {
        hideToast(toast);
    }, duration);
    
    // Store timeout ID on toast element for potential early removal
    toast.dataset.timeoutId = timeoutId;
    
    // Return toast element in case it needs to be manipulated
    return toast;
}

/**
 * Hide a toast notification
 * @param {HTMLElement} toast - The toast element to hide
 */
function hideToast(toast) {
    // Clear the timeout
    clearTimeout(toast.dataset.timeoutId);
    
    // Start hiding animation
    toast.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300); // Match transition time from CSS
}

/**
 * Convenience methods for different toast types
 */
function showSuccessToast(message, duration) {
    return showToast(message, 'success', duration);
}

function showErrorToast(message, duration) {
    return showToast(message, 'error', duration);
}

function showWarningToast(message, duration) {
    return showToast(message, 'warning', duration);
}

function showInfoToast(message, duration) {
    return showToast(message, 'info', duration);
}

// Make toast functions available globally
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
