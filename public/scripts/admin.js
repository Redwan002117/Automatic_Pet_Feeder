/**
 * Admin Panel JavaScript
 * Handles all functionality related to the admin panel
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabase = initSupabase();
    
    // Check admin authentication
    checkAdminAuth(supabase);
    
    // Initialize dashboard statistics
    initDashboardStats(supabase);
    
    // Initialize user management
    initUserManagement(supabase);
    
    // Initialize device management
    initDeviceManagement(supabase);
    
    // Initialize system settings
    initSystemSettings(supabase);
    
    // Initialize logs viewer
    initLogsViewer(supabase);
});

/**
 * Initialize the Supabase client
 */
function initSupabase() {
    if (window.supabase) {
        return window.supabase;
    }
    
    if (!window.appConfig) {
        console.error('Missing appConfig. Make sure config.js is loaded before admin.js');
        return null;
    }
    
    const supabaseUrl = window.appConfig.SUPABASE_URL;
    const supabaseKey = window.appConfig.SUPABASE_ANON_KEY;
    return supabase.createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if user is authenticated and has admin privileges
 */
async function checkAdminAuth(supabase) {
    const user = supabase.auth.user();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Check if user has admin role
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        if (data.role !== 'admin') {
            // Redirect non-admin users to dashboard
            window.location.href = 'dashboard.html';
            return;
        }
        
        // User is authenticated and has admin role
        updateAdminInfo(supabase, user);
    } catch (error) {
        console.error('Error checking admin auth:', error);
        window.location.href = 'login.html';
    }
}

/**
 * Update admin information in the UI
 */
async function updateAdminInfo(supabase, user) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        // Update admin profile in the UI
        const profileName = document.getElementById('profile-name');
        const profileImage = document.getElementById('profile-image');
        
        if (profileName) {
            profileName.textContent = data.full_name || data.username || user.email;
        }
        
        if (profileImage && data.avatar_url) {
            profileImage.src = data.avatar_url;
        }
    } catch (error) {
        console.error('Error updating admin info:', error);
    }
}

/**
 * Initialize dashboard statistics
 */
async function initDashboardStats(supabase) {
    try {
        // Load statistics
        const statsCards = document.querySelectorAll('.stat-card');
        if (statsCards.length === 0) return;
        
        // Show loading state
        statsCards.forEach(card => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
        
        // Fetch user count
        const { data: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
        
        // Fetch device count
        const { data: devicesCount, error: devicesError } = await supabase
            .from('devices')
            .select('id', { count: 'exact', head: true });
        
        // Fetch active devices (status = 'online')
        const { data: activeDevices, error: activeError } = await supabase
            .from('devices')
            .select('id')
            .eq('status', 'online');
        
        // Fetch today's feedings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todayFeedings, error: feedingsError } = await supabase
            .from('feeding_history')
            .select('id')
            .gte('created_at', today.toISOString());
        
        // Update statistics in the UI
        updateStatCard('users-count', usersCount !== null ? usersCount.count : 0);
        updateStatCard('devices-count', devicesCount !== null ? devicesCount.count : 0);
        updateStatCard('active-devices', activeDevices ? activeDevices.length : 0);
        updateStatCard('feedings-today', todayFeedings ? todayFeedings.length : 0);
        
        // Initialize charts
        initAdminCharts(supabase);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Update a statistics card with a value
 */
function updateStatCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const valueEl = card.querySelector('.stat-value');
    if (valueEl) {
        valueEl.textContent = value.toLocaleString();
    }
}

/**
 * Initialize admin dashboard charts
 */
async function initAdminCharts(supabase) {
    // Load user growth chart data
    await loadUserGrowthChart(supabase);
    
    // Load device status chart data
    await loadDeviceStatusChart(supabase);
    
    // Load feeding activity chart data
    await loadFeedingActivityChart(supabase);
}

/**
 * Load user growth chart
 */
async function loadUserGrowthChart(supabase) {
    const userGrowthCanvas = document.getElementById('user-growth-chart');
    if (!userGrowthCanvas) return;
    
    try {
        // Get user signup data for the past 12 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        
        const { data, error } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        
        if (error) throw error;
        
        // Prepare data for last 12 months
        const months = [];
        const userData = Array(12).fill(0);
        
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.unshift(d.toLocaleString('default', { month: 'short' }));
        }
        
        // Count users per month
        data.forEach(user => {
            const createdAt = new Date(user.created_at);
            const monthIndex = endDate.getMonth() - createdAt.getMonth() + 
                (endDate.getFullYear() - createdAt.getFullYear()) * 12;
            
            if (monthIndex >= 0 && monthIndex < 12) {
                userData[11 - monthIndex]++;
            }
        });
        
        // Create the chart
        new Chart(userGrowthCanvas, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'New Users',
                    data: userData,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading user growth chart:', error);
    }
}

/**
 * Load device status chart
 */
async function loadDeviceStatusChart(supabase) {
    const deviceStatusCanvas = document.getElementById('device-status-chart');
    if (!deviceStatusCanvas) return;
    
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('status');
        
        if (error) throw error;
        
        // Count devices by status
        const statusCounts = {
            online: 0,
            offline: 0,
            maintenance: 0,
            error: 0
        };
        
        data.forEach(device => {
            if (statusCounts[device.status] !== undefined) {
                statusCounts[device.status]++;
            } else {
                // Default to offline if status is unknown
                statusCounts.offline++;
            }
        });
        
        // Create the chart
        new Chart(deviceStatusCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Online', 'Offline', 'Maintenance', 'Error'],
                datasets: [{
                    data: [
                        statusCounts.online,
                        statusCounts.offline,
                        statusCounts.maintenance,
                        statusCounts.error
                    ],
                    backgroundColor: [
                        '#10b981', // Green for online
                        '#6b7280', // Gray for offline
                        '#f59e0b', // Yellow for maintenance
                        '#ef4444'  // Red for error
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                cutout: '70%'
            }
        });
    } catch (error) {
        console.error('Error loading device status chart:', error);
    }
}

/**
 * Load feeding activity chart
 */
async function loadFeedingActivityChart(supabase) {
    const feedingActivityCanvas = document.getElementById('feeding-activity-chart');
    if (!feedingActivityCanvas) return;
    
    try {
        // Get feeding data for the past 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        
        const { data, error } = await supabase
            .from('feeding_history')
            .select('created_at, amount')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        
        if (error) throw error;
        
        // Prepare data for last 7 days
        const days = [];
        const feedingCounts = Array(7).fill(0);
        const feedingAmounts = Array(7).fill(0);
        
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.unshift(d.toLocaleString('default', { weekday: 'short' }));
        }
        
        // Calculate feedings per day
        data.forEach(feeding => {
            const feedDate = new Date(feeding.created_at);
            const dayIndex = Math.floor((endDate - feedDate) / (1000 * 60 * 60 * 24));
            
            if (dayIndex >= 0 && dayIndex < 7) {
                feedingCounts[6 - dayIndex]++;
                feedingAmounts[6 - dayIndex] += feeding.amount || 0;
            }
        });
        
        // Create the chart
        new Chart(feedingActivityCanvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Number of Feedings',
                        data: feedingCounts,
                        backgroundColor: '#4f46e5',
                        order: 1
                    },
                    {
                        label: 'Amount Fed (grams)',
                        data: feedingAmounts,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: '#10b981',
                        type: 'line',
                        tension: 0.4,
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading feeding activity chart:', error);
    }
}

/**
 * Initialize user management
 */
function initUserManagement(supabase) {
    // Load users table
    loadUsersTable(supabase);
    
    // Setup search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadUsersTable(supabase, searchInput.value);
        }, 300));
    }
    
    // Setup add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showUserModal(null, supabase);
        });
    }
}

/**
 * Load users table with data
 */
async function loadUsersTable(supabase, searchTerm = '') {
    const usersTable = document.getElementById('users-table');
    const usersTableBody = document.getElementById('users-table-body');
    
    if (!usersTable || !usersTableBody) return;
    
    try {
        // Show loading state
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-spinner fa-spin mr-2"></i> Loading users...
                </td>
            </tr>
        `;
        
        let query = supabase
            .from('profiles')
            .select('*, auth.users!inner(email, confirmed_at, last_sign_in_at)')
            .order('created_at', { ascending: false });
        
        // Apply search filter if provided
        if (searchTerm) {
            query = query.or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,auth.users.email.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }
        
        // Populate table with users
        usersTableBody.innerHTML = '';
        data.forEach(user => {
            const userRow = document.createElement('tr');
            
            // Format dates
            const createdAt = new Date(user.created_at).toLocaleDateString();
            const lastLoginAt = user.auth?.users?.last_sign_in_at
                ? new Date(user.auth.users.last_sign_in_at).toLocaleDateString()
                : 'Never';
            
            // Status class
            const statusClass = user.auth?.users?.confirmed_at
                ? 'text-green-600'
                : 'text-amber-500';
            
            const statusText = user.auth?.users?.confirmed_at
                ? 'Active'
                : 'Pending';
            
            userRow.innerHTML = `
                <td class="py-2 px-4">
                    <div class="flex items-center">
                        <img src="${user.avatar_url || 'assets/images/profile-placeholder.jpg'}" alt="User avatar" class="w-8 h-8 rounded-full mr-3">
                        <div>
                            <div class="font-medium">${user.full_name || 'Unnamed User'}</div>
                            <div class="text-sm text-gray-500">@${user.username || 'unknown'}</div>
                        </div>
                    </div>
                </td>
                <td class="py-2 px-4">${user.auth?.users?.email || 'No email'}</td>
                <td class="py-2 px-4"><span class="${statusClass}">${statusText}</span></td>
                <td class="py-2 px-4">${user.role || 'user'}</td>
                <td class="py-2 px-4">${createdAt}</td>
                <td class="py-2 px-4">${lastLoginAt}</td>
                <td class="py-2 px-4">
                    <button class="action-btn edit-user" data-id="${user.id}" title="Edit user">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-user" data-id="${user.id}" title="Delete user">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            usersTableBody.appendChild(userRow);
        });
        
        // Setup edit buttons
        const editButtons = usersTableBody.querySelectorAll('.edit-user');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-id');
                const userData = data.find(u => u.id === userId);
                showUserModal(userData, supabase);
            });
        });
        
        // Setup delete buttons
        const deleteButtons = usersTableBody.querySelectorAll('.delete-user');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const userId = button.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                    await deleteUser(userId, supabase);
                    // Reload table after deletion
                    loadUsersTable(supabase, searchTerm);
                }
            });
        });
    } catch (error) {
        console.error('Error loading users table:', error);
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-red-500">
                    Error loading users. Please try again.
                </td>
            </tr>
        `;
    }
}

/**
 * Show user modal for adding or editing a user
 */
function showUserModal(userData, supabase) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('user-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    const isEdit = !!userData;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit User' : 'Add New User'}</h3>
                <button class="modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="user-form">
                    <div class="form-group">
                        <label for="user-email">Email</label>
                        <input type="email" id="user-email" class="form-control" 
                               value="${isEdit && userData.auth?.users?.email || ''}" 
                               ${isEdit ? 'disabled' : 'required'}>
                    </div>
                    
                    <div class="form-group">
                        <label for="user-full-name">Full Name</label>
                        <input type="text" id="user-full-name" class="form-control" 
                               value="${isEdit && userData.full_name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-username">Username</label>
                        <input type="text" id="user-username" class="form-control" 
                               value="${isEdit && userData.username || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-role">Role</label>
                        <select id="user-role" class="form-control">
                            <option value="user" ${!isEdit || userData.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${isEdit && userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    
                    ${!isEdit ? `
                    <div class="form-group">
                        <label for="user-password">Password</label>
                        <input type="password" id="user-password" class="form-control" required>
                        <div class="form-hint">Leave blank to send a magic link instead</div>
                    </div>
                    ` : ''}
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Update User' : 'Create User'}
                        </button>
                        <button type="button" class="btn btn-outline modal-cancel">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Setup close button
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Setup cancel button
    const cancelButton = modal.querySelector('.modal-cancel');
    cancelButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Setup form submission
    const form = modal.querySelector('#user-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        if (isEdit) {
            await updateUser(userData.id, {
                full_name: form.querySelector('#user-full-name').value,
                username: form.querySelector('#user-username').value,
                role: form.querySelector('#user-role').value
            }, supabase);
        } else {
            await createNewUser({
                email: form.querySelector('#user-email').value,
                password: form.querySelector('#user-password').value,
                full_name: form.querySelector('#user-full-name').value,
                username: form.querySelector('#user-username').value,
                role: form.querySelector('#user-role').value
            }, supabase);
        }
        
        // Close modal and reload users table
        modal.classList.remove('active');
        loadUsersTable(supabase);
    });
}

/**
 * Create a new user
 */
async function createNewUser(userData, supabase) {
    try {
        // Create user in auth
        const { data, error } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password || undefined,
            email_confirm: true
        });
        
        if (error) throw error;
        
        // Create profile for the user
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                full_name: userData.full_name,
                username: userData.username,
                role: userData.role
            });
        
        if (profileError) throw profileError;
        
        showToast('User created successfully!', 'success');
    } catch (error) {
        console.error('Error creating user:', error);
        showToast(error.message || 'Failed to create user', 'error');
    }
}

/**
 * Update an existing user
 */
async function updateUser(userId, userData, supabase) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: userData.full_name,
                username: userData.username,
                role: userData.role,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        showToast('User updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating user:', error);
        showToast(error.message || 'Failed to update user', 'error');
    }
}

/**
 * Delete a user
 */
async function deleteUser(userId, supabase) {
    try {
        // Delete user from auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) throw authError;
        
        // Delete profile (should be handled by cascading delete)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (profileError) throw profileError;
        
        showToast('User deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast(error.message || 'Failed to delete user', 'error');
    }
}

/**
 * Initialize device management
 */
function initDeviceManagement(supabase) {
    // Similar implementation to user management for devices
    // ...
    
    // Load devices list
    loadDevicesTable(supabase);
}

/**
 * Initialize system settings
 */
function initSystemSettings(supabase) {
    // Load and initialize system settings
    // ...
}

/**
 * Initialize logs viewer
 */
function initLogsViewer(supabase) {
    // Load and display system logs
    // ...
}

/**
 * Show a toast notification
 * (Fallback implementation if utils.js isn't loaded)
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

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait) {
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