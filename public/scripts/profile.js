/**
 * Profile page functionality for the Automatic Pet Feeder application
 * Handles profile settings, security, notifications, and connected accounts
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabase = initSupabase();
    
    // Check if user is authenticated
    checkAuth(supabase);
    
    // Initialize profile tabs and forms
    initProfileTabs();
    initProfileForms(supabase);
    
    // Initialize profile image functionality
    initProfileImage(supabase);
    
    // Initialize password management
    initPasswordManagement(supabase);
    
    // Initialize notification settings
    initNotificationSettings(supabase);
    
    // Initialize connected accounts
    initConnectedAccounts(supabase);
    
    // Initialize danger zone actions
    initDangerZone(supabase);
    
    // Initialize animations for elements
    initAnimatedElements();
});

/**
 * Initialize Supabase client with API key and URL
 * @returns {object} Supabase client instance
 */
function initSupabase() {
    const SUPABASE_URL = supabaseConfig.url;
    const SUPABASE_KEY = supabaseConfig.key;
    return supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Check if user is authenticated and redirect to login if not
 * @param {object} supabase - Supabase client instance
 */
async function checkAuth(supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info in the header
    updateUserInfo(user, supabase);
    
    // Load user profile data
    loadUserProfile(user, supabase);
}

/**
 * Update user information in the header
 * @param {object} user - User object from Supabase
 * @param {object} supabase - Supabase client instance
 */
async function updateUserInfo(user, supabase) {
    const userNameElement = document.querySelector('.user-name');
    const userAvatarElement = document.querySelector('.user-avatar img');
    const profileHeaderName = document.querySelector('.profile-info h2');
    const profileUsername = document.querySelector('.profile-username');
    const profileAvatar = document.querySelector('.profile-avatar img');
    const profileSince = document.querySelector('.profile-since');
    
    // Get user profile from profiles table
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching user profile:', error);
        return;
    }
    
    // Update header user info
    if (userNameElement) {
        userNameElement.textContent = profile.full_name || user.email.split('@')[0];
    }
    
    if (userAvatarElement && profile.avatar_url) {
        userAvatarElement.src = profile.avatar_url;
    }
    
    // Update profile header
    if (profileHeaderName) {
        profileHeaderName.textContent = profile.full_name || 'Update Your Name';
    }
    
    if (profileUsername) {
        profileUsername.textContent = `@${profile.username || user.email.split('@')[0]}`;
    }
    
    if (profileAvatar) {
        profileAvatar.src = profile.avatar_url || 'assets/images/default-avatar.png';
        // Also update any other instances of the avatar
        const allAvatars = document.querySelectorAll('.current-avatar img');
        allAvatars.forEach(avatar => {
            avatar.src = profile.avatar_url || 'assets/images/default-avatar.png';
        });
    }
    
    if (profileSince) {
        const createdAt = new Date(user.created_at || profile.created_at);
        profileSince.textContent = `Member since ${createdAt.toLocaleDateString()}`;
    }
    
    // Update device and pet count in stats
    updateProfileStats(supabase, user.id);
}

/**
 * Update profile statistics (device count, pet count, etc.)
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID
 */
async function updateProfileStats(supabase, userId) {
    const deviceCountElement = document.querySelector('[data-stat="devices"]');
    const petCountElement = document.querySelector('[data-stat="pets"]');
    const feedingCountElement = document.querySelector('[data-stat="feedings"]');
    
    // Get device count
    const { data: devices, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('user_id', userId);
    
    if (!deviceError && deviceCountElement) {
        deviceCountElement.textContent = devices.length;
    }
    
    // Get pet count
    const { data: pets, error: petError } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', userId);
    
    if (!petError && petCountElement) {
        petCountElement.textContent = pets.length;
    }
    
    // Get feeding count
    const { data: feedings, error: feedingError } = await supabase
        .from('feeding_history')
        .select('id')
        .eq('user_id', userId);
    
    if (!feedingError && feedingCountElement) {
        feedingCountElement.textContent = feedings.length;
    }
}

/**
 * Load user profile data from Supabase
 * @param {object} user - User object from Supabase
 * @param {object} supabase - Supabase client instance
 */
async function loadUserProfile(user, supabase) {
    // Get user profile from profiles table
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching user profile:', error);
        return;
    }
    
    // Fill profile form with data
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.elements['full_name'].value = profile.full_name || '';
        profileForm.elements['username'].value = profile.username || '';
        profileForm.elements['email'].value = user.email || '';
        profileForm.elements['phone'].value = profile.phone || '';
        profileForm.elements['address'].value = profile.address || '';
        profileForm.elements['city'].value = profile.city || '';
        profileForm.elements['state'].value = profile.state || '';
        profileForm.elements['zip'].value = profile.zip || '';
        profileForm.elements['country'].value = profile.country || '';
        profileForm.elements['bio'].value = profile.bio || '';
    }
    
    // Load notification settings if they exist
    loadNotificationSettings(supabase, user.id, profile);
}

/**
 * Initialize profile tabs for navigation
 */
function initProfileTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const paneId = button.getAttribute('data-tab');
            document.getElementById(paneId).classList.add('active');
        });
    });
    
    // Set first tab as active by default if none are active
    if (!document.querySelector('.tab-button.active')) {
        tabButtons[0].classList.add('active');
        const defaultPaneId = tabButtons[0].getAttribute('data-tab');
        document.getElementById(defaultPaneId).classList.add('active');
    }
}

/**
 * Initialize profile forms and their submission handlers
 * @param {object} supabase - Supabase client instance
 */
function initProfileForms(supabase) {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = profileForm.querySelector('button[type="submit"]');
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    throw new Error('User not authenticated');
                }
                
                // Gather form data
                const formData = {
                    full_name: profileForm.elements['full_name'].value,
                    username: profileForm.elements['username'].value,
                    phone: profileForm.elements['phone'].value,
                    address: profileForm.elements['address'].value,
                    city: profileForm.elements['city'].value,
                    state: profileForm.elements['state'].value,
                    zip: profileForm.elements['zip'].value,
                    country: profileForm.elements['country'].value,
                    bio: profileForm.elements['bio'].value,
                    updated_at: new Date()
                };
                
                // Update user profile in Supabase
                const { error } = await supabase
                    .from('profiles')
                    .update(formData)
                    .eq('id', user.id);
                
                if (error) {
                    throw error;
                }
                
                // Show success message
                showToast('Profile updated successfully!', 'success');
                
                // Update header and profile information
                updateUserInfo(user, supabase);
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast('Failed to update profile. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.innerHTML = 'Save Changes';
            }
        });
    }
}

/**
 * Initialize profile image upload and change functionality
 * @param {object} supabase - Supabase client instance
 */
function initProfileImage(supabase) {
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const closeModalBtns = document.querySelectorAll('.modal-close, .cancel-btn');
    const fileInput = document.getElementById('avatar-upload');
    const previewContainer = document.querySelector('.preview-container img');
    const saveAvatarBtn = document.querySelector('.save-avatar-btn');
    
    // Open avatar modal
    if (changeAvatarBtn && avatarModal) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarModal.classList.add('open');
        });
    }
    
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('open');
            });
        });
    });
    
    // Preview uploaded image
    if (fileInput && previewContainer) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                // Check file type
                if (!file.type.match('image.*')) {
                    showToast('Please upload an image file', 'error');
                    return;
                }
                
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showToast('Image size should be less than 2MB', 'error');
                    return;
                }
                
                reader.onload = (event) => {
                    previewContainer.src = event.target.result;
                    document.querySelector('.avatar-preview').style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Save avatar
    if (saveAvatarBtn && fileInput) {
        saveAvatarBtn.addEventListener('click', async () => {
            if (!fileInput.files.length) {
                showToast('Please select an image to upload', 'warning');
                return;
            }
            
            const file = fileInput.files[0];
            saveAvatarBtn.disabled = true;
            saveAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    throw new Error('User not authenticated');
                }
                
                // Upload file to Supabase storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('profile_images')
                    .upload(filePath, file);
                
                if (uploadError) {
                    throw uploadError;
                }
                
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('profile_images')
                    .getPublicUrl(filePath);
                
                // Update user profile with new avatar URL
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        avatar_url: urlData.publicUrl,
                        updated_at: new Date()
                    })
                    .eq('id', user.id);
                
                if (updateError) {
                    throw updateError;
                }
                
                // Show success message
                showToast('Profile picture updated successfully!', 'success');
                
                // Update avatar in UI
                updateUserInfo(user, supabase);
                
                // Close modal
                avatarModal.classList.remove('open');
                
            } catch (error) {
                console.error('Error uploading avatar:', error);
                showToast('Failed to update profile picture. Please try again.', 'error');
            } finally {
                saveAvatarBtn.disabled = false;
                saveAvatarBtn.innerHTML = 'Save Changes';
            }
        });
    }
}

/**
 * Initialize password management functionality
 * @param {object} supabase - Supabase client instance
 */
function initPasswordManagement(supabase) {
    const changePasswordBtn = document.querySelector('.change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const passwordToggleBtns = document.querySelectorAll('.password-toggle');
    
    // Open password modal
    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener('click', () => {
            passwordModal.classList.add('open');
        });
    }
    
    // Toggle password visibility
    passwordToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
    
    // Password strength meter
    if (newPassword) {
        newPassword.addEventListener('input', checkPasswordStrength);
    }
    
    // Submit password change form
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            
            // Validate passwords
            if (newPassword.value !== confirmPassword.value) {
                showToast('New passwords do not match', 'error');
                return;
            }
            
            // Check password strength
            if (!isPasswordStrong(newPassword.value)) {
                showToast('Password does not meet the requirements', 'error');
                return;
            }
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            try {
                // Change password
                const { error } = await supabase.auth.updateUser({
                    password: newPassword.value
                });
                
                if (error) {
                    throw error;
                }
                
                // Show success message
                showToast('Password updated successfully!', 'success');
                
                // Reset form and close modal
                passwordForm.reset();
                passwordModal.classList.remove('open');
                
            } catch (error) {
                console.error('Error updating password:', error);
                showToast('Failed to update password. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.innerHTML = 'Update Password';
            }
        });
    }
}

/**
 * Check password strength and update UI
 */
function checkPasswordStrength() {
    const password = document.getElementById('new-password').value;
    const strengthBar = document.querySelector('.strength-level');
    const strengthText = document.querySelector('.strength-text');
    
    // Update password requirements
    updatePasswordRequirements(password);
    
    // Calculate strength score
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Update strength bar and text
    strengthBar.className = 'strength-level';
    
    if (score >= 6) {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong password';
    } else if (score >= 4) {
        strengthBar.classList.add('good');
        strengthText.textContent = 'Good password';
    } else if (score >= 3) {
        strengthBar.classList.add('fair');
        strengthText.textContent = 'Fair password';
    } else {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak password';
    }
}

/**
 * Update password requirements UI based on current password
 * @param {string} password - Current password value
 */
function updatePasswordRequirements(password) {
    const requirements = [
        { id: 'req-length', test: password.length >= 8, text: 'At least 8 characters long' },
        { id: 'req-uppercase', test: /[A-Z]/.test(password), text: 'At least one uppercase letter' },
        { id: 'req-lowercase', test: /[a-z]/.test(password), text: 'At least one lowercase letter' },
        { id: 'req-number', test: /[0-9]/.test(password), text: 'At least one number' },
        { id: 'req-special', test: /[^A-Za-z0-9]/.test(password), text: 'At least one special character' }
    ];
    
    requirements.forEach(req => {
        const element = document.getElementById(req.id);
        if (element) {
            if (req.test) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        }
    });
}

/**
 * Check if password meets all requirements
 * @param {string} password - Password to check
 * @returns {boolean} Whether password is strong enough
 */
function isPasswordStrong(password) {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}

/**
 * Initialize notification settings functionality
 * @param {object} supabase - Supabase client instance
 */
function initNotificationSettings(supabase) {
    const notificationForm = document.getElementById('notification-form');
    
    if (notificationForm) {
        notificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = notificationForm.querySelector('button[type="submit"]');
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    throw new Error('User not authenticated');
                }
                
                // Gather notification settings
                const notificationSettings = {
                    email_feeding: document.getElementById('email-feeding').checked,
                    email_low_food: document.getElementById('email-low-food').checked,
                    email_device_status: document.getElementById('email-device-status').checked,
                    push_feeding: document.getElementById('push-feeding').checked,
                    push_low_food: document.getElementById('push-low-food').checked,
                    push_device_status: document.getElementById('push-device-status').checked,
                    sms_feeding: document.getElementById('sms-feeding').checked,
                    sms_low_food: document.getElementById('sms-low-food').checked,
                    sms_device_status: document.getElementById('sms-device-status').checked,
                    updated_at: new Date()
                };
                
                // Update notification settings in user profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        notification_settings: notificationSettings,
                        updated_at: new Date()
                    })
                    .eq('id', user.id);
                
                if (error) {
                    throw error;
                }
                
                // Show success message
                showToast('Notification settings updated successfully!', 'success');
                
            } catch (error) {
                console.error('Error updating notification settings:', error);
                showToast('Failed to update notification settings. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.innerHTML = 'Save Changes';
            }
        });
    }
}

/**
 * Load notification settings from profile
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID
 * @param {object} profile - User profile object
 */
function loadNotificationSettings(supabase, userId, profile) {
    if (!profile || !profile.notification_settings) return;
    
    const settings = profile.notification_settings;
    
    // Set toggle values for email notifications
    if (document.getElementById('email-feeding')) {
        document.getElementById('email-feeding').checked = settings.email_feeding || false;
    }
    
    if (document.getElementById('email-low-food')) {
        document.getElementById('email-low-food').checked = settings.email_low_food || false;
    }
    
    if (document.getElementById('email-device-status')) {
        document.getElementById('email-device-status').checked = settings.email_device_status || false;
    }
    
    // Set toggle values for push notifications
    if (document.getElementById('push-feeding')) {
        document.getElementById('push-feeding').checked = settings.push_feeding || false;
    }
    
    if (document.getElementById('push-low-food')) {
        document.getElementById('push-low-food').checked = settings.push_low_food || false;
    }
    
    if (document.getElementById('push-device-status')) {
        document.getElementById('push-device-status').checked = settings.push_device_status || false;
    }
    
    // Set toggle values for SMS notifications
    if (document.getElementById('sms-feeding')) {
        document.getElementById('sms-feeding').checked = settings.sms_feeding || false;
    }
    
    if (document.getElementById('sms-low-food')) {
        document.getElementById('sms-low-food').checked = settings.sms_low_food || false;
    }
    
    if (document.getElementById('sms-device-status')) {
        document.getElementById('sms-device-status').checked = settings.sms_device_status || false;
    }
}

/**
 * Initialize connected accounts functionality
 * @param {object} supabase - Supabase client instance
 */
function initConnectedAccounts(supabase) {
    const connectButtons = document.querySelectorAll('.connect-account-btn');
    const disconnectButtons = document.querySelectorAll('.disconnect-account-btn');
    
    // Connect account buttons
    connectButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const accountType = button.getAttribute('data-account');
            
            // Show connecting state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            
            try {
                // This is a mock implementation - in a real app, you would:
                // 1. Initiate OAuth flow with the external provider
                // 2. Complete authentication
                // 3. Store the connection in your database
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const accountElement = button.closest('.connected-account');
                const connectStatus = accountElement.querySelector('.connect-status');
                
                // Update button state
                button.classList.add('hidden');
                accountElement.querySelector('.disconnect-account-btn').classList.remove('hidden');
                
                // Update status
                connectStatus.innerHTML = '<span class="connected-status">Connected</span>';
                
                // Show success message
                showToast(`Successfully connected ${accountType} account!`, 'success');
                
            } catch (error) {
                console.error(`Error connecting ${accountType} account:`, error);
                showToast(`Failed to connect ${accountType} account. Please try again.`, 'error');
            } finally {
                // Restore button state
                button.disabled = false;
                button.innerHTML = 'Connect';
            }
        });
    });
    
    // Disconnect account buttons
    disconnectButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const accountType = button.getAttribute('data-account');
            
            // Show disconnecting state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disconnecting...';
            
            try {
                // This is a mock implementation - in a real app, you would:
                // 1. Revoke access token with the external provider
                // 2. Remove the connection from your database
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const accountElement = button.closest('.connected-account');
                const connectStatus = accountElement.querySelector('.connect-status');
                
                // Update button state
                button.classList.add('hidden');
                accountElement.querySelector('.connect-account-btn').classList.remove('hidden');
                
                // Update status
                connectStatus.innerHTML = '<span>Not connected</span>';
                
                // Show success message
                showToast(`Successfully disconnected ${accountType} account.`, 'success');
                
            } catch (error) {
                console.error(`Error disconnecting ${accountType} account:`, error);
                showToast(`Failed to disconnect ${accountType} account. Please try again.`, 'error');
            } finally {
                // Restore button state
                button.disabled = false;
                button.innerHTML = 'Disconnect';
            }
        });
    });
}

/**
 * Initialize danger zone actions (account deletion)
 * @param {object} supabase - Supabase client instance
 */
function initDangerZone(supabase) {
    const deleteAccountBtn = document.querySelector('.delete-account-btn');
    const deleteModal = document.getElementById('delete-account-modal');
    const confirmDeleteForm = document.getElementById('confirm-delete-form');
    const confirmDeleteInput = document.getElementById('confirm-delete-input');
    
    // Open delete account modal
    if (deleteAccountBtn && deleteModal) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteModal.classList.add('open');
        });
    }
    
    // Handle delete account confirmation
    if (confirmDeleteForm) {
        confirmDeleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = confirmDeleteForm.querySelector('button[type="submit"]');
            
            // Check confirmation text
            if (confirmDeleteInput.value !== 'DELETE') {
                showToast('Please type DELETE to confirm account deletion', 'error');
                return;
            }
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            
            try {
                // Delete user account
                const { error } = await supabase.auth.admin.deleteUser(
                    '11111111-1111-1111-1111-111111111111' // This is just a placeholder - you would use the actual user ID
                );
                
                if (error) {
                    throw error;
                }
                
                // Show success message
                showToast('Your account has been deleted.', 'success');
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error deleting account:', error);
                showToast('Failed to delete account. Please try again or contact support.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.innerHTML = 'Delete My Account Forever';
            }
        });
    }
}

/**
 * Initialize animated elements on the page
 */
function initAnimatedElements() {
    // Use the utility function from utils.js
    if (typeof window.initAnimatedElements === 'function') {
        window.initAnimatedElements();
    } else {
        // Fallback if utils.js is not loaded
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        const elements = document.querySelectorAll('.security-item, .notification-option, .connected-account');
        elements.forEach(element => observer.observe(element));
    }
}