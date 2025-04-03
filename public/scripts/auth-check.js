// Authentication Check Script
// This script should be included in all protected pages

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is authenticated
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        // User is authenticated, load user data
        await loadUserData();
        
        // Check if user is admin and show admin panel if needed
        await checkAdminStatus();
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Redirect to login in case of error
        window.location.href = 'login.html';
    }
});

async function loadUserData() {
    try {
        // Get current user
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not found');
        
        // Update UI with user info
        const userNameElement = document.getElementById('user-name');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (userNameElement) {
            // Try to use username from metadata, or fallback to email
            const username = user.user_metadata?.username || user.email.split('@')[0];
            userNameElement.textContent = username;
        }
        
        if (userAvatarElement) {
            // Use user avatar if available, otherwise keep default
            if (user.user_metadata?.avatar_url) {
                userAvatarElement.src = user.user_metadata.avatar_url;
            }
        }
        
        // Setup logout functionality
        setupLogoutButtons();
        
    } catch (error) {
        console.error('Failed to load user data:', error);
        showNotification('error', 'Error', 'Failed to load user data');
    }
}

async function checkAdminStatus() {
    try {
        const adminStatus = await isAdmin();
        const adminPanelLink = document.getElementById('admin-panel-link');
        
        if (adminPanelLink) {
            if (adminStatus) {
                adminPanelLink.style.display = 'block';
            } else {
                adminPanelLink.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Failed to check admin status:', error);
    }
}

function setupLogoutButtons() {
    // Main sidebar logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Profile dropdown logout button
    const menuLogoutButton = document.getElementById('menu-logout-button');
    if (menuLogoutButton) {
        menuLogoutButton.addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    try {
        showNotification('info', 'Logging out...', 'Please wait while we sign you out');
        
        const { error } = await signOut();
        
        if (error) throw error;
        
        // Redirect to login page after successful logout
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout failed:', error);
        showNotification('error', 'Logout Failed', 'An error occurred during logout');
    }
}

// Show notification
function showNotification(type, title, message) {
    const notificationEl = document.getElementById('notification');
    if (!notificationEl) return; // No notification element found
    
    const notificationIcon = notificationEl.querySelector('.notification-icon');
    const notificationText = notificationEl.querySelector('.notification-text');
    
    // Set icon based on type
    let iconSrc = '';
    switch (type) {
        case 'success':
            iconSrc = '../assets/icons/check-circle.svg';
            break;
        case 'error':
            iconSrc = '../assets/icons/alert-circle.svg';
            break;
        case 'warning':
            iconSrc = '../assets/icons/alert-triangle.svg';
            break;
        case 'info':
            iconSrc = '../assets/icons/info.svg';
            break;
    }
    
    notificationIcon.src = iconSrc;
    notificationIcon.alt = type;
    
    // Set content
    notificationText.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    // Add appropriate class
    notificationEl.className = 'notification-toast ' + type;
    
    // Show notification
    notificationEl.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
    
    // Close button
    const closeBtn = notificationEl.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notificationEl.classList.remove('show');
        });
    }
} 