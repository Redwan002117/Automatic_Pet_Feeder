/**
 * Notifications Management
 * Handles all notification functionality across the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabase = initSupabase();
    
    // Check authentication before proceeding
    checkAuth(supabase);
    
    // Initialize notification components
    initNotificationBell();
    
    // Load and display notifications
    loadNotifications(supabase);
    
    // Setup notification polling
    setupNotificationPolling(supabase);
});

/**
 * Initialize the Supabase client
 */
function initSupabase() {
    if (window.supabase) {
        return window.supabase;
    }
    
    const supabaseUrl = window.appConfig ? window.appConfig.SUPABASE_URL : null;
    const supabaseKey = window.appConfig ? window.appConfig.SUPABASE_ANON_KEY : null;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration in appConfig');
        return null;
    }
    
    return supabase.createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if user is authenticated
 */
function checkAuth(supabase) {
    const user = supabase.auth.user();
    
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

/**
 * Initialize notification bell dropdown
 */
function initNotificationBell() {
    const notificationBell = document.querySelector('.notification-bell');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    
    if (!notificationBell || !notificationDropdown) return;
    
    // Toggle notification dropdown
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Toggle dropdown visibility
        notificationDropdown.classList.toggle('active');
        
        // If opening the dropdown, mark as seen
        if (notificationDropdown.classList.contains('active')) {
            markNotificationsAsSeen();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationDropdown.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationDropdown.classList.remove('active');
        }
    });
    
    // Mark all as read button
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            await markAllNotificationsAsRead();
        });
    }
    
    // Individual notification close buttons
    setupNotificationCloseButtons();
}

/**
 * Load notifications from the database
 */
async function loadNotifications(supabase) {
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        displayNotifications(data);
        updateNotificationCount(data);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Display notifications in the UI
 */
function displayNotifications(notifications) {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    // Clear current notifications
    notificationList.innerHTML = '';
    
    if (!notifications || notifications.length === 0) {
        notificationList.innerHTML = `
            <li class="notification-empty">
                <p>No notifications to display</p>
            </li>
        `;
        return;
    }
    
    // Add notifications to the list
    notifications.forEach(notification => {
        const notificationItem = createNotificationElement(notification);
        notificationList.appendChild(notificationItem);
    });
    
    // Setup close buttons for new notifications
    setupNotificationCloseButtons();
}

/**
 * Create a notification element
 */
function createNotificationElement(notification) {
    const li = document.createElement('li');
    li.className = `notification-item ${notification.read_at ? '' : 'unread'}`;
    li.dataset.id = notification.id;
    
    // Determine icon class based on type
    let iconClass = '';
    switch (notification.type) {
        case 'success':
            iconClass = 'fa-check-circle success';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle warning';
            break;
        case 'error':
            iconClass = 'fa-exclamation-circle error';
            break;
        case 'info':
        default:
            iconClass = 'fa-info-circle info';
            break;
    }
    
    // Calculate relative time
    const relativeTime = formatTimeAgo(new Date(notification.created_at));
    
    // Create content
    li.innerHTML = `
        <div class="notification-icon ${notification.type || 'info'}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <p class="notification-text">${notification.message}</p>
            <p class="notification-time">${relativeTime}</p>
        </div>
        <button class="notification-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add click event to mark as read when clicked
    li.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-close')) {
            markNotificationAsRead(notification.id);
            
            // If there's a link associated with this notification, navigate to it
            if (notification.link) {
                window.location.href = notification.link;
            }
        }
    });
    
    return li;
}

/**
 * Setup close buttons for notifications
 */
function setupNotificationCloseButtons() {
    const closeButtons = document.querySelectorAll('.notification-close');
    
    closeButtons.forEach(button => {
        // Remove any existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new listener
        newButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const notificationItem = newButton.closest('.notification-item');
            const notificationId = notificationItem.dataset.id;
            
            // Delete notification from database
            await deleteNotification(notificationId);
            
            // Remove from UI with animation
            notificationItem.classList.add('removing');
            setTimeout(() => {
                notificationItem.remove();
                
                // Update notification count
                updateNotificationCountFromUI();
                
                // Check if there are no more notifications
                const notificationList = document.querySelector('.notification-list');
                if (notificationList && notificationList.children.length === 0) {
                    notificationList.innerHTML = `
                        <li class="notification-empty">
                            <p>No notifications to display</p>
                        </li>
                    `;
                }
            }, 300);
        });
    });
}

/**
 * Mark notification as seen (when opened)
 */
async function markNotificationsAsSeen() {
    const supabase = initSupabase();
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ seen_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('seen_at', null);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error marking notifications as seen:', error);
    }
}

/**
 * Mark a notification as read
 */
async function markNotificationAsRead(notificationId) {
    const supabase = initSupabase();
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        // Update notification in database
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update UI
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
        }
        
        // Update notification count
        updateNotificationCountFromUI();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    const supabase = initSupabase();
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        // Update all notifications in database
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('read_at', null);
        
        if (error) throw error;
        
        // Update UI
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(item => {
            item.classList.remove('unread');
        });
        
        // Update notification count
        updateNotificationBadge(0);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

/**
 * Delete a notification
 */
async function deleteNotification(notificationId) {
    const supabase = initSupabase();
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', user.id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

/**
 * Update notification count in UI
 */
function updateNotificationCount(notifications) {
    if (!notifications) return;
    
    const unreadCount = notifications.filter(n => !n.read_at).length;
    updateNotificationBadge(unreadCount);
}

/**
 * Update notification count based on UI state
 */
function updateNotificationCountFromUI() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    updateNotificationBadge(unreadNotifications.length);
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Setup notification polling
 */
function setupNotificationPolling(supabase) {
    // Check for new notifications every minute
    setInterval(() => {
        loadNotifications(supabase);
    }, 60000);
}

/**
 * Create a new notification
 */
async function createNotification(message, type = 'info', link = null) {
    const supabase = initSupabase();
    const user = supabase.auth.user();
    if (!user) return;
    
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                message,
                type,
                link,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Reload notifications
        loadNotifications(supabase);
        
        return data;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    // Format as MM/DD/YYYY if more than a week ago
    return date.toLocaleDateString();
}

// Export notification functions for use in other scripts
window.createNotification = createNotification;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;