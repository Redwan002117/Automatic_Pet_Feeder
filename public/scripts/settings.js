/**
 * Settings Page JavaScript
 * Handles all functionality related to the settings page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabase = initSupabase();
    
    // Check authentication and redirect if not authenticated
    checkAuth(supabase);
    
    // Initialize settings tabs
    initSettingsTabs();
    
    // Initialize account form
    initAccountForm(supabase);
    
    // Initialize preferences form
    initPreferencesForm(supabase);
    
    // Initialize notifications form
    initNotificationsForm(supabase);
    
    // Initialize security settings
    initSecuritySettings(supabase);
    
    // Initialize device settings
    initDeviceSettings(supabase);
});

/**
 * Initialize the Supabase client
 */
function initSupabase() {
    if (window.supabase) {
        return window.supabase;
    }
    
    if (!window.appConfig) {
        console.error('Missing appConfig. Make sure config.js is loaded before settings.js');
        return null;
    }
    
    const supabaseUrl = window.appConfig.SUPABASE_URL;
    const supabaseKey = window.appConfig.SUPABASE_ANON_KEY;
    return supabase.createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if user is authenticated, redirect to login if not
 */
function checkAuth(supabase) {
    const user = supabase.auth.user();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user profile in header
    updateUserProfile(supabase, user);
}

/**
 * Update user profile information in the UI
 */
function updateUserProfile(supabase, user) {
    // Get profile data
    supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
            if (error) {
                console.error('Error fetching profile:', error);
                return;
            }
            
            if (data) {
                // Update profile elements in the UI
                document.getElementById('profile-name').textContent = data.full_name || user.email;
                
                if (data.avatar_url) {
                    document.getElementById('profile-image').src = data.avatar_url;
                }
                
                // Pre-fill account form
                document.getElementById('account-full-name').value = data.full_name || '';
                document.getElementById('account-username').value = data.username || '';
                document.getElementById('account-email').value = user.email;
                document.getElementById('account-timezone').value = data.timezone || 'UTC-05:00';
            }
        });
}

/**
 * Initialize the settings tabs functionality
 */
function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanel = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active panel
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${targetPanel}-panel`) {
                    panel.classList.add('active');
                }
            });
            
            // Update URL hash
            window.location.hash = targetPanel;
        });
    });
    
    // Check URL hash on load
    if (window.location.hash) {
        const targetTab = window.location.hash.substring(1);
        const tab = document.querySelector(`.settings-tab[data-tab="${targetTab}"]`);
        if (tab) {
            tab.click();
        }
    }
}

/**
 * Initialize the account form
 */
function initAccountForm(supabase) {
    const accountForm = document.getElementById('account-form');
    
    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = accountForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        // Get form data
        const fullName = document.getElementById('account-full-name').value;
        const username = document.getElementById('account-username').value;
        const timezone = document.getElementById('account-timezone').value;
        
        try {
            const user = supabase.auth.user();
            
            // Update profile in database
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    timezone: timezone,
                    updated_at: new Date()
                })
                .eq('id', user.id);
            
            if (error) throw error;
            
            // Update UI
            document.getElementById('profile-name').textContent = fullName || user.email;
            
            // Show success message
            showToast('Account settings updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating account:', error);
            showToast('Failed to update account settings', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * Initialize the preferences form
 */
function initPreferencesForm(supabase) {
    const preferencesForm = document.getElementById('preferences-form');
    
    // Load saved preferences
    loadPreferences(supabase);
    
    preferencesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = preferencesForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        // Get form data
        const theme = document.getElementById('preferences-theme').value;
        const language = document.getElementById('preferences-language').value;
        const dateFormat = document.getElementById('preferences-date-format').value;
        const timeFormat = document.getElementById('preferences-time-format').value;
        const autoRefresh = document.getElementById('preferences-auto-refresh').checked;
        const refreshInterval = document.getElementById('preferences-refresh-interval').value;
        
        try {
            const user = supabase.auth.user();
            
            // Save preferences to local storage
            const preferences = {
                theme,
                language,
                dateFormat,
                timeFormat,
                autoRefresh,
                refreshInterval
            };
            
            localStorage.setItem('pet_feeder_preferences', JSON.stringify(preferences));
            
            // Apply theme immediately
            applyTheme(theme);
            
            // Show success message
            showToast('Preferences saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving preferences:', error);
            showToast('Failed to save preferences', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * Load user preferences
 */
function loadPreferences(supabase) {
    try {
        // Load preferences from local storage
        const savedPrefs = localStorage.getItem('pet_feeder_preferences');
        
        if (savedPrefs) {
            const preferences = JSON.parse(savedPrefs);
            
            // Set form values
            document.getElementById('preferences-theme').value = preferences.theme || 'light';
            document.getElementById('preferences-language').value = preferences.language || 'en';
            document.getElementById('preferences-date-format').value = preferences.dateFormat || 'MM/DD/YYYY';
            document.getElementById('preferences-time-format').value = preferences.timeFormat || '12h';
            document.getElementById('preferences-auto-refresh').checked = preferences.autoRefresh !== false;
            document.getElementById('preferences-refresh-interval').value = preferences.refreshInterval || 60;
            
            // Apply theme
            applyTheme(preferences.theme);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

/**
 * Apply theme to the application
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

/**
 * Initialize the notifications form
 */
function initNotificationsForm(supabase) {
    const notificationsForm = document.getElementById('notifications-form');
    
    // Load saved notification settings
    loadNotificationSettings(supabase);
    
    // Toggle quiet hours inputs based on checkbox
    const quietHoursCheckbox = document.getElementById('notifications-quiet-hours-enabled');
    const quietHoursInputs = document.querySelectorAll('#notifications-quiet-hours-start, #notifications-quiet-hours-end');
    
    quietHoursCheckbox.addEventListener('change', () => {
        quietHoursInputs.forEach(input => {
            input.disabled = !quietHoursCheckbox.checked;
        });
    });
    
    // Initialize based on current state
    quietHoursInputs.forEach(input => {
        input.disabled = !quietHoursCheckbox.checked;
    });
    
    notificationsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = notificationsForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            const user = supabase.auth.user();
            
            // Collect all notification settings
            const notificationSettings = {
                email: {
                    feeding: document.getElementById('notifications-email-feeding').checked,
                    lowFood: document.getElementById('notifications-email-low-food').checked,
                    device: document.getElementById('notifications-email-device').checked,
                    battery: document.getElementById('notifications-email-battery').checked,
                    updates: document.getElementById('notifications-email-updates').checked
                },
                push: {
                    feeding: document.getElementById('notifications-push-feeding').checked,
                    lowFood: document.getElementById('notifications-push-low-food').checked,
                    device: document.getElementById('notifications-push-device').checked,
                    battery: document.getElementById('notifications-push-battery').checked
                },
                quietHours: {
                    enabled: document.getElementById('notifications-quiet-hours-enabled').checked,
                    start: document.getElementById('notifications-quiet-hours-start').value,
                    end: document.getElementById('notifications-quiet-hours-end').value
                }
            };
            
            // Save to database
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    notification_settings: notificationSettings,
                    updated_at: new Date()
                })
                .eq('id', user.id);
            
            if (error) throw error;
            
            // Show success message
            showToast('Notification settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            showToast('Failed to save notification settings', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/**
 * Load notification settings
 */
function loadNotificationSettings(supabase) {
    const user = supabase.auth.user();
    
    if (!user) return;
    
    supabase
        .from('profiles')
        .select('notification_settings')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
            if (error) {
                console.error('Error loading notification settings:', error);
                return;
            }
            
            if (data && data.notification_settings) {
                const settings = data.notification_settings;
                
                // Set email notification checkboxes
                if (settings.email) {
                    document.getElementById('notifications-email-feeding').checked = settings.email.feeding !== false;
                    document.getElementById('notifications-email-low-food').checked = settings.email.lowFood !== false;
                    document.getElementById('notifications-email-device').checked = settings.email.device !== false;
                    document.getElementById('notifications-email-battery').checked = settings.email.battery !== false;
                    document.getElementById('notifications-email-updates').checked = settings.email.updates !== false;
                }
                
                // Set push notification checkboxes
                if (settings.push) {
                    document.getElementById('notifications-push-feeding').checked = settings.push.feeding !== false;
                    document.getElementById('notifications-push-low-food').checked = settings.push.lowFood !== false;
                    document.getElementById('notifications-push-device').checked = settings.push.device !== false;
                    document.getElementById('notifications-push-battery').checked = settings.push.battery !== false;
                }
                
                // Set quiet hours settings
                if (settings.quietHours) {
                    document.getElementById('notifications-quiet-hours-enabled').checked = settings.quietHours.enabled === true;
                    document.getElementById('notifications-quiet-hours-start').value = settings.quietHours.start || '22:00';
                    document.getElementById('notifications-quiet-hours-end').value = settings.quietHours.end || '07:00';
                    
                    // Update disabled state
                    const quietHoursInputs = document.querySelectorAll('#notifications-quiet-hours-start, #notifications-quiet-hours-end');
                    quietHoursInputs.forEach(input => {
                        input.disabled = !settings.quietHours.enabled;
                    });
                }
            }
        });
}

/**
 * Initialize security settings
 */
function initSecuritySettings(supabase) {
    // Password change form
    const passwordForm = document.getElementById('password-form');
    
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        // Clear previous messages
        document.getElementById('password-error').textContent = '';
        document.getElementById('password-success').textContent = '';
        
        // Get form data
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        try {
            // Validate passwords
            if (!currentPassword || !newPassword || !confirmPassword) {
                throw new Error('All password fields are required');
            }
            
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }
            
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            
            // Update password in Supabase
            const { error } = await supabase.auth.update({ 
                password: newPassword 
            });
            
            if (error) throw error;
            
            // Show success message
            document.getElementById('password-success').textContent = 'Password changed successfully';
            
            // Clear form
            passwordForm.reset();
        } catch (error) {
            console.error('Error changing password:', error);
            document.getElementById('password-error').textContent = error.message || 'Failed to update password';
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Two-factor authentication
    const enable2faCheckbox = document.getElementById('enable-2fa');
    const setup2faButton = document.getElementById('setup-2fa');
    
    enable2faCheckbox.addEventListener('change', () => {
        setup2faButton.disabled = !enable2faCheckbox.checked;
    });
    
    setup2faButton.addEventListener('click', () => {
        // This would normally open a modal with QR code and setup instructions
        showToast('Two-factor authentication setup would open here', 'info');
    });
    
    // Session management
    const revokeButtons = document.querySelectorAll('.session-revoke');
    revokeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sessionItem = button.closest('.session-item');
            
            // Show confirmation for revocation
            if (confirm('Are you sure you want to revoke this session?')) {
                sessionItem.classList.add('fadeOut');
                
                // Remove after animation completes
                setTimeout(() => {
                    sessionItem.remove();
                }, 300);
                
                showToast('Session revoked successfully', 'success');
            }
        });
    });
    
    // Revoke all sessions
    const revokeAllButton = document.getElementById('revoke-all-sessions');
    revokeAllButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to revoke all other sessions? This will log you out of all other devices.')) {
            try {
                // Show loading state
                const originalText = revokeAllButton.textContent;
                revokeAllButton.disabled = true;
                revokeAllButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Revoking...';
                
                // In a real implementation, this would call a Supabase function to revoke sessions
                
                // Simulate success
                setTimeout(() => {
                    const sessionItems = document.querySelectorAll('.session-item:not(.current)');
                    sessionItems.forEach(item => {
                        item.classList.add('fadeOut');
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            item.remove();
                        }, 300);
                    });
                    
                    showToast('All other sessions have been revoked', 'success');
                    
                    // Reset button state
                    revokeAllButton.disabled = false;
                    revokeAllButton.textContent = originalText;
                }, 1000);
            } catch (error) {
                console.error('Error revoking sessions:', error);
                showToast('Failed to revoke sessions', 'error');
                
                // Reset button state
                revokeAllButton.disabled = false;
                revokeAllButton.textContent = originalText;
            }
        }
    });
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.parentElement.querySelector('input');
            const icon = toggle.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/**
 * Initialize device settings
 */
function initDeviceSettings(supabase) {
    // Load connected devices
    loadConnectedDevices(supabase);
    
    // Add device button
    const addDeviceButton = document.querySelector('#devices-panel .btn-primary');
    addDeviceButton.addEventListener('click', () => {
        // This would normally open a modal for adding a new device
        showToast('Add device functionality would open here', 'info');
    });
}

/**
 * Load connected devices
 */
function loadConnectedDevices(supabase) {
    const user = supabase.auth.user();
    
    if (!user) return;
    
    supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
            if (error) {
                console.error('Error loading devices:', error);
                return;
            }
            
            const devicesList = document.querySelector('.devices-list');
            
            // Clear existing devices
            devicesList.innerHTML = '';
            
            if (data && data.length > 0) {
                // Add each device to the list
                data.forEach(device => {
                    const deviceEl = createDeviceElement(device);
                    devicesList.appendChild(deviceEl);
                });
            } else {
                // Show no devices message
                devicesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-tablet-alt empty-icon"></i>
                        <h3>No devices connected</h3>
                        <p>Add your first automatic pet feeder to get started.</p>
                    </div>
                `;
            }
        });
}

/**
 * Create a device element
 */
function createDeviceElement(device) {
    const deviceEl = document.createElement('div');
    deviceEl.className = 'device-item';
    deviceEl.dataset.id = device.id;
    
    const statusClass = device.status === 'online' ? 'online' : 'offline';
    const actionsDisabled = device.status === 'offline' ? 'disabled' : '';
    
    deviceEl.innerHTML = `
        <div class="device-info">
            <div class="device-icon">
                <i class="fas fa-tablet-alt"></i>
            </div>
            <div class="device-details">
                <h3>${device.name}</h3>
                <p class="device-status ${statusClass}">${device.status}</p>
                <p class="device-serial">Serial: ${device.serial_number}</p>
                <p class="device-firmware">Firmware: v${device.firmware_version}</p>
            </div>
        </div>
        <div class="device-actions">
            <button class="btn btn-outline btn-small" ${actionsDisabled}>Update Firmware</button>
            <button class="btn btn-outline btn-small" ${actionsDisabled}>Configure</button>
        </div>
    `;
    
    // Add event listeners for buttons
    const updateButton = deviceEl.querySelector('.device-actions button:first-child');
    const configButton = deviceEl.querySelector('.device-actions button:last-child');
    
    if (!device.status === 'offline') {
        updateButton.addEventListener('click', () => {
            showToast(`Updating firmware for ${device.name}`, 'info');
        });
        
        configButton.addEventListener('click', () => {
            showToast(`Opening configuration for ${device.name}`, 'info');
        });
    }
    
    return deviceEl;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    // Check if utils.js is loaded and contains showToast
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getIconForType(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    document.querySelector('.toast-container').appendChild(toast);
    
    // Add event listener for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Get icon class based on toast type
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