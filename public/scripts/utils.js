/**
 * Utility functions for the Automatic Pet Feeder app
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 * @returns {HTMLElement} The toast element
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
    dismissToast(toast);
  }, duration);
  
  // Close button
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearTimeout(dismissTimeout);
      dismissToast(toast);
    });
  }
  
  return toast;
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
  toast.classList.add('toast-hiding');
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Show or hide a loading indicator
 * @param {boolean} show - Whether to show or hide the loader
 * @param {string} message - Optional message to display with the loader
 */
function showLoading(show, message = 'Loading...') {
  try {
    let loadingEl = document.getElementById('app-loading');
    
    if (show) {
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'app-loading';
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
          <div class="loading-spinner-container">
            <div class="loading-spinner">
              <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <p class="loading-message">${message}</p>
          </div>
        `;
        document.body.appendChild(loadingEl);
      } else {
        // Update message if needed
        const messageEl = loadingEl.querySelector('.loading-message');
        if (messageEl) {
          messageEl.textContent = message;
        }
        loadingEl.style.display = 'flex';
      }
    } else if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  } catch (error) {
    console.error('Error showing/hiding loading indicator:', error);
    // Create a simple fallback loading indicator if the main one fails
    if (show) {
      const fallbackLoader = document.createElement('div');
      fallbackLoader.id = 'fallback-loader';
      fallbackLoader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;z-index:9999;';
      fallbackLoader.innerHTML = `<div style="text-align:center;"><div style="border:4px solid #f3f3f3;border-top:4px solid #007AFF;border-radius:50%;width:40px;height:40px;margin:0 auto;animation:spin 1s linear infinite;"></div><p style="margin-top:10px;">${message}</p></div>`;
      document.body.appendChild(fallbackLoader);
      
      // Add keyframe animation
      const style = document.createElement('style');
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    } else {
      const fallbackLoader = document.getElementById('fallback-loader');
      if (fallbackLoader) {
        fallbackLoader.remove();
      }
    }
  }
}

/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: options.includeTime ? 'short' : undefined
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
  } catch (err) {
    console.error('Error formatting date:', err);
    return String(date);
  }
}

/**
 * Format a time string (HH:MM) to AM/PM format
 * @param {string} timeString - Time string in HH:MM format
 * @returns {string} Formatted time string
 */
function formatTime(timeString) {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (err) {
    console.error('Error formatting time:', err);
    return timeString;
  }
}

/**
 * Safely access a nested property in an object
 * @param {object} obj - The object to access
 * @param {string} path - The property path (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The property value or default value
 */
function getProperty(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID
 * @returns {string} Random ID
 */
function generateId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a number with commas and decimal places
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(number, decimals = 0) {
  return Number(number).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} el - The element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(el) {
  if (!el) return false;
  
  const rect = el.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Debounce a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create an HTML element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {object} attrs - HTML attributes
 * @param {Array|string} children - Child elements or text content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  }
  
  return element;
}

// Export utils to window
window.utils = {
  showToast,
  dismissToast,
  showLoading,
  formatDate,
  formatTime,
  getProperty,
  generateId,
  capitalize,
  formatNumber,
  isInViewport,
  debounce,
  createElement
};