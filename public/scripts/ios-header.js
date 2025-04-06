/**
 * iOS Header and Notifications Interactive Functions
 * Handles dropdown behavior, notifications interaction, and consistent header display
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize header components
    initializeHeaderInteractions();
    initializeNotifications();
});

/**
 * Initialize all dropdown interactions in the header
 */
function initializeHeaderInteractions() {
    // Profile dropdown toggle
    const profileButton = document.querySelector('.profile-button');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close all other dropdowns first
            document.querySelectorAll('.ios-dropdown').forEach(dropdown => {
                if (dropdown !== profileDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            profileDropdown.classList.toggle('active');
        });
    }
    
    // Notification dropdown toggle
    const notificationBell = document.querySelector('.notification-bell');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    
    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close all other dropdowns first
            document.querySelectorAll('.ios-dropdown').forEach(dropdown => {
                if (dropdown !== notificationDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            notificationDropdown.classList.toggle('active');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.ios-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
    
    // Prevent closing when clicking inside dropdown
    document.querySelectorAll('.ios-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

/**
 * Initialize notification functionality
 */
function initializeNotifications() {
    // Mark all as read functionality
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update the notification badge count
            updateNotificationBadge();
            
            // Show a success message if desired
            showToast('All notifications marked as read');
        });
    }
    
    // Individual notification close buttons
    document.querySelectorAll('.notification-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const notificationItem = this.closest('.notification-item');
            
            // Add fade-out animation
            notificationItem.style.transition = 'opacity 0.3s ease, height 0.3s ease, padding 0.3s ease, margin 0.3s ease';
            notificationItem.style.opacity = '0';
            notificationItem.style.height = '0';
            notificationItem.style.padding = '0';
            notificationItem.style.margin = '0';
            notificationItem.style.overflow = 'hidden';
            
            // Remove after animation completes
            setTimeout(() => {
                notificationItem.remove();
                updateNotificationBadge();
            }, 300);
            
            // Show a success message if desired
            showToast('Notification dismissed');
        });
    });
    
    // Make notification items clickable
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            const isUnread = this.classList.contains('unread');
            if (isUnread) {
                this.classList.remove('unread');
                updateNotificationBadge();
            }
            
            // Here you would typically navigate to the relevant page or show more details
            // For now, we'll just show a toast message
            const notificationText = this.querySelector('.notification-text').textContent;
            showToast(`Viewing: ${notificationText}`);
        });
    });
    
    // Initialize notification badge count
    updateNotificationBadge();
}

/**
 * Update the notification badge count based on unread notifications
 */
function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Show a toast message
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'success') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
        </div>
        <button class="toast-close">×</button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add slide-in animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Set auto-dismiss
    const dismissTimeout = setTimeout(() => {
        dismissToast(toast);
    }, 3000);
    
    // Add close button functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        clearTimeout(dismissTimeout);
        dismissToast(toast);
    });
}

/**
 * Dismiss a toast with animation
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
    toast.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Export functionality for use in other scripts
if (typeof window !== 'undefined') {
    window.iosHeader = {
        updateNotificationBadge,
        showToast
    };
}