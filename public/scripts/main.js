/**
 * Main JavaScript file for Automatic Pet Feeder
 * Initializes the application and handles global functionality
 */

/**
 * Initialize app components on DOM load
 */
document.addEventListener('DOMContentLoaded', function() {
  // Set up global error handler for better user experience
  window.addEventListener('error', function(e) {
    console.error('Global error:', e.error || e.message);
    showErrorNotification('An unexpected error occurred. Please try again.');
    // Ensure loading overlay is hidden when an error occurs
    hideAllLoadingIndicators();
  });

  // Initialize application
  initializeApp();
  
  // Ensure loading overlay is hidden after a timeout as a fallback
  setTimeout(hideAllLoadingIndicators, 5000);
});

/**
 * Initialize the main application
 */
async function initializeApp() {
  try {
    // Show loading indicator while app initializes
    if (window.utils && typeof window.utils.showLoading === 'function') {
      window.utils.showLoading(true, 'Initializing application...');
    } else if (window.showLoadingOverlay) {
      window.showLoadingOverlay();
    } else {
      showSimpleLoading(true, 'Initializing application...');
    }

    // Initialize Supabase client if not already done
    if (!window.supabase && window.supabaseJs) {
      try {
        // Make sure we're always using appConfig values
        if (!window.appConfig) {
          console.error('Missing appConfig. Make sure config.js is loaded before main.js');
          throw new Error('Configuration error. Please refresh the page.');
        }
        
        window.supabase = window.supabaseJs.createClient(
          window.appConfig.SUPABASE_URL,
          window.appConfig.SUPABASE_ANON_KEY
        );
        console.log('Supabase client initialized');
      } catch (initError) {
        console.error('Failed to initialize Supabase client:', initError);
        throw new Error('Database connection failed. Please try again later.');
      }
    }

    // Check authentication state
    const isProtectedPage = checkIfProtectedPage();
    if (isProtectedPage) {
      await checkAuthState();
    }

    // Initialize UI components
    initializeUIComponents();

    // Load user profile if authenticated and on protected page
    if (isProtectedPage) {
      await loadUserProfile();
    }

    // Setup logout button listeners
    setupLogoutButtonListeners();

    console.log('App initialization complete');
  } catch (error) {
    console.error('Error initializing application:', error);
    
    try {
      if (window.utils && typeof window.utils.showToast === 'function') {
        window.utils.showToast(
          error.message || 'Failed to initialize application. Please refresh the page.',
          'error',
          5000
        );
      } else if (window.iOSUI && typeof window.iOSUI.showToast === 'function') {
        window.iOSUI.showToast(
          error.message || 'Failed to initialize application. Please refresh the page.',
          'Error',
          'error',
          5000
        );
      } else {
        showErrorNotification(error.message || 'Failed to initialize application. Please refresh the page.');
      }
    } catch (toastError) {
      console.error('Error showing error toast:', toastError);
      alert('Failed to initialize application. Please refresh the page.');
    }
  } finally {
    // Hide loading indicator with a small delay to ensure content is visible
    setTimeout(() => {
      hideAllLoadingIndicators();
    }, 300);
  }
}

// Helper function to hide all possible loading indicators
function hideAllLoadingIndicators() {
  // Try all possible hide loading functions
  if (window.utils && typeof window.utils.showLoading === 'function') {
    window.utils.showLoading(false);
  }
  
  if (window.hideLoadingOverlay) {
    window.hideLoadingOverlay();
  }
  
  if (typeof showLoading === 'function') {
    showLoading(false);
  }
  
  if (window.app && window.app.hideLoading) {
    window.app.hideLoading();
  }
  
  // Direct DOM manipulation as a last resort
  const loaderDiv = document.getElementById('loading-overlay') || 
                    document.getElementById('app-loading') || 
                    document.getElementById('inline-loader');
  if (loaderDiv) {
    loaderDiv.style.opacity = '0';
    loaderDiv.style.pointerEvents = 'none';
    setTimeout(() => {
      loaderDiv.style.display = 'none';
    }, 500);
  }
  
  // Also try with class selectors
  const loaders = document.querySelectorAll('.loading-overlay, .app-loading, .loader');
  loaders.forEach(loader => {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  });
}

// Handle Cloudflare Turnstile errors
window.addEventListener('error', function(e) {
  // Check if the error is related to Cloudflare Turnstile
  if (e.message && (
      e.message.includes('turnstile') || 
      e.message.includes('cloudflare') || 
      e.message.includes('challenges.cloudflare.com'))) {
    console.error('Cloudflare Turnstile error:', e);
    
    // Show a friendly error message
    showErrorNotification('There was an issue with the security verification. Please refresh the page and try again.');
    
    // Ensure loading indicators are hidden
    hideAllLoadingIndicators();
  }
});

/**
 * Check if the current page is a protected page that requires authentication
 * @returns {boolean} True if the page requires authentication, false otherwise
 */
function checkIfProtectedPage() {
  // Get the current path
  const path = window.location.pathname.toLowerCase();
  
  // List of public pages that don't require authentication
  const publicPages = [
    '/index.html',
    '/',
    '/login.html',
    '/signup.html',
    '/reset-password.html',
    '/reset-confirm.html',
    '/privacy.html',
    '/terms.html',
    '/404.html'
  ];
  
  // Get just the filename from the path
  const filename = path.split('/').pop();
  
  // Check if the current path is in the list of public pages
  for (const publicPage of publicPages) {
    const publicFilename = publicPage.split('/').pop();
    if (filename === publicFilename || (publicFilename === '' && filename === '')) {
      return false;
    }
  }
  
  // If not in public pages list, it's a protected page
  return true;
}

/**
 * Check if user is authenticated and redirect if not
 */
async function checkAuthState() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { data, error } = await window.supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking auth state:', error);
      return false;
    }
    
    if (!data.session) {
      // User is not authenticated and on a protected page, redirect to login
      const currentPath = window.location.pathname;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentPath)}`;
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check authentication:', error);
    return false;
  }
}

/**
 * Load user profile data if authenticated
 */
async function loadUserProfile() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const { data: authData } = await window.supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      console.log('No authenticated user found');
      return;
    }
    
    const userId = authData.user.id;
    
    // Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      
      // If the profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        
        // Create a new profile
        const { data: newProfile, error: createError } = await window.supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              username: authData.user.email ? authData.user.email.split('@')[0] : `user_${Date.now()}`,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || '',
              avatar_url: authData.user.user_metadata?.avatar_url || '',
              role: 'user',
              is_verified: false
            }
          ])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          return;
        }
        
        // Use the newly created profile
        window.currentUser = {
          ...authData.user,
          profile: newProfile
        };
      } else {
        // For other errors, just return
        return;
      }
    } else {
      // Store profile data for use throughout the app
      window.currentUser = {
        ...authData.user,
        profile: profileData
      };
    }
    
    // Update UI elements that display user info
    updateUserInterface(window.currentUser);
    
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }
}

/**
 * Update UI elements with user data
 */
function updateUserInterface(user) {
  if (!user) return;
  
  // Update profile name displays
  const profileNameElements = document.querySelectorAll('#profile-name');
  profileNameElements.forEach(element => {
    element.textContent = user.profile?.full_name || user.profile?.username || user.email;
  });
  
  // Update profile images
  const profileImageElements = document.querySelectorAll('#profile-image');
  profileImageElements.forEach(element => {
    if (user.profile?.avatar_url) {
      element.src = user.profile.avatar_url;
      element.onerror = function() {
        this.src = 'assets/images/default-avatar.png';
      };
    }
  });
  
  // Update email displays
  const profileEmailElements = document.querySelectorAll('#profile-email');
  profileEmailElements.forEach(element => {
    element.textContent = user.email;
  });
}

/**
 * Initialize UI components
 */
function initializeUIComponents() {
  // Theme preference
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'true') {
    document.body.classList.add('dark-mode');
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
      themeToggle.className = 'fas fa-sun';
    }
  }
  
  // Set up common UI listeners (menu toggles, etc.)
  setupCommonUIListeners();
  
  // Initialize iOS-specific UI features if available
  initIOSFeatures();
  
  // Initialize page-specific code
  initPageSpecific();
}

/**
 * Set up event listeners for common UI elements
 */
function setupCommonUIListeners() {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            document.body.classList.add('menu-open');
        });
        
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        }
    }
}

/**
 * Initialize Supabase client
 */
async function initSupabase() {
    try {
        // Check if we have access to Supabase already
        if (window.supabase) {
            return window.supabase;
        }
        
        // Get Supabase configuration
        if (!window.appConfig) {
            throw new Error('Missing appConfig. Make sure config.js is loaded before main.js');
        }
        
        // Create Supabase client
        if (window.supabaseJs) {
            const { createClient } = window.supabaseJs;
            window.supabase = createClient(
                window.appConfig.SUPABASE_URL, 
                window.appConfig.SUPABASE_ANON_KEY
            );
            console.log('Supabase client initialized successfully');
            return window.supabase;
        } else {
            throw new Error('Supabase library not loaded. Make sure to include the Supabase script');
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        if (window.utils && window.utils.showToast) {
            window.utils.showToast('Failed to connect to the database. Please try again later.', 'error');
        } else {
            showToast('Failed to connect to the database. Please try again later.', 'error');
        }
        throw error;
    }
}

/**
 * Initialize page-specific functionality
 */
function initPageSpecific() {
    // Get the current page path
    const path = window.location.pathname;
    
    // Dashboard page
    if (path.includes('dashboard')) {
        if (window.initDashboard) window.initDashboard();
    }
    // Devices page
    else if (path.includes('devices')) {
        if (window.initDevices) window.initDevices();
    }
    // Pets page
    else if (path.includes('pets')) {
        if (window.initPets) window.initPets();
    }
    // Schedules page
    else if (path.includes('schedules')) {
        if (window.initSchedules) window.initSchedules();
    }
    // History page
    else if (path.includes('history')) {
        if (window.initHistory) window.initHistory();
    }
    // Analytics page
    else if (path.includes('analytics')) {
        if (window.initAnalytics) window.initAnalytics();
    }
    // Settings page
    else if (path.includes('settings')) {
        if (window.initSettings) window.initSettings();
    }
    // Profile page
    else if (path.includes('profile')) {
        if (window.initProfile) window.initProfile();
    }
}

/**
 * Initialize iOS-specific UI features
 */
function initIOSFeatures() {
    // Initialize iOS animations if the script is loaded
    if (window.iOSUI) {
        window.iOSUI.initScrollAnimations();
        window.iOSUI.initInteractionEffects();
        window.iOSUI.initHeaderEffects();
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Store theme preference in localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    
    // Update theme toggle icon if it exists
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isDarkMode) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
}

/**
 * Show or hide a loading indicator
 * Fallback implementation if utils.js is not loaded
 */
function showLoading(show, message = 'Loading...') {
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
            loadingEl.style.display = 'flex';
        }
    } else if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

/**
 * Show a toast notification
 * Fallback implementation if utils.js is not loaded
 */
function showToast(message, type = 'info', duration = 3000) {
    // Check if toast container exists
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
    
    // Add visible class after a short delay for animation
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);
    
    // Set up auto-dismiss
    const dismissTimeout = setTimeout(() => {
        dismissToast(toast);
    }, duration);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(dismissTimeout);
            dismissToast(toast);
        });
    }
}

/**
 * Dismiss a toast notification
 * Fallback implementation if utils.js is not loaded
 */
function dismissToast(toast) {
    toast.classList.add('toast-hiding');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Simple loading indicator function for when utils.js might not be loaded yet
 * @param {boolean} show - Whether to show or hide the loading indicator
 * @param {string} message - The message to display while loading
 */
function showSimpleLoading(show, message = 'Loading...') {
  try {
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    if (show) {
      if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const messageEl = document.createElement('div');
        messageEl.className = 'loading-message';
        messageEl.textContent = message;
        messageEl.style.marginTop = '15px';
        messageEl.style.color = 'var(--text-primary, #333)';
        
        loadingOverlay.appendChild(spinner);
        loadingOverlay.appendChild(messageEl);
        
        document.body.appendChild(loadingOverlay);
      } else {
        const messageEl = loadingOverlay.querySelector('.loading-message');
        if (messageEl) {
          messageEl.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
      }
    } else if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  } catch (e) {
    console.error('Error in showSimpleLoading:', e);
  }
}

/**
 * Simple error notification when utils.js might not be loaded yet
 * @param {string} message - The error message to display
 */
function showErrorNotification(message) {
  try {
    // First try to use toast system if available
    if (typeof showToast === 'function') {
      showToast(message, 'error');
      return;
    }
    
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.className = 'simple-error-notification';
    notification.textContent = message;
    
    // Apply styles
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'var(--danger-color, #ff3b30)',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: '9999',
      maxWidth: '300px'
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  } catch (e) {
    console.error('Error in showErrorNotification:', e);
    alert(message); // Fallback to alert if everything else fails
  }
}

/**
 * Setup logout button event listeners
 */
function setupLogoutButtonListeners() {
  // Get all logout buttons by their ID and class
  const logoutButtons = document.querySelectorAll('#logout-button, .logout-button');
  
  // Add click event to each logout button
  logoutButtons.forEach(button => {
    button.addEventListener('click', handleLogout);
  });
  
  // Also add a global click handler for any dynamically added logout buttons
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'logout-button' || e.target.classList.contains('logout-button') || 
        (e.target.parentElement && (e.target.parentElement.id === 'logout-button' || e.target.parentElement.classList.contains('logout-button'))))) {
      handleLogout(e);
    }
  });
  
  console.log('Logout buttons initialized');
}

/**
 * Handle logout action
 */
async function handleLogout(e) {
  e.preventDefault();
  
  try {
    // Show loading indicator
    if (window.utils && window.utils.showLoading) {
      window.utils.showLoading(true, 'Logging out...');
    } else {
      showLoading(true, 'Logging out...');
    }
    
    // Log out the user using Supabase
    if (window.supabase) {
      const { error } = await window.supabase.auth.signOut();
      
      if (error) {
        console.error('Error logging out:', error);
        throw new Error('Failed to log out. Please try again.');
      }
    }
    
    // Clear any user data from local storage
    localStorage.removeItem('currentUser');
    
    // Show success message
    if (window.utils && window.utils.showToast) {
      window.utils.showToast('Successfully logged out', 'success');
    } else {
      showToast('Successfully logged out', 'success');
    }
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    
  } catch (error) {
    console.error('Logout error:', error);
    
    if (window.utils && window.utils.showToast) {
      window.utils.showToast(error.message || 'Failed to log out', 'error');
    } else {
      showToast(error.message || 'Failed to log out', 'error');
    }
  } finally {
    // Hide loading indicator
    if (window.utils && window.utils.showLoading) {
      window.utils.showLoading(false);
    } else {
      showLoading(false);
    }
  }
}

// Make the functions available globally
window.app = window.app || {};
Object.assign(window.app, {
    toggleTheme,
    initializeApp,
    showToast,
    showLoading
});