/**
 * Main JavaScript file for Automatic Pet Feeder Web Application
 * Contains shared functionality used across multiple pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initMobileMenu();
    initDropdowns();
    initTooltips();
    initModals();
    initFormLoadingStates();
    initAnimations();
    
    // Check if dark mode is enabled
    checkDarkMode();
    
    // Setup global event listeners
    setupGlobalEventListeners();
});

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuCloseBtn = document.querySelector('.mobile-menu-close');
    const body = document.body;
    
    if (!menuToggle || !mobileMenu) return;
    
    menuToggle.addEventListener('click', function() {
        // Add animate class before toggling active for better performance
        mobileMenu.classList.add('animate');
        
        // Toggle mobile menu
        mobileMenu.classList.toggle('active');
        body.classList.toggle('menu-open');
        
        // Update aria attributes
        const isExpanded = mobileMenu.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
        
        // Remove animate class after animation completes
        setTimeout(() => {
            mobileMenu.classList.remove('animate');
            mobileMenu.classList.add('animation-done');
        }, 300);
    });
    
    // Close menu when close button is clicked
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', false);
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileMenu && mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('active');
            body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', false);
        }
    });
}

/**
 * Initialize dropdown functionality
 */
function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        const dropdown = toggle.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!menu) return;
        
        // Set initial state
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add animate class for better performance
            menu.classList.add('animate');
            
            // Toggle dropdown
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            menu.setAttribute('aria-hidden', isExpanded);
            
            menu.classList.toggle('active');
            
            // Remove animate class after animation completes
            setTimeout(() => {
                menu.classList.remove('animate');
                menu.classList.add('animation-done');
            }, 300);
            
            // Close other dropdowns
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    const otherDropdown = otherToggle.closest('.dropdown');
                    const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                    
                    if (otherMenu && otherMenu.classList.contains('active')) {
                        otherToggle.setAttribute('aria-expanded', 'false');
                        otherMenu.setAttribute('aria-hidden', 'true');
                        otherMenu.classList.remove('active');
                    }
                }
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        dropdownToggles.forEach(toggle => {
            const dropdown = toggle.closest('.dropdown');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (menu && menu.classList.contains('active') && 
                !dropdown.contains(e.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                menu.setAttribute('aria-hidden', 'true');
                menu.classList.remove('active');
            }
        });
    });
}

/**
 * Initialize tooltips functionality
 */
function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        const tooltipText = trigger.getAttribute('data-tooltip');
        const tooltipPosition = trigger.getAttribute('data-tooltip-position') || 'top';
        
        if (!tooltipText) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${tooltipPosition} animate`;
        tooltip.textContent = tooltipText;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.style.display = 'none';
        
        document.body.appendChild(tooltip);
        
        const showTooltip = () => {
            tooltip.style.display = 'block';
            tooltip.classList.add('active');
            
            // Position the tooltip
            const triggerRect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let top, left;
            
            switch (tooltipPosition) {
                case 'top':
                    top = triggerRect.top - tooltipRect.height - 10;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = triggerRect.bottom + 10;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.left - tooltipRect.width - 10;
                    break;
                case 'right':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.right + 10;
                    break;
            }
            
            tooltip.style.top = `${Math.max(top, 5)}px`;
            tooltip.style.left = `${Math.max(left, 5)}px`;
            
            setTimeout(() => {
                tooltip.classList.remove('animate');
                tooltip.classList.add('animation-done');
            }, 300);
        };
        
        const hideTooltip = () => {
            tooltip.classList.remove('active', 'animation-done');
            tooltip.classList.add('animate');
            
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 200);
        };
        
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
        trigger.addEventListener('focus', showTooltip);
        trigger.addEventListener('blur', hideTooltip);
    });
}

/**
 * Initialize modal functionality
 */
function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    
    modalTriggers.forEach(trigger => {
        const modalId = trigger.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        const closeButtons = modal.querySelectorAll('.modal-close');
        
        // Set initial ARIA attributes
        modal.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', modalId);
        
        // Toggle modal
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(modal);
        });
        
        // Close modal with close buttons
        closeButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                closeModal(modal);
            });
        });
        
        // Close modal when clicking on backdrop
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal(modal);
            }
        });
    });
    
    // Special handling for "feed now" modal
    const feedNowModal = document.getElementById('feed-now-modal');
    if (feedNowModal) {
        const feedNowForm = feedNowModal.querySelector('form');
        const deviceSelect = feedNowModal.querySelector('#device-select');
        const petSelect = feedNowModal.querySelector('#pet-select');
        
        if (feedNowForm && deviceSelect && petSelect) {
            feedNowForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Here you would handle the feed now request
                console.log('Feed now request:', {
                    device: deviceSelect.value,
                    pet: petSelect.value,
                    amount: feedNowModal.querySelector('#portion-size').value
                });
                
                // Show success message and close modal
                showToast('Pet has been fed successfully!', 'success');
                closeModal(feedNowModal);
            });
        }
    }
}

/**
 * Open a modal
 */
function openModal(modal) {
    if (!modal) return;
    
    // Add animate class for better performance
    modal.classList.add('animate');
    document.body.classList.add('modal-open');
    
    // Make modal visible
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the first focusable element
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
    
    // Remove animate class after animation completes
    setTimeout(() => {
        modal.classList.remove('animate');
        modal.classList.add('animation-done');
    }, 300);
}

/**
 * Close a modal
 */
function closeModal(modal) {
    if (!modal) return;
    
    // Add animate class for better performance
    modal.classList.add('animate');
    modal.classList.remove('animation-done');
    
    // Hide modal
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    // Re-focus the element that opened the modal
    const modalId = modal.id;
    const trigger = document.querySelector(`[data-modal="${modalId}"]`);
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
    }
    
    // Remove animate class after animation completes
    setTimeout(() => {
        modal.classList.remove('animate');
    }, 300);
}

/**
 * Initialize form loading states
 */
function initFormLoadingStates() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitButton = form.querySelector('button[type="submit"]');
            
            if (submitButton && !submitButton.classList.contains('no-loading')) {
                const buttonText = submitButton.textContent;
                
                // Save original button text
                if (!submitButton.hasAttribute('data-original-text')) {
                    submitButton.setAttribute('data-original-text', buttonText);
                }
                
                // Show loading state
                submitButton.disabled = true;
                submitButton.classList.add('loading');
                
                // Use loading text or spinner
                if (submitButton.hasAttribute('data-loading-text')) {
                    submitButton.textContent = submitButton.getAttribute('data-loading-text');
                } else {
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                }
                
                // Reset button state after form submission completes
                // This is for forms that aren't actually submitted (e.g., AJAX forms)
                setTimeout(() => {
                    const isStillLoading = submitButton.classList.contains('loading');
                    
                    if (isStillLoading && !form.hasAttribute('data-ajax-form')) {
                        submitButton.disabled = false;
                        submitButton.classList.remove('loading');
                        submitButton.textContent = submitButton.getAttribute('data-original-text');
                    }
                }, 5000); // 5 second timeout
            }
        });
    });
}

/**
 * Initialize animations
 */
function initAnimations() {
    // Add intersection observer for scroll animations
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate', 'animate-visible');
                    
                    // Remove animate class after animation completes
                    setTimeout(() => {
                        entry.target.classList.remove('animate');
                        entry.target.classList.add('animation-done');
                    }, 1000);
                    
                    // Stop observing after animation
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
}

/**
 * Check dark mode preference
 */
function checkDarkMode() {
    const darkModeToggle = document.querySelector('.theme-toggle');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme');
    
    // Set initial theme based on preference or stored value
    if (storedTheme === 'dark' || (!storedTheme && prefersDarkMode.matches)) {
        document.body.classList.add('dark-theme');
    }
    
    // Toggle theme when button is clicked
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            // Store theme preference
            const isDarkMode = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Close toast messages
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }
    });
}

/**
 * Format date and time
 * @param {Date|string} dateTime Date object or date string
 * @param {string} format Format options: 'datetime', 'date', 'time', 'relative'
 */
function formatDateTime(dateTime, format = 'datetime') {
    if (!dateTime) return 'N/A';
    
    const date = new Date(dateTime);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = {
        date: { year: 'numeric', month: 'short', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        relative: { } // No options needed for relative time
    };
    
    if (format === 'relative') {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        
        // If more than a week ago, show the date
        return date.toLocaleDateString(undefined, options.date);
    }
    
    return date.toLocaleString(undefined, options[format] || options.datetime);
}

/**
 * Format number with commas for thousands
 */
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
} 