/**
 * Device management script for Automatic Pet Feeder
 */

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    checkAuth();
    
    // Set up event listeners
    document.querySelectorAll('.add-device-form').forEach(form => {
        form.addEventListener('submit', handleAddDevice);
    });
    
    document.querySelector('.device-list').addEventListener('click', handleDeviceActions);
    
    // Initialize the form for adding schedule
    const scheduleForm = document.querySelector('.add-schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleAddSchedule);
        initScheduleForm();
    }
});

// Initialize Supabase client
function initSupabase() {
    if (window.supabase) {
        return window.supabase;
    }
    
    const SUPABASE_URL = window.appConfig ? window.appConfig.SUPABASE_URL : null;
    const SUPABASE_KEY = window.appConfig ? window.appConfig.SUPABASE_ANON_KEY : null;
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('Missing Supabase configuration in appConfig');
        return null;
    }
    
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return window.supabase;
}

// Check authentication status
async function checkAuth() {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    loadUserDevices();
}

// Load user's devices
async function loadUserDevices() {
    showLoading('.device-list');
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const { data: devices, error } = await window.supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);
    
    if (error) {
        console.error('Error loading devices:', error);
        showError('.device-list', 'Failed to load devices');
        return;
    }
    
    renderDeviceList(devices);
    hideLoading('.device-list');
    
    if (devices.length === 0) {
        document.querySelector('.no-devices').style.display = 'block';
    } else {
        document.querySelector('.no-devices').style.display = 'none';
    }
}

// Render the list of devices
function renderDeviceList(devices) {
    const deviceList = document.querySelector('.device-list');
    
    if (devices.length === 0) {
        deviceList.innerHTML = '<p class="text-center text-gray-500">No devices found. Add your first device!</p>';
        return;
    }
    
    let html = '';
    devices.forEach(device => {
        const statusClass = device.status === 'online' ? 'bg-success-color' : 'bg-error-color';
        const lastFeedTime = device.last_feeding_time ? new Date(device.last_feeding_time).toLocaleString() : 'Never';
        
        html += `
            <div class="device-card" data-id="${device.id}">
                <div class="device-header">
                    <div class="device-info">
                        <h3>${device.name}</h3>
                        <div class="device-status">
                            <span class="status-indicator ${statusClass}"></span>
                            <span>${device.status}</span>
                        </div>
                    </div>
                    <div class="device-actions">
                        <button class="btn btn-icon feed-now-btn" title="Feed now">
                            <i class="fas fa-utensils"></i>
                        </button>
                        <button class="btn btn-icon edit-device-btn" title="Edit device">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon delete-device-btn" title="Delete device">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="device-details">
                    <div class="device-stat">
                        <span class="label">Device ID:</span>
                        <span>${device.device_id}</span>
                    </div>
                    <div class="device-stat">
                        <span class="label">Model:</span>
                        <span>${device.model || 'Standard'}</span>
                    </div>
                    <div class="device-stat">
                        <span class="label">Food Level:</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${device.food_level || 0}%"></div>
                        </div>
                        <span>${device.food_level || 0}%</span>
                    </div>
                    <div class="device-stat">
                        <span class="label">Last Feeding:</span>
                        <span>${lastFeedTime}</span>
                    </div>
                </div>
                
                <div class="device-schedules">
                    <h4>Feeding Schedules</h4>
                    <div class="schedule-list" data-device-id="${device.id}">
                        <p class="loading">Loading schedules...</p>
                    </div>
                    <button class="btn btn-secondary add-schedule-btn" data-device-id="${device.id}">
                        <i class="fas fa-plus"></i> Add Schedule
                    </button>
                </div>
            </div>
        `;
    });
    
    deviceList.innerHTML = html;
    
    // Load schedules for each device
    devices.forEach(device => {
        loadDeviceSchedules(device.id);
    });
}

// Handle device actions (feed now, edit, delete)
function handleDeviceActions(e) {
    const deviceCard = e.target.closest('.device-card');
    if (!deviceCard) return;
    
    const deviceId = deviceCard.dataset.id;
    
    if (e.target.closest('.feed-now-btn')) {
        feedNow(deviceId);
    } else if (e.target.closest('.edit-device-btn')) {
        showEditDeviceModal(deviceId);
    } else if (e.target.closest('.delete-device-btn')) {
        confirmDeleteDevice(deviceId);
    } else if (e.target.closest('.add-schedule-btn')) {
        showAddScheduleModal(deviceId);
    }
}

// Handle adding a new device
async function handleAddDevice(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const deviceData = Object.fromEntries(formData.entries());
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Add user_id to the data
    deviceData.user_id = user.id;
    deviceData.status = 'offline';
    deviceData.food_level = 100;
    
    const { data, error } = await window.supabase
        .from('devices')
        .insert([deviceData])
        .select();
    
    // Reset form state
    submitBtn.innerHTML = 'Add Device';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error adding device: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh list
    document.getElementById('add-device-modal').classList.remove('active');
    showToast('Device added successfully!', 'success');
    form.reset();
    loadUserDevices();
}

// Feed the pet now
async function feedNow(deviceId) {
    showToast('Sending feed command...', 'info');
    
    // In a real app, this would send a command to the device
    // For now, we'll simulate by updating the database
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const now = new Date().toISOString();
    
    // Record the feeding event in feeding_history
    const { error: historyError } = await window.supabase
        .from('feeding_history')
        .insert([{
            device_id: deviceId,
            user_id: user.id,
            feeding_time: now,
            amount: 1, // Default amount
            method: 'manual'
        }]);
    
    if (historyError) {
        showToast('Error recording feeding: ' + historyError.message, 'error');
        return;
    }
    
    // Update the device last_feeding_time
    const { error: deviceError } = await window.supabase
        .from('devices')
        .update({ last_feeding_time: now })
        .eq('id', deviceId);
    
    if (deviceError) {
        showToast('Error updating device: ' + deviceError.message, 'error');
        return;
    }
    
    showToast('Pet has been fed!', 'success');
    
    // Reload the device list to show updated information
    loadUserDevices();
}

// Confirm before deleting a device
function confirmDeleteDevice(deviceId) {
    if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
        deleteDevice(deviceId);
    }
}

// Delete a device
async function deleteDevice(deviceId) {
    showToast('Deleting device...', 'info');
    
    // First delete related schedules
    const { error: scheduleError } = await window.supabase
        .from('feeding_schedules')
        .delete()
        .eq('device_id', deviceId);
    
    if (scheduleError) {
        showToast('Error deleting schedules: ' + scheduleError.message, 'error');
        return;
    }
    
    // Then delete the device
    const { error } = await window.supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);
    
    if (error) {
        showToast('Error deleting device: ' + error.message, 'error');
        return;
    }
    
    showToast('Device deleted successfully!', 'success');
    
    // Reload the device list
    loadUserDevices();
}

// Load schedules for a device
async function loadDeviceSchedules(deviceId) {
    const scheduleList = document.querySelector(`.schedule-list[data-device-id="${deviceId}"]`);
    
    const { data: schedules, error } = await window.supabase
        .from('feeding_schedules')
        .select('*')
        .eq('device_id', deviceId)
        .order('time');
    
    if (error) {
        scheduleList.innerHTML = '<p class="error">Failed to load schedules</p>';
        console.error('Error loading schedules:', error);
        return;
    }
    
    if (schedules.length === 0) {
        scheduleList.innerHTML = '<p class="text-gray-500">No schedules set up yet.</p>';
        return;
    }
    
    let html = '<div class="schedule-items">';
    schedules.forEach(schedule => {
        const days = [];
        if (schedule.monday) days.push('Mon');
        if (schedule.tuesday) days.push('Tue');
        if (schedule.wednesday) days.push('Wed');
        if (schedule.thursday) days.push('Thu');
        if (schedule.friday) days.push('Fri');
        if (schedule.saturday) days.push('Sat');
        if (schedule.sunday) days.push('Sun');
        
        const daysString = days.length === 7 ? 'Every day' : days.join(', ');
        
        html += `
            <div class="schedule-item" data-id="${schedule.id}">
                <div class="schedule-time">${schedule.time}</div>
                <div class="schedule-days">${daysString}</div>
                <div class="schedule-amount">${schedule.amount} portion${schedule.amount > 1 ? 's' : ''}</div>
                <div class="schedule-actions">
                    <button class="btn-icon edit-schedule-btn" title="Edit schedule">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-schedule-btn" title="Delete schedule">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    scheduleList.innerHTML = html;
    
    // Add event listeners for schedule actions
    scheduleList.addEventListener('click', (e) => {
        const scheduleItem = e.target.closest('.schedule-item');
        if (!scheduleItem) return;
        
        const scheduleId = scheduleItem.dataset.id;
        
        if (e.target.closest('.edit-schedule-btn')) {
            showEditScheduleModal(scheduleId);
        } else if (e.target.closest('.delete-schedule-btn')) {
            confirmDeleteSchedule(scheduleId, deviceId);
        }
    });
}

// Show modal for adding a new schedule
function showAddScheduleModal(deviceId) {
    const modal = document.getElementById('schedule-modal');
    const form = modal.querySelector('form');
    
    // Reset form
    form.reset();
    form.dataset.deviceId = deviceId;
    form.dataset.mode = 'add';
    
    // Set default values for checkboxes (all days selected)
    const dayCheckboxes = form.querySelectorAll('input[type="checkbox"]');
    dayCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // Update modal title
    modal.querySelector('.modal-title').textContent = 'Add Feeding Schedule';
    
    // Show modal
    modal.classList.add('active');
}

// Initialize the schedule form
function initScheduleForm() {
    const form = document.querySelector('.add-schedule-form');
    const allDaysCheckbox = form.querySelector('#all-days');
    const dayCheckboxes = form.querySelectorAll('.day-checkbox');
    
    // Toggle all days
    allDaysCheckbox.addEventListener('change', () => {
        const checked = allDaysCheckbox.checked;
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    });
    
    // Update "all days" when individual days change
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const allChecked = Array.from(dayCheckboxes).every(cb => cb.checked);
            allDaysCheckbox.checked = allChecked;
        });
    });
}

// Handle adding or editing a schedule
async function handleAddSchedule(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const deviceId = form.dataset.deviceId;
    const mode = form.dataset.mode;
    const scheduleId = form.dataset.scheduleId;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Get form data
    const time = form.querySelector('#schedule-time').value;
    const amount = form.querySelector('#schedule-amount').value;
    const monday = form.querySelector('#monday').checked;
    const tuesday = form.querySelector('#tuesday').checked;
    const wednesday = form.querySelector('#wednesday').checked;
    const thursday = form.querySelector('#thursday').checked;
    const friday = form.querySelector('#friday').checked;
    const saturday = form.querySelector('#saturday').checked;
    const sunday = form.querySelector('#sunday').checked;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Create schedule data
    const scheduleData = {
        device_id: deviceId,
        user_id: user.id,
        time,
        amount,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday
    };
    
    let error;
    
    if (mode === 'add') {
        // Insert new schedule
        const { error: insertError } = await window.supabase
            .from('feeding_schedules')
            .insert([scheduleData]);
            
        error = insertError;
    } else {
        // Update existing schedule
        const { error: updateError } = await window.supabase
            .from('feeding_schedules')
            .update(scheduleData)
            .eq('id', scheduleId);
            
        error = updateError;
    }
    
    // Reset form state
    submitBtn.innerHTML = 'Save Schedule';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error saving schedule: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh schedules
    document.getElementById('schedule-modal').classList.remove('active');
    showToast('Schedule saved successfully!', 'success');
    loadDeviceSchedules(deviceId);
}

// Confirm before deleting a schedule
function confirmDeleteSchedule(scheduleId, deviceId) {
    if (confirm('Are you sure you want to delete this feeding schedule?')) {
        deleteSchedule(scheduleId, deviceId);
    }
}

// Delete a schedule
async function deleteSchedule(scheduleId, deviceId) {
    showToast('Deleting schedule...', 'info');
    
    const { error } = await window.supabase
        .from('feeding_schedules')
        .delete()
        .eq('id', scheduleId);
    
    if (error) {
        showToast('Error deleting schedule: ' + error.message, 'error');
        return;
    }
    
    showToast('Schedule deleted successfully!', 'success');
    
    // Reload the schedules
    loadDeviceSchedules(deviceId);
}

// Show edit schedule modal
async function showEditScheduleModal(scheduleId) {
    const { data: schedule, error } = await window.supabase
        .from('feeding_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
    
    if (error) {
        showToast('Error loading schedule: ' + error.message, 'error');
        return;
    }
    
    const modal = document.getElementById('schedule-modal');
    const form = modal.querySelector('form');
    
    // Reset form
    form.reset();
    form.dataset.deviceId = schedule.device_id;
    form.dataset.mode = 'edit';
    form.dataset.scheduleId = scheduleId;
    
    // Set form values
    form.querySelector('#schedule-time').value = schedule.time;
    form.querySelector('#schedule-amount').value = schedule.amount;
    form.querySelector('#monday').checked = schedule.monday;
    form.querySelector('#tuesday').checked = schedule.tuesday;
    form.querySelector('#wednesday').checked = schedule.wednesday;
    form.querySelector('#thursday').checked = schedule.thursday;
    form.querySelector('#friday').checked = schedule.friday;
    form.querySelector('#saturday').checked = schedule.saturday;
    form.querySelector('#sunday').checked = schedule.sunday;
    
    // Check the "all days" checkbox if all individual days are checked
    const allChecked = schedule.monday && schedule.tuesday && schedule.wednesday && 
                      schedule.thursday && schedule.friday && schedule.saturday && schedule.sunday;
    form.querySelector('#all-days').checked = allChecked;
    
    // Update modal title
    modal.querySelector('.modal-title').textContent = 'Edit Feeding Schedule';
    
    // Show modal
    modal.classList.add('active');
}

// Show edit device modal
async function showEditDeviceModal(deviceId) {
    const { data: device, error } = await window.supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();
    
    if (error) {
        showToast('Error loading device: ' + error.message, 'error');
        return;
    }
    
    const modal = document.getElementById('edit-device-modal');
    const form = modal.querySelector('form');
    
    // Reset form
    form.reset();
    form.dataset.deviceId = deviceId;
    
    // Set form values
    form.querySelector('#edit-device-name').value = device.name;
    form.querySelector('#edit-device-id').value = device.device_id;
    form.querySelector('#edit-device-model').value = device.model || '';
    form.querySelector('#edit-device-location').value = device.location || '';
    
    // Update modal title
    modal.querySelector('.modal-title').textContent = 'Edit Device';
    
    // Add event listener for form submission
    form.onsubmit = handleEditDevice;
    
    // Show modal
    modal.classList.add('active');
}

// Handle editing a device
async function handleEditDevice(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const deviceId = form.dataset.deviceId;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Get form data
    const formData = new FormData(form);
    const deviceData = Object.fromEntries(formData.entries());
    
    const { error } = await window.supabase
        .from('devices')
        .update(deviceData)
        .eq('id', deviceId);
    
    // Reset form state
    submitBtn.innerHTML = 'Save Changes';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error updating device: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh list
    document.getElementById('edit-device-modal').classList.remove('active');
    showToast('Device updated successfully!', 'success');
    loadUserDevices();
}

// Helper functions
function showLoading(selector) {
    const container = document.querySelector(selector);
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
}

function hideLoading(selector) {
    const container = document.querySelector(selector);
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

function showError(selector, message) {
    const container = document.querySelector(selector);
    container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
    
    // Add event listener for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}