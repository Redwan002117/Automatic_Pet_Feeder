/**
 * Utility functions for the Automatic Pet Feeder application
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in ms to show the toast
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate`;
    
    // Create content
    toast.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon fas ${getIconForType(type)}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;
    
    // Add toast to container
    // Limit to 3 visible toasts at a time
    const existingToasts = toastContainer.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        dismissToast(existingToasts[0]);
    }
    
    toastContainer.appendChild(toast);
    
    // Show the toast with animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
            
            // Add haptic feedback if available (iOS)
            if (window.navigator && window.navigator.vibrate) {
                // Light vibration for notification
                window.navigator.vibrate(10);
            }
            
            // Remove animate class after animation completes
            setTimeout(() => {
                toast.classList.remove('animate');
                toast.classList.add('animation-done');
            }, 300);
        });
    });
    
    // Set close button action
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            dismissToast(toast);
        });
    }
    
    // Auto dismiss after duration
    setTimeout(() => {
        dismissToast(toast);
    }, duration);
    
    // Return the toast element for potential manipulation
    return toast;
}

/**
 * Dismiss a toast notification with animation
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
    if (!toast || toast.classList.contains('dismissing')) return;
    
    // Prevent multiple dismissals
    toast.classList.add('dismissing');
    
    // Add animate class for better performance
    toast.classList.add('animate');
    toast.classList.remove('animation-done');
    toast.classList.remove('show');
    
    // Remove the toast after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Get the appropriate icon for the toast type
 * @param {string} type - The type of toast
 * @returns {string} Icon class
 */
function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @param {string} format - The format type (datetime, date, time, relative)
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'datetime') {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    const options = {
        date: { year: 'numeric', month: 'short', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        relative: {} // No options needed for relative time
    };
    
    if (format === 'relative') {
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        
        // If more than a week ago, show the date
        return dateObj.toLocaleDateString(undefined, options.date);
    }
    
    return dateObj.toLocaleString(undefined, options[format] || options.datetime);
}

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} func - The function to throttle
 * @param {number} delay - Delay in ms between function calls
 * @returns {Function} Throttled function
 */
function throttle(func, delay = 100) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * Debounce a function to prevent multiple calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in ms before the function is called
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Initialize animated elements on scroll using Intersection Observer
 * @param {string} selector - CSS selector for elements to animate
 */
function initAnimatedElements(selector = '.animate-on-scroll') {
    const animatedElements = document.querySelectorAll(selector);
    
    if (!animatedElements.length) return;
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate', 'animate-visible');
                    
                    // Remove animate class after animation completes
                    setTimeout(() => {
                        entry.target.classList.remove('animate');
                        entry.target.classList.add('animation-done');
                    }, 1000);
                    
                    // Stop observing after animating
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );
    
    // Start observing each element
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Format a number for display
 * @param {number} number - The number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

/**
 * Create a page transition effect between pages
 * @param {string} targetUrl - The URL to navigate to
 */
function pageTransition(targetUrl) {
    // Create transition element if it doesn't exist
    let transition = document.querySelector('.page-transition');
    if (!transition) {
        transition = document.createElement('div');
        transition.className = 'page-transition';
        document.body.appendChild(transition);
    }
    
    // Animate transition in
    requestAnimationFrame(() => {
        transition.classList.add('active', 'animate');
        
        // Navigate after animation completes
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 500);
    });
}

// Make functions available globally
window.showToast = showToast;
window.dismissToast = dismissToast; 