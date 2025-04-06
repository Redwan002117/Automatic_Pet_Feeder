/**
 * Schedules Management
 * Handles the feeding schedules functionality for the pet feeder application
 */

// Initialize Supabase client
let supabase;

// DOM elements
let schedulesList;
let schedulesGrid;
let viewToggleBtns;
let createScheduleBtn;
let deleteModal;
let scheduleModal;
let scheduleForm;
let customDaysDiv;
let scheduleFrequencySelect;
let scheduleAmountInput;
let scheduleAmountRange;
let deleteConfirmBtn;
let petFilter;
let deviceFilter;
let statusFilter;
let refreshUpcomingBtn;

// Current schedule being edited/deleted
let currentScheduleId = null;

// Initialize the page when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {
    initSupabase();
    await checkAuth();
    initElements();
    initEventListeners();
    loadSchedules();
    loadUpcomingFeedings();
    updateUserInfo();
    initAnimatedElements();
});

// Initialize Supabase client
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
    
    if (window.supabase) {
        return window.supabase;
    }
    
    supabase = window.supabaseJs.createClient(supabaseUrl, supabaseKey);
    window.supabase = supabase;
    return supabase;
}

// Check if user is authenticated
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        window.location.href = 'login.html';
    }
    
    return user;
}

// Initialize DOM elements
function initElements() {
    schedulesList = document.getElementById('schedules-list');
    schedulesGrid = document.getElementById('schedules-grid');
    viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    createScheduleBtn = document.getElementById('create-schedule-btn');
    deleteModal = document.getElementById('delete-modal');
    scheduleModal = document.getElementById('schedule-modal');
    scheduleForm = document.getElementById('schedule-form');
    customDaysDiv = document.querySelector('.custom-days');
    scheduleFrequencySelect = document.getElementById('schedule-frequency');
    scheduleAmountInput = document.getElementById('schedule-amount');
    scheduleAmountRange = document.getElementById('schedule-amount-range');
    deleteConfirmBtn = document.getElementById('confirm-delete');
    petFilter = document.getElementById('pet-filter');
    deviceFilter = document.getElementById('device-filter');
    statusFilter = document.getElementById('status-filter');
    refreshUpcomingBtn = document.getElementById('refresh-upcoming');
}

// Initialize event listeners
function initEventListeners() {
    // View toggle buttons
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            toggleView(view);
        });
    });

    // Create schedule button
    createScheduleBtn.addEventListener('click', () => openScheduleModal());

    // Schedule frequency select
    scheduleFrequencySelect.addEventListener('change', handleFrequencyChange);

    // Amount range slider
    scheduleAmountRange.addEventListener('input', () => {
        scheduleAmountInput.value = scheduleAmountRange.value;
    });

    // Amount input
    scheduleAmountInput.addEventListener('input', () => {
        scheduleAmountRange.value = scheduleAmountInput.value;
    });

    // Schedule form submission
    scheduleForm.addEventListener('submit', handleScheduleFormSubmit);

    // Delete confirmation
    deleteConfirmBtn.addEventListener('click', handleDeleteSchedule);

    // Filters
    petFilter.addEventListener('change', filterSchedules);
    deviceFilter.addEventListener('change', filterSchedules);
    statusFilter.addEventListener('change', filterSchedules);
    
    // Refresh upcoming
    refreshUpcomingBtn.addEventListener('click', loadUpcomingFeedings);

    // Edit, pause/resume, delete buttons (using event delegation)
    schedulesList.addEventListener('click', handleScheduleActions);
    
    // Feed now buttons in upcoming feedings (using event delegation)
    document.getElementById('upcoming-container').addEventListener('click', handleUpcomingActions);
}

// Toggle between list and grid views
function toggleView(view) {
    viewToggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'list') {
        schedulesList.classList.add('active');
        schedulesGrid.classList.remove('active');
    } else {
        schedulesList.classList.remove('active');
        schedulesGrid.classList.add('active');
        
        // If grid is empty, populate it
        if (schedulesGrid.children.length === 0) {
            populateGridView();
        }
    }
}

// Handle schedule actions (edit, pause/resume, delete)
function handleScheduleActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const scheduleItem = target.closest('.schedule-item');
    if (!scheduleItem) return;
    
    const scheduleId = scheduleItem.dataset.scheduleId;
    
    if (target.classList.contains('fa-edit') || target.closest('button').classList.contains('fa-edit')) {
        openScheduleModal(scheduleId);
    } else if (target.classList.contains('pause-schedule') || target.closest('button').classList.contains('pause-schedule')) {
        toggleScheduleStatus(scheduleId, 'paused');
    } else if (target.classList.contains('resume-schedule') || target.closest('button').classList.contains('resume-schedule')) {
        toggleScheduleStatus(scheduleId, 'active');
    } else if (target.classList.contains('delete-schedule') || target.closest('button').classList.contains('delete-schedule')) {
        openDeleteModal(scheduleId);
    }
}

// Handle upcoming feeding actions
function handleUpcomingActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const upcomingItem = target.closest('.upcoming-item');
    if (!upcomingItem) return;
    
    const feedingId = upcomingItem.dataset.feedingId;
    
    if (target.classList.contains('feed-now-btn')) {
        triggerFeedNow(feedingId);
    }
}

// Open schedule modal for create/edit
function openScheduleModal(scheduleId = null) {
    const modalTitle = document.getElementById('schedule-modal-title');
    currentScheduleId = scheduleId;
    
    if (scheduleId) {
        modalTitle.textContent = 'Edit Schedule';
        loadScheduleData(scheduleId);
    } else {
        modalTitle.textContent = 'Create New Schedule';
        scheduleForm.reset();
        document.getElementById('schedule-id').value = '';
        
        // Set default values
        scheduleAmountInput.value = 30;
        scheduleAmountRange.value = 30;
    }
    
    toggleModal(scheduleModal, true);
}

// Open delete confirmation modal
function openDeleteModal(scheduleId) {
    currentScheduleId = scheduleId;
    toggleModal(deleteModal, true);
}

// Toggle modal visibility
function toggleModal(modal, show) {
    if (show) {
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        
        // Add event listeners for closing
        const closeButtons = modal.querySelectorAll('.modal-close, [data-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => toggleModal(modal, false));
        });
        
        // Close on click outside
        modal.addEventListener('click', e => {
            if (e.target === modal) toggleModal(modal, false);
        });
    } else {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
}

// Handle frequency change in schedule form
function handleFrequencyChange() {
    const value = scheduleFrequencySelect.value;
    
    if (value === 'custom') {
        customDaysDiv.style.display = 'block';
    } else {
        customDaysDiv.style.display = 'none';
        
        // Set default day selection based on frequency
        const dayCheckboxes = document.querySelectorAll('.day-checkbox input');
        dayCheckboxes.forEach(cb => cb.checked = false);
        
        if (value === 'weekdays') {
            document.getElementById('day-mon').checked = true;
            document.getElementById('day-tue').checked = true;
            document.getElementById('day-wed').checked = true;
            document.getElementById('day-thu').checked = true;
            document.getElementById('day-fri').checked = true;
        } else if (value === 'weekends') {
            document.getElementById('day-sat').checked = true;
            document.getElementById('day-sun').checked = true;
        } else if (value === 'daily') {
            dayCheckboxes.forEach(cb => cb.checked = true);
        }
    }
}

// Handle schedule form submission
async function handleScheduleFormSubmit(e) {
    e.preventDefault();
    
    const scheduleName = document.getElementById('schedule-name').value;
    const petId = document.getElementById('schedule-pet').value;
    const deviceId = document.getElementById('schedule-device').value;
    const frequency = document.getElementById('schedule-frequency').value;
    const time = document.getElementById('schedule-time').value;
    const amount = document.getElementById('schedule-amount').value;
    const notes = document.getElementById('schedule-notes').value;
    
    // Get selected days for custom frequency
    let days = [];
    if (frequency === 'custom' || frequency === 'weekdays' || frequency === 'weekends' || frequency === 'daily') {
        const dayIds = ['day-mon', 'day-tue', 'day-wed', 'day-thu', 'day-fri', 'day-sat', 'day-sun'];
        days = dayIds.filter(id => document.getElementById(id).checked)
                    .map(id => id.replace('day-', ''));
    }
    
    // Setup data object
    const scheduleData = {
        name: scheduleName,
        pet_id: petId,
        device_id: deviceId,
        frequency: frequency,
        time: time,
        amount: parseInt(amount),
        notes: notes,
        days: days,
        status: 'active',
        updated_at: new Date().toISOString()
    };
    
    try {
        showLoadingState(scheduleForm.querySelector('button[type="submit"]'), true);
        
        if (currentScheduleId) {
            // Update existing schedule
            const { error } = await supabase
                .from('feeding_schedules')
                .update(scheduleData)
                .eq('id', currentScheduleId);
                
            if (error) throw error;
            
            showToast('Schedule updated successfully', 'success');
        } else {
            // Create new schedule
            const { error } = await supabase
                .from('feeding_schedules')
                .insert([{
                    ...scheduleData,
                    created_at: new Date().toISOString(),
                    user_id: (await supabase.auth.getUser()).data.user.id
                }]);
                
            if (error) throw error;
            
            showToast('Schedule created successfully', 'success');
        }
        
        // Reload schedules and close modal
        loadSchedules();
        loadUpcomingFeedings();
        toggleModal(scheduleModal, false);
    } catch (error) {
        console.error('Error saving schedule:', error);
        showToast('Error saving schedule. Please try again.', 'error');
    } finally {
        showLoadingState(scheduleForm.querySelector('button[type="submit"]'), false);
    }
}

// Handle delete schedule
async function handleDeleteSchedule() {
    if (!currentScheduleId) return;
    
    try {
        showLoadingState(deleteConfirmBtn, true);
        
        const { error } = await supabase
            .from('feeding_schedules')
            .delete()
            .eq('id', currentScheduleId);
            
        if (error) throw error;
        
        showToast('Schedule deleted successfully', 'success');
        loadSchedules();
        loadUpcomingFeedings();
        toggleModal(deleteModal, false);
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Error deleting schedule. Please try again.', 'error');
    } finally {
        showLoadingState(deleteConfirmBtn, false);
    }
}

// Toggle schedule status (active/paused)
async function toggleScheduleStatus(scheduleId, newStatus) {
    try {
        const { error } = await supabase
            .from('feeding_schedules')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', scheduleId);
            
        if (error) throw error;
        
        showToast(`Schedule ${newStatus === 'active' ? 'activated' : 'paused'} successfully`, 'success');
        loadSchedules();
        loadUpcomingFeedings();
    } catch (error) {
        console.error('Error updating schedule status:', error);
        showToast('Error updating schedule status. Please try again.', 'error');
    }
}

// Trigger feed now
async function triggerFeedNow(feedingId) {
    try {
        // Get feeding details from DOM since we don't have a real-time connection to the device
        const feedingItem = document.querySelector(`[data-feeding-id="${feedingId}"]`);
        const petName = feedingItem.querySelector('.pet-name').textContent;
        const amount = feedingItem.querySelector('.amount').textContent;
        const deviceName = feedingItem.querySelector('.device').textContent.replace(/^.*\s/, '');
        
        // In a real application, we would send a command to the actual device
        // For this demo, we'll simulate a successful feeding
        
        // First, update UI to show loading
        const feedNowBtn = feedingItem.querySelector('.feed-now-btn');
        showLoadingState(feedNowBtn, true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a feeding history record
        const { error } = await supabase
            .from('feeding_history')
            .insert([{
                pet_id: feedingItem.dataset.petId || '1',
                device_id: feedingItem.dataset.deviceId || '1',
                amount: parseInt(amount),
                scheduled: true,
                scheduled_time: new Date().toISOString(),
                actual_time: new Date().toISOString(),
                status: 'success',
                user_id: (await supabase.auth.getUser()).data.user.id,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
        
        // Update UI to show completion
        feedingItem.classList.add('completed');
        const timeBadge = feedingItem.querySelector('.time-badge');
        timeBadge.innerHTML = `<i class="fas fa-check-circle"></i><span>${timeBadge.querySelector('span').textContent}</span>`;
        
        // Remove the Feed Now button
        feedNowBtn.remove();
        
        showToast(`${petName} fed successfully with ${amount} of food`, 'success');
    } catch (error) {
        console.error('Error triggering feed now:', error);
        showToast('Error feeding pet. Please try again.', 'error');
    } finally {
        const feedNowBtn = document.querySelector(`[data-feeding-id="${feedingId}"]`)?.querySelector('.feed-now-btn');
        if (feedNowBtn) {
            showLoadingState(feedNowBtn, false);
        }
    }
}

// Load schedules from database
async function loadSchedules() {
    try {
        showPageLoader(true);
        
        const { data, error } = await supabase
            .from('feeding_schedules')
            .select(`
                id,
                name,
                pet_id,
                device_id,
                frequency,
                time,
                amount,
                notes,
                days,
                status,
                created_at,
                updated_at,
                pets:pet_id (id, name, type, breed, image_url),
                devices:device_id (id, name, status)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        renderSchedules(data || []);
    } catch (error) {
        console.error('Error loading schedules:', error);
        showToast('Error loading schedules. Please try again.', 'error');
    } finally {
        showPageLoader(false);
    }
}

// Load upcoming feedings
async function loadUpcomingFeedings() {
    try {
        const upcomingContainer = document.getElementById('upcoming-container');
        const loadingHtml = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading upcoming feedings...</p>
            </div>
        `;
        upcomingContainer.innerHTML = loadingHtml;
        
        // In a real app, we would fetch actual upcoming feedings from the backend
        // For this demo, we'll simulate a network delay and use static data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // We'd usually fetch this data from the database
        // For demo, we're using the HTML that's already in the page
        const originalHtml = upcomingContainer.innerHTML;
        
        // Update dates to current dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayFormatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        // Restore original content but update dates
        upcomingContainer.innerHTML = originalHtml;
        document.querySelector('.upcoming-day:nth-child(1) .date').textContent = todayFormatted;
        document.querySelector('.upcoming-day:nth-child(2) .date').textContent = tomorrowFormatted;
        
        // Add animation classes
        const upcomingItems = document.querySelectorAll('.upcoming-item');
        upcomingItems.forEach((item, index) => {
            item.style.animationDelay = `${0.05 * index}s`;
            item.classList.add('animate-in');
        });
    } catch (error) {
        console.error('Error loading upcoming feedings:', error);
        showToast('Error loading upcoming feedings. Please try again.', 'error');
    }
}

// Render schedules in list view
function renderSchedules(schedules) {
    const scheduleItemsContainer = schedulesList.querySelector('.schedule-items');
    if (!scheduleItemsContainer) return;
    
    // Clear existing items
    scheduleItemsContainer.innerHTML = '';
    
    if (schedules.length === 0) {
        scheduleItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <h3>No Schedules Found</h3>
                <p>Create your first feeding schedule to get started</p>
                <button class="btn btn-primary" id="empty-create-btn">
                    <i class="fas fa-plus"></i> Create Schedule
                </button>
            </div>
        `;
        
        // Add event listener to the empty state button
        const emptyCreateBtn = document.getElementById('empty-create-btn');
        if (emptyCreateBtn) {
            emptyCreateBtn.addEventListener('click', () => openScheduleModal());
        }
        
        return;
    }
    
    // Loop through schedules and create list items
    schedules.forEach((schedule, index) => {
        const frequencyText = getFrequencyText(schedule.frequency, schedule.days);
        const petName = schedule.pets?.name || 'Unknown Pet';
        const deviceName = schedule.devices?.name || 'Unknown Device';
        const petImageUrl = schedule.pets?.image_url || 'assets/images/pet-placeholder.jpg';
        
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        scheduleItem.dataset.scheduleId = schedule.id;
        scheduleItem.style.animationDelay = `${0.05 * index}s`;
        
        scheduleItem.innerHTML = `
            <div class="schedule-item-cell schedule-name" data-label="Schedule Name">${schedule.name}</div>
            <div class="schedule-item-cell pet" data-label="Pet">
                <img src="${petImageUrl}" alt="${petName}" class="pet-avatar">
                <span>${petName}</span>
            </div>
            <div class="schedule-item-cell device" data-label="Device">${deviceName}</div>
            <div class="schedule-item-cell frequency" data-label="Frequency">${frequencyText}</div>
            <div class="schedule-item-cell time" data-label="Time">${formatTime(schedule.time)}</div>
            <div class="schedule-item-cell amount" data-label="Amount">${schedule.amount}g</div>
            <div class="schedule-item-cell status" data-label="Status">
                <span class="status-badge ${schedule.status}">${capitalizeFirst(schedule.status)}</span>
            </div>
            <div class="schedule-item-cell actions">
                <button class="btn btn-icon" data-tooltip="Edit" aria-label="Edit schedule">
                    <i class="fas fa-edit"></i>
                </button>
                ${schedule.status === 'active' ? 
                    `<button class="btn btn-icon pause-schedule" data-tooltip="Pause" aria-label="Pause schedule">
                        <i class="fas fa-pause"></i>
                    </button>` :
                    `<button class="btn btn-icon resume-schedule" data-tooltip="Resume" aria-label="Resume schedule">
                        <i class="fas fa-play"></i>
                    </button>`
                }
                <button class="btn btn-icon delete-schedule" data-tooltip="Delete" aria-label="Delete schedule">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        scheduleItemsContainer.appendChild(scheduleItem);
    });
    
    // Populate grid view with the same data
    populateGridView(schedules);
}

// Populate grid view with schedules
function populateGridView(schedules) {
    if (!schedules) return;
    
    // Clear existing items
    schedulesGrid.innerHTML = '';
    
    if (schedules.length === 0) {
        schedulesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <h3>No Schedules Found</h3>
                <p>Create your first feeding schedule to get started</p>
                <button class="btn btn-primary" id="empty-create-grid-btn">
                    <i class="fas fa-plus"></i> Create Schedule
                </button>
            </div>
        `;
        
        // Add event listener to the empty state button
        const emptyCreateBtn = document.getElementById('empty-create-grid-btn');
        if (emptyCreateBtn) {
            emptyCreateBtn.addEventListener('click', () => openScheduleModal());
        }
        
        return;
    }
    
    // Loop through schedules and create grid cards
    schedules.forEach((schedule, index) => {
        const frequencyText = getFrequencyText(schedule.frequency, schedule.days);
        const petName = schedule.pets?.name || 'Unknown Pet';
        const deviceName = schedule.devices?.name || 'Unknown Device';
        const petImageUrl = schedule.pets?.image_url || 'assets/images/pet-placeholder.jpg';
        
        const scheduleCard = document.createElement('div');
        scheduleCard.className = 'schedule-card';
        scheduleCard.dataset.scheduleId = schedule.id;
        scheduleCard.style.animationDelay = `${0.05 * index}s`;
        
        scheduleCard.innerHTML = `
            <div class="schedule-card-header">
                <h3>${schedule.name}</h3>
                <span class="status-badge ${schedule.status}">${capitalizeFirst(schedule.status)}</span>
            </div>
            <div class="schedule-card-body">
                <div class="schedule-card-info">
                    <div class="schedule-info-item">
                        <span class="schedule-info-label">Pet</span>
                        <span class="schedule-info-value">${petName}</span>
                    </div>
                    <div class="schedule-info-item">
                        <span class="schedule-info-label">Device</span>
                        <span class="schedule-info-value">${deviceName}</span>
                    </div>
                    <div class="schedule-info-item">
                        <span class="schedule-info-label">Frequency</span>
                        <span class="schedule-info-value">${frequencyText}</span>
                    </div>
                    <div class="schedule-info-item">
                        <span class="schedule-info-label">Time</span>
                        <span class="schedule-info-value">${formatTime(schedule.time)}</span>
                    </div>
                    <div class="schedule-info-item">
                        <span class="schedule-info-label">Amount</span>
                        <span class="schedule-info-value">${schedule.amount}g</span>
                    </div>
                </div>
            </div>
            <div class="schedule-card-footer">
                <button class="btn btn-sm btn-outline edit-schedule" data-schedule-id="${schedule.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                ${schedule.status === 'active' ? 
                    `<button class="btn btn-sm btn-outline pause-schedule" data-schedule-id="${schedule.id}">
                        <i class="fas fa-pause"></i> Pause
                    </button>` :
                    `<button class="btn btn-sm btn-outline resume-schedule" data-schedule-id="${schedule.id}">
                        <i class="fas fa-play"></i> Resume
                    </button>`
                }
            </div>
        `;
        
        // Add event listeners for grid card actions
        scheduleCard.querySelector('.edit-schedule').addEventListener('click', () => {
            openScheduleModal(schedule.id);
        });
        
        scheduleCard.querySelector(schedule.status === 'active' ? '.pause-schedule' : '.resume-schedule').addEventListener('click', () => {
            toggleScheduleStatus(schedule.id, schedule.status === 'active' ? 'paused' : 'active');
        });
        
        schedulesGrid.appendChild(scheduleCard);
    });
}

// Load schedule data for editing
async function loadScheduleData(scheduleId) {
    try {
        showLoadingState(scheduleForm.querySelector('button[type="submit"]'), true);
        
        const { data, error } = await supabase
            .from('feeding_schedules')
            .select('*')
            .eq('id', scheduleId)
            .single();
            
        if (error) throw error;
        
        if (!data) {
            showToast('Schedule not found', 'error');
            toggleModal(scheduleModal, false);
            return;
        }
        
        // Fill form with schedule data
        document.getElementById('schedule-id').value = data.id;
        document.getElementById('schedule-name').value = data.name;
        document.getElementById('schedule-pet').value = data.pet_id;
        document.getElementById('schedule-device').value = data.device_id;
        document.getElementById('schedule-frequency').value = data.frequency;
        document.getElementById('schedule-time').value = data.time;
        document.getElementById('schedule-amount').value = data.amount;
        document.getElementById('schedule-amount-range').value = data.amount;
        document.getElementById('schedule-notes').value = data.notes || '';
        
        // Handle custom days
        handleFrequencyChange();
        
        if (data.days && data.days.length > 0) {
            // Reset all checkboxes
            const dayCheckboxes = document.querySelectorAll('.day-checkbox input');
            dayCheckboxes.forEach(cb => cb.checked = false);
            
            // Check the days from data
            data.days.forEach(day => {
                const checkbox = document.getElementById(`day-${day}`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } catch (error) {
        console.error('Error loading schedule data:', error);
        showToast('Error loading schedule data. Please try again.', 'error');
    } finally {
        showLoadingState(scheduleForm.querySelector('button[type="submit"]'), false);
    }
}

// Filter schedules based on selected filters
function filterSchedules() {
    const pet = petFilter.value;
    const device = deviceFilter.value;
    const status = statusFilter.value;
    
    // Get all schedule items
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    scheduleItems.forEach(item => {
        const itemPet = item.querySelector('.pet span').textContent;
        const itemDevice = item.querySelector('.device').textContent;
        const itemStatus = item.querySelector('.status-badge').className.split(' ')[1];
        
        // Check if item matches all selected filters
        const matchesPet = pet === 'all' || itemPet.includes(`(${pet})`);
        const matchesDevice = device === 'all' || itemDevice === device;
        const matchesStatus = status === 'all' || itemStatus === status;
        
        // Show or hide item based on filter matches
        if (matchesPet && matchesDevice && matchesStatus) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update user info in header
async function updateUserInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (!error && data) {
            document.getElementById('profile-name').textContent = data.first_name || user.email;
            
            if (data.avatar_url) {
                document.getElementById('profile-image').src = data.avatar_url;
            }
        } else {
            document.getElementById('profile-name').textContent = user.email;
        }
    }
}

// Helper function to get frequency text
function getFrequencyText(frequency, days) {
    switch (frequency) {
        case 'daily':
            return 'Daily';
        case 'weekdays':
            return 'Weekdays';
        case 'weekends':
            return 'Weekends';
        case 'custom':
            if (!days || days.length === 0) return 'Custom';
            
            // Map days abbreviations to readable text
            const dayMap = {
                'mon': 'Mon',
                'tue': 'Tue',
                'wed': 'Wed',
                'thu': 'Thu',
                'fri': 'Fri',
                'sat': 'Sat',
                'sun': 'Sun'
            };
            
            return days.map(d => dayMap[d] || d).join(', ');
        default:
            return frequency;
    }
}

// Format time for display
function formatTime(timeStr) {
    if (!timeStr) return '';
    
    try {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        
        return `${displayHour}:${minutes} ${suffix}`;
    } catch (e) {
        return timeStr;
    }
}

// Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Show loading state for buttons
function showLoadingState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Show page loader
function showPageLoader(show) {
    const loader = document.querySelector('.page-loader');
    
    if (show) {
        if (!loader) {
            const newLoader = document.createElement('div');
            newLoader.className = 'page-loader';
            newLoader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(newLoader);
        }
    } else {
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }
}

// Initialize animations for elements
function initAnimatedElements() {
    // Add animation classes to schedule items
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach((item, index) => {
        item.classList.add('animate-in');
        item.style.animationDelay = `${0.05 * index}s`;
    });

    // Add animation classes to upcoming items
    const upcomingItems = document.querySelectorAll('.upcoming-item');
    upcomingItems.forEach((item, index) => {
        item.classList.add('animate-in');
        item.style.animationDelay = `${0.05 * index}s`;
    });
}