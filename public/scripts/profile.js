/**
 * Profile page functionality for Automatic Pet Feeder
 * Handles user profile operations, settings, and preferences
 */

// Initialize the profile page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initProfile();
});

// Initialize the profile page
async function initProfile() {
    try {
        // Initialize Supabase client
        await initSupabase();
        
        // Check if user is authenticated
        await checkAuth();
        
        // Initialize UI components
        initializeUI();
        
        // Add event listeners
        addProfileEventListeners();
        
        // Load user profile data
        await loadUserProfile();
        
        console.log('Profile page initialized successfully');
    } catch (error) {
        console.error('Error initializing profile page:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to initialize profile page. Please refresh and try again.', 'error');
        }
    }
}

// Initialize Supabase for profile page
async function initSupabase() {
    try {
        // Check if Supabase is already initialized globally
        if (window.supabase) {
            return window.supabase;
        }
        
        // If not, initialize it
        console.log('Initializing Supabase client from profile.js');
        
        // Check if configuration is available
        if (!window.appConfig) {
            throw new Error('Missing appConfig. Make sure config.js is loaded before profile.js');
        }
        
        // Check if Supabase library is loaded
        if (!window.supabaseJs) {
            throw new Error('Supabase library not loaded. Make sure to include the Supabase script');
        }
        
        // Create Supabase client
        const { createClient } = window.supabaseJs;
        window.supabase = createClient(
            window.appConfig.SUPABASE_URL,
            window.appConfig.SUPABASE_ANON_KEY
        );
        
        console.log('Supabase client initialized successfully from profile.js');
        return window.supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        throw error;
    }
}

// Check if the user is authenticated
async function checkAuth() {
    try {
        // Check if auth module is available
        if (window.auth && window.auth.getCurrentUser) {
            const user = window.auth.getCurrentUser();
            
            if (!user) {
                // Redirect to login page if not authenticated
                window.location.href = '/login.html?redirect=/profile.html';
                throw new Error('User not authenticated');
            }
            
            return user;
        }
        
        // If auth module is not available, check directly with Supabase
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error || !data.session) {
            // Redirect to login page if not authenticated
            window.location.href = '/login.html?redirect=/profile.html';
            throw new Error('User not authenticated');
        }
        
        return data.session.user;
    } catch (error) {
        console.error('Auth check error:', error);
        throw error;
    }
}

// Initialize UI components
function initializeUI() {
    // Initialize sidebar
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    
    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
    
    // Initialize mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.classList.add('menu-open');
        });
        
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                document.body.classList.remove('menu-open');
            });
        }
    }
    
    // Initialize profile tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length && tabPanes.length) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Hide all tab panes
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Show the corresponding tab pane
                const targetTab = button.getAttribute('data-tab');
                const targetPane = document.getElementById(targetTab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
    
    // Initialize password toggles
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordField = toggle.closest('.password-field');
            const passwordInput = passwordField.querySelector('input');
            const icon = toggle.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Initialize modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('open');
                document.body.classList.add('modal-open');
            }
        });
    });
    
    // Initialize modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('open');
                document.body.classList.remove('modal-open');
            }
        });
    });
}

// Add event listeners for profile forms and buttons
function addProfileEventListeners() {
    // Profile info form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password change form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Notification settings form
    const notificationForm = document.getElementById('notification-settings-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', handleNotificationSettings);
    }
    
    // Password input for strength check
    const passwordInput = document.getElementById('new-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        // Get current user from auth module or directly from Supabase
        let user;
        if (window.auth && window.auth.getCurrentUser) {
            user = window.auth.getCurrentUser();
        } else {
            const { data } = await window.supabase.auth.getSession();
            user = data.session ? data.session.user : null;
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Fetch additional user profile data from database
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error) {
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') {
                console.log('Profile not found in profile.js, creating new profile...');
                
                // Create a new profile
                const { data: newProfile, error: createError } = await window.supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        username: user.email ? user.email.split('@')[0] : `user_${Date.now()}`,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || '',
                        avatar_url: user.user_metadata?.avatar_url || '',
                        role: 'user',
                        is_verified: false
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Error creating user profile in profile.js:', createError);
                    throw createError;
                }
                
                // Use the newly created profile
                return { ...user, ...newProfile };
            } else {
                throw error;
            }
        }
        
        // Combine user and profile data
        const userData = { ...user, ...profile };
        
        // Update the UI with user data
        updateProfileUI(userData);
        
        return userData;
    } catch (error) {
        console.error('Error loading user profile:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load profile data. Please refresh and try again.', 'error');
        }
    }
}

// Update profile UI with user data
function updateProfileUI(userData) {
    // Update profile header
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileImage = document.getElementById('profile-avatar');
    
    if (profileName) {
        profileName.textContent = userData.first_name && userData.last_name ? 
            `${userData.first_name} ${userData.last_name}` : 
            (userData.first_name || userData.email.split('@')[0]);
    }
    
    if (profileEmail) {
        profileEmail.textContent = userData.email;
    }
    
    if (profileImage && userData.avatar_url) {
        profileImage.src = userData.avatar_url;
    }
    
    // Update profile form
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (firstNameInput) firstNameInput.value = userData.first_name || '';
    if (lastNameInput) lastNameInput.value = userData.last_name || '';
    if (emailInput) emailInput.value = userData.email || '';
    if (phoneInput) phoneInput.value = userData.phone || '';
    
    // Update notification preferences
    const emailNotifications = document.getElementById('email-notifications');
    const pushNotifications = document.getElementById('push-notifications');
    const mobileNotifications = document.getElementById('mobile-notifications');
    
    if (emailNotifications) emailNotifications.checked = userData.email_notifications !== false;
    if (pushNotifications) pushNotifications.checked = userData.push_notifications !== false;
    if (mobileNotifications) mobileNotifications.checked = userData.mobile_notifications !== false;
}

// Handle profile form submission
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const firstName = form.querySelector('#first-name').value;
    const lastName = form.querySelector('#last-name').value;
    const phone = form.querySelector('#phone').value;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
        // Get current user ID
        let userId;
        if (window.auth && window.auth.getCurrentUser) {
            userId = window.auth.getCurrentUser().id;
        } else {
            const { data } = await window.supabase.auth.getSession();
            userId = data.session ? data.session.user.id : null;
        }
        
        if (!userId) {
            throw new Error('User not found');
        }
        
        // Update profile in database
        const { error } = await window.supabase
            .from('profiles')
            .upsert({
                id: userId,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                updated_at: new Date().toISOString()
            });
            
        if (error) {
            throw error;
        }
        
        // Show success message
        if (window.app && window.app.showToast) {
            window.app.showToast('Profile updated successfully', 'success');
        }
        
        // Refresh user profile data
        await loadUserProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to update profile. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Save Changes';
        }
    }
}

// Handle password change form submission
async function handlePasswordChange(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const currentPassword = form.querySelector('#current-password').value;
    const newPassword = form.querySelector('#new-password').value;
    const confirmPassword = form.querySelector('#confirm-password').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        if (window.app && window.app.showToast) {
            window.app.showToast('New passwords do not match', 'error');
        }
        return;
    }
    
    // Check password strength
    if (!isPasswordStrong(newPassword)) {
        if (window.app && window.app.showToast) {
            window.app.showToast('Password is not strong enough', 'error');
        }
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    try {
        // Update password with Supabase
        const { error } = await window.supabase.auth.updateUser({
            password: newPassword
        });
            
        if (error) {
            throw error;
        }
        
        // Show success message
        if (window.app && window.app.showToast) {
            window.app.showToast('Password updated successfully', 'success');
        }
        
        // Reset form
        form.reset();
    } catch (error) {
        console.error('Error updating password:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast(error.message || 'Failed to update password. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Password';
        }
    }
}

// Handle notification settings form submission
async function handleNotificationSettings(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const emailNotifications = form.querySelector('#email-notifications').checked;
    const pushNotifications = form.querySelector('#push-notifications').checked;
    const mobileNotifications = form.querySelector('#mobile-notifications').checked;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
        // Get current user ID
        let userId;
        if (window.auth && window.auth.getCurrentUser) {
            userId = window.auth.getCurrentUser().id;
        } else {
            const { data } = await window.supabase.auth.getSession();
            userId = data.session ? data.session.user.id : null;
        }
        
        if (!userId) {
            throw new Error('User not found');
        }
        
        // Update notification settings in database
        const { error } = await window.supabase
            .from('profiles')
            .upsert({
                id: userId,
                email_notifications: emailNotifications,
                push_notifications: pushNotifications,
                mobile_notifications: mobileNotifications,
                updated_at: new Date().toISOString()
            });
            
        if (error) {
            throw error;
        }
        
        // Show success message
        if (window.app && window.app.showToast) {
            window.app.showToast('Notification settings updated successfully', 'success');
        }
    } catch (error) {
        console.error('Error updating notification settings:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to update notification settings. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Save Settings';
        }
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Use auth module if available
        if (window.auth && window.auth.logout) {
            await window.auth.logout();
            return;
        }
        
        // Otherwise use Supabase directly
        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        // Redirect to login page
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to log out. Please try again.', 'error');
        }
    }
}

// Check password strength
function checkPasswordStrength(event) {
    const password = event.target.value;
    const strengthBar = document.querySelector('.strength-level');
    const strengthText = document.querySelector('.strength-text');
    const strengthMeter = document.querySelector('.password-strength-meter');
    
    if (!strengthBar || !strengthText) {
        return;
    }
    
    // Show/hide the strength meter based on whether there's input
    if (strengthMeter) {
        if (password.length > 0) {
            strengthMeter.style.display = 'block';
        } else {
            strengthMeter.style.display = 'none';
            return; // Exit early if password is empty
        }
    }
    
    let strength = 0;
    let level = '';
    
    // Update password requirements if they exist
    updatePasswordRequirements(password);
    
    // Length
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Determine level
    if (strength <= 2) {
        level = 'weak';
    } else if (strength == 3) {
        level = 'fair';
    } else if (strength == 4) {
        level = 'good';
    } else {
        level = 'strong';
    }
    
    // Update UI
    strengthBar.className = 'strength-level ' + level;
    strengthBar.style.width = ((strength / 5) * 100) + '%';
    strengthText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    strengthText.className = 'strength-text ' + level;
    
    return level;
}

// Update password requirements visualization
function updatePasswordRequirements(password) {
    const requirements = document.querySelectorAll('.password-requirements li');
    
    if (!requirements.length) {
        return;
    }
    
    // Check each requirement
    requirements.forEach(req => {
        let isMet = false;
        
        if (req.classList.contains('req-length')) {
            isMet = password.length >= 8;
        } else if (req.classList.contains('req-lowercase')) {
            isMet = /[a-z]/.test(password);
        } else if (req.classList.contains('req-uppercase')) {
            isMet = /[A-Z]/.test(password);
        } else if (req.classList.contains('req-number')) {
            isMet = /[0-9]/.test(password);
        } else if (req.classList.contains('req-special')) {
            isMet = /[^A-Za-z0-9]/.test(password);
        }
        
        if (isMet) {
            req.classList.add('met');
        } else {
            req.classList.remove('met');
        }
    });
}

// Check if a password is strong enough
function isPasswordStrong(password) {
    // At least 8 characters, with at least 3 of the following:
    // - Lowercase letter
    // - Uppercase letter
    // - Number
    // - Special character
    
    let strength = 0;
    
    // Length check
    if (password.length < 8) return false;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength >= 3;
}

// Expose functions globally
window.profilePage = {
    init: initProfile,
    loadUserProfile,
    handleProfileUpdate,
    handlePasswordChange,
    handleNotificationSettings,
    handleLogout
};