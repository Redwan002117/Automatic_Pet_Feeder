/**
 * Dashboard JavaScript for Automatic Pet Feeder
 * Handles dashboard-specific functionality, charts, and data loading
 */

let supabase;
let weeklyFeedingChart;
let consumptionChart;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Supabase client
    supabase = await initSupabase();
    
    // Check authentication
    const user = await checkAuth();
    if (!user) return;
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize charts
    initCharts();
    
    // Initialize feed now functionality
    initFeedNow();
    
    // Initialize notification functionality
    initNotifications();
    
    // Setup event handlers for dashboard actions
    setupDashboardActions();
});

/**
 * Initialize Supabase client
 */
async function initSupabase() {
    try {
        // In a production environment, these would be loaded from environment variables
        const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
        const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
        
        return supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        showError('Could not initialize application. Please try again later.');
        return null;
    }
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        if (!user) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return null;
        }
        
        // Update UI with user info
        updateUserInfo(user);
        
        return user;
    } catch (error) {
        console.error('Error checking authentication:', error);
        window.location.href = 'login.html';
        return null;
    }
}

/**
 * Update user information in UI
 */
function updateUserInfo(user) {
    const profileName = document.getElementById('profile-name');
    const profileImage = document.getElementById('profile-image');
    
    if (profileName) {
        profileName.textContent = user.user_metadata?.display_name || user.email.split('@')[0];
    }
    
    if (profileImage && user.user_metadata?.avatar_url) {
        profileImage.src = user.user_metadata.avatar_url;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user.id;
        
        // Fetch devices
        const { data: devices, error: devicesError } = await supabase
            .from('devices')
            .select('*')
            .eq('user_id', userId);
        
        if (devicesError) throw devicesError;
        
        // Fetch pets
        const { data: pets, error: petsError } = await supabase
            .from('pets')
            .select('*')
            .eq('user_id', userId);
        
        if (petsError) throw petsError;
        
        // Fetch feeding schedules
        const { data: schedules, error: schedulesError } = await supabase
            .from('feeding_schedules')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
        
        if (schedulesError) throw schedulesError;
        
        // Fetch today's feedings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: feedings, error: feedingsError } = await supabase
            .from('feeding_history')
            .select('*')
            .eq('user_id', userId)
            .gte('feeding_time', today.toISOString());
        
        if (feedingsError) throw feedingsError;
        
        // Update stats cards
        updateStatsCards(devices, pets, schedules, feedings);
        
        // Update device status cards
        updateDeviceCards(devices);
        
        // Update upcoming feedings
        updateUpcomingFeedings(schedules, pets, devices);
        
        // Update recent feeding history
        updateRecentHistory(feedings, pets, devices);
        
        // Update charts data
        updateChartsData(feedings, pets);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    } finally {
        showLoading(false);
    }
}

/**
 * Update stats cards with counts
 */
function updateStatsCards(devices, pets, schedules, feedings) {
    // Update active devices count
    const activeDevicesCount = document.getElementById('active-devices-count');
    if (activeDevicesCount) {
        const activeDevices = devices.filter(device => device.is_connected);
        activeDevicesCount.textContent = `${activeDevices.length}/${devices.length}`;
    }
    
    // Update pets count
    const petsCount = document.getElementById('pets-count');
    if (petsCount) {
        petsCount.textContent = pets.length;
    }
    
    // Update schedules count
    const schedulesCount = document.getElementById('schedules-count');
    if (schedulesCount) {
        schedulesCount.textContent = schedules.length;
    }
    
    // Update feedings count
    const feedingsCount = document.getElementById('feedings-count');
    if (feedingsCount) {
        feedingsCount.textContent = feedings.length;
    }
}

/**
 * Update device status cards
 */
function updateDeviceCards(devices) {
    const deviceCardsContainer = document.getElementById('device-status-cards');
    if (!deviceCardsContainer) return;
    
    // Clear existing cards if appending new ones
    if (devices.length > 0) {
        deviceCardsContainer.innerHTML = '';
    }
    
    // Create cards for each device
    devices.forEach(device => {
        const isOnline = device.is_connected;
        const batteryLevel = device.battery_level || 0;
        const foodLevel = device.food_level || 0;
        const wifiSignal = device.wifi_signal || 0;
        
        let signalStrength = 'No Connection';
        if (isOnline) {
            if (wifiSignal >= 80) signalStrength = 'Excellent';
            else if (wifiSignal >= 60) signalStrength = 'Strong';
            else if (wifiSignal >= 40) signalStrength = 'Good';
            else if (wifiSignal >= 20) signalStrength = 'Fair';
            else signalStrength = 'Weak';
        }
        
        let batteryIcon = 'fa-battery-empty';
        if (batteryLevel >= 80) batteryIcon = 'fa-battery-full';
        else if (batteryLevel >= 60) batteryIcon = 'fa-battery-three-quarters';
        else if (batteryLevel >= 40) batteryIcon = 'fa-battery-half';
        else if (batteryLevel >= 20) batteryIcon = 'fa-battery-quarter';
        
        const batteryClass = batteryLevel <= 20 ? 'battery-low' : '';
        
        // Create card element
        const card = document.createElement('div');
        card.className = 'device-card';
        card.innerHTML = `
            <div class="device-header">
                <h3>${device.name}</h3>
                <span class="device-status ${isOnline ? 'online' : 'offline'}">${isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div class="device-info">
                <div class="device-metric">
                    <i class="fas ${batteryIcon} ${batteryClass}"></i>
                    <span>Battery: ${batteryLevel}%</span>
                </div>
                <div class="device-metric">
                    <i class="fas fa-wifi"></i>
                    <span>Signal: ${signalStrength}</span>
                </div>
                <div class="device-metric">
                    <i class="fas fa-drumstick-bite"></i>
                    <span>Food Level: ${isOnline ? `${foodLevel}%` : 'Unknown'}</span>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${foodLevel}%"></div>
                    </div>
                </div>
            </div>
            <div class="device-actions">
                <button class="btn btn-primary btn-sm feed-now-btn" data-device-id="${device.id}" ${!isOnline ? 'disabled' : ''}>Feed Now</button>
                <button class="btn btn-outline btn-sm device-details-btn" data-device-id="${device.id}">Details</button>
            </div>
        `;
        
        deviceCardsContainer.appendChild(card);
        
        // Add event listeners to buttons
        const feedNowBtn = card.querySelector('.feed-now-btn');
        if (feedNowBtn && isOnline) {
            feedNowBtn.addEventListener('click', () => {
                openFeedNowModal(device);
            });
        }
        
        const detailsBtn = card.querySelector('.device-details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                window.location.href = `device-details.html?id=${device.id}`;
            });
        }
    });
}

/**
 * Update upcoming feedings table
 */
function updateUpcomingFeedings(schedules, pets, devices) {
    const upcomingFeedingsList = document.getElementById('upcoming-feedings-list');
    if (!upcomingFeedingsList) return;
    
    // Clear existing rows
    upcomingFeedingsList.innerHTML = '';
    
    // Get upcoming feedings for today
    const now = new Date();
    const upcomingFeedings = [];
    
    schedules.forEach(schedule => {
        if (!schedule.is_active) return;
        
        const daysOfWeek = schedule.days_of_week;
        const today = now.getDay(); // 0-6, Sunday-Saturday
        
        // Check if schedule is for today
        if (daysOfWeek.includes(today.toString()) || daysOfWeek.includes(`${today}`)) {
            // Parse scheduled time
            const [hours, minutes] = schedule.scheduled_time.split(':');
            const scheduledDate = new Date();
            scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Only include if scheduled time is in the future
            if (scheduledDate > now) {
                upcomingFeedings.push({
                    schedule,
                    scheduledDate
                });
            }
        }
    });
    
    // Sort by scheduled time
    upcomingFeedings.sort((a, b) => a.scheduledDate - b.scheduledDate);
    
    // Limit to 5 upcoming feedings
    const limitedFeedings = upcomingFeedings.slice(0, 5);
    
    // Create rows for each upcoming feeding
    limitedFeedings.forEach(({ schedule, scheduledDate }) => {
        const pet = pets.find(p => p.id === schedule.pet_id);
        const device = devices.find(d => d.id === schedule.device_id);
        
        if (!pet || !device) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="pet-info">
                    <img src="${pet.image_url || 'assets/images/pet-placeholder.jpg'}" alt="${pet.name}">
                    <span>${pet.name}</span>
                </div>
            </td>
            <td>${device.name}</td>
            <td>Today, ${formatTime(scheduledDate)}</td>
            <td>${schedule.portion_size}</td>
            <td><span class="feeding-status scheduled">Scheduled</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-icon feed-now-action" title="Feed now" data-schedule-id="${schedule.id}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-icon skip-action" title="Skip" data-schedule-id="${schedule.id}">
                        <i class="fas fa-forward"></i>
                    </button>
                    <button class="btn btn-icon edit-action" title="Edit" data-schedule-id="${schedule.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        
        upcomingFeedingsList.appendChild(tr);
        
        // Add event listeners to action buttons
        const feedNowBtn = tr.querySelector('.feed-now-action');
        if (feedNowBtn) {
            feedNowBtn.addEventListener('click', () => {
                triggerFeedingNow(schedule, pet, device);
            });
        }
        
        const skipBtn = tr.querySelector('.skip-action');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                skipScheduledFeeding(schedule.id);
            });
        }
        
        const editBtn = tr.querySelector('.edit-action');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `edit-schedule.html?id=${schedule.id}`;
            });
        }
    });
    
    // Show a message if no upcoming feedings
    if (limitedFeedings.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" class="text-center">
                <p>No upcoming feedings scheduled for today.</p>
            </td>
        `;
        upcomingFeedingsList.appendChild(tr);
    }
}

/**
 * Update recent feeding history
 */
function updateRecentHistory(feedings, pets, devices) {
    const recentHistoryList = document.getElementById('recent-history-list');
    if (!recentHistoryList) return;
    
    // Clear existing rows
    recentHistoryList.innerHTML = '';
    
    // Sort feedings by time (most recent first)
    const sortedFeedings = [...feedings].sort((a, b) => {
        return new Date(b.feeding_time) - new Date(a.feeding_time);
    });
    
    // Limit to 5 most recent feedings
    const recentFeedings = sortedFeedings.slice(0, 5);
    
    // Create rows for each recent feeding
    recentFeedings.forEach(feeding => {
        const pet = pets.find(p => p.id === feeding.pet_id);
        const device = devices.find(d => d.id === feeding.device_id);
        
        if (!pet || !device) return;
        
        const feedingTime = new Date(feeding.feeding_time);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="pet-info">
                    <img src="${pet.image_url || 'assets/images/pet-placeholder.jpg'}" alt="${pet.name}">
                    <span>${pet.name}</span>
                </div>
            </td>
            <td>${device.name}</td>
            <td>${formatDateTime(feedingTime, 'relative')}</td>
            <td>${feeding.portion_size}</td>
            <td>${feeding.feeding_type}</td>
            <td><span class="feeding-status ${feeding.status.toLowerCase()}">${feeding.status}</span></td>
        `;
        
        recentHistoryList.appendChild(tr);
    });
    
    // Show a message if no feeding history
    if (recentFeedings.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" class="text-center">
                <p>No feeding history available.</p>
            </td>
        `;
        recentHistoryList.appendChild(tr);
    }
}

/**
 * Initialize charts
 */
function initCharts() {
    // Weekly feeding pattern chart
    const weeklyChartCanvas = document.querySelector('#weekly-feeding-chart canvas');
    if (weeklyChartCanvas) {
        weeklyFeedingChart = new Chart(weeklyChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Number of Feedings',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(74, 108, 250, 0.7)',
                    borderColor: 'rgba(74, 108, 250, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${value} feeding${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Food consumption by pet chart
    const consumptionChartCanvas = document.querySelector('#consumption-chart canvas');
    if (consumptionChartCanvas) {
        consumptionChart = new Chart(consumptionChartCanvas, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(74, 108, 250, 0.7)',
                        'rgba(110, 189, 158, 0.7)',
                        'rgba(247, 198, 83, 0.7)',
                        'rgba(229, 108, 120, 0.7)',
                        'rgba(152, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(74, 108, 250, 1)',
                        'rgba(110, 189, 158, 1)',
                        'rgba(247, 198, 83, 1)',
                        'rgba(229, 108, 120, 1)',
                        'rgba(152, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} cups (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update charts data
 */
function updateChartsData(feedings, pets) {
    // Update weekly feeding pattern chart
    if (weeklyFeedingChart) {
        const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        
        // Count feedings by day of week for the past week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        feedings.forEach(feeding => {
            const feedingDate = new Date(feeding.feeding_time);
            const dayOfWeek = feedingDate.getDay(); // 0-6, Sunday-Saturday
            
            if (feedingDate >= oneWeekAgo) {
                weekdayCounts[dayOfWeek]++;
            }
        });
        
        // Update chart data
        weeklyFeedingChart.data.datasets[0].data = weekdayCounts;
        weeklyFeedingChart.update();
    }
    
    // Update food consumption by pet chart
    if (consumptionChart) {
        const petConsumption = {};
        const petNames = {};
        
        // Get pet names
        pets.forEach(pet => {
            petNames[pet.id] = pet.name;
            petConsumption[pet.id] = 0;
        });
        
        // Calculate total consumption by pet
        feedings.forEach(feeding => {
            if (feeding.status === 'success' && petConsumption[feeding.pet_id] !== undefined) {
                // Parse portion size (assuming format like "1 cup" or "0.5 cup")
                const portionMatch = feeding.portion_size.match(/(\d+(\.\d+)?)/);
                if (portionMatch) {
                    const portionSize = parseFloat(portionMatch[1]);
                    petConsumption[feeding.pet_id] += portionSize;
                }
            }
        });
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        
        Object.entries(petConsumption).forEach(([petId, consumption]) => {
            if (consumption > 0) {
                labels.push(petNames[petId]);
                data.push(consumption);
            }
        });
        
        // Update chart data
        consumptionChart.data.labels = labels;
        consumptionChart.data.datasets[0].data = data;
        consumptionChart.update();
    }
}

/**
 * Initialize feed now functionality
 */
function initFeedNow() {
    const feedNowForm = document.getElementById('feed-now-form');
    if (feedNowForm) {
        feedNowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const petId = document.getElementById('feed-pet').value;
            const portionType = document.getElementById('feed-portion').value;
            const deviceId = feedNowForm.querySelector('input[name="device-id"]')?.value;
            
            if (!petId || !portionType || !deviceId) {
                alert('Please select a pet and portion size.');
                return;
            }
            
            let portionSize;
            if (portionType === 'custom') {
                portionSize = document.getElementById('custom-portion-size').value;
                if (!portionSize) {
                    alert('Please enter a custom portion size.');
                    return;
                }
                portionSize = `${portionSize} cups`;
            } else {
                // Map portion types to sizes
                const portionSizes = {
                    'small': '0.25 cup',
                    'medium': '0.5 cup',
                    'large': '1 cup'
                };
                portionSize = portionSizes[portionType];
            }
            
            // Trigger manual feeding
            await triggerManualFeeding(deviceId, petId, portionSize);
            
            // Close the modal
            const feedNowModal = document.getElementById('feed-now-modal');
            if (feedNowModal) {
                const closeBtn = feedNowModal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        });
    }
}

/**
 * Open feed now modal with pre-selected device
 */
function openFeedNowModal(device) {
    const feedNowModal = document.getElementById('feed-now-modal');
    if (!feedNowModal) return;
    
    // Set device ID in hidden input
    const deviceInput = document.createElement('input');
    deviceInput.type = 'hidden';
    deviceInput.name = 'device-id';
    deviceInput.value = device.id;
    
    const form = feedNowModal.querySelector('form');
    // Remove any existing device ID input
    const existingDeviceInput = form.querySelector('input[name="device-id"]');
    if (existingDeviceInput) {
        existingDeviceInput.remove();
    }
    
    form.appendChild(deviceInput);
    
    // Show modal
    feedNowModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

/**
 * Trigger manual feeding
 */
async function triggerManualFeeding(deviceId, petId, portionSize) {
    try {
        // Show loading state
        showLoading(true);
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user.id;
        
        // Create feeding history record
        const { data, error } = await supabase
            .from('feeding_history')
            .insert([
                {
                    user_id: userId,
                    device_id: deviceId,
                    pet_id: petId,
                    portion_size: portionSize,
                    feeding_time: new Date().toISOString(),
                    feeding_type: 'manual',
                    status: 'success' // In a real app, this would be set after confirming the device actually dispensed food
                }
            ]);
        
        if (error) throw error;
        
        // Show success notification
        alert('Feeding triggered successfully!');
        
        // Reload dashboard data
        loadDashboardData();
        
    } catch (error) {
        console.error('Error triggering feeding:', error);
        alert('Failed to trigger feeding. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Trigger feeding now for a scheduled feeding
 */
async function triggerFeedingNow(schedule, pet, device) {
    if (!confirm(`Feed ${pet.name} using ${device.name} now?`)) {
        return;
    }
    
    try {
        // Show loading state
        showLoading(true);
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user.id;
        
        // Create feeding history record
        const { data, error } = await supabase
            .from('feeding_history')
            .insert([
                {
                    user_id: userId,
                    device_id: device.id,
                    pet_id: pet.id,
                    portion_size: schedule.portion_size,
                    feeding_time: new Date().toISOString(),
                    feeding_type: 'scheduled',
                    status: 'success' // In a real app, this would be set after confirming the device actually dispensed food
                }
            ]);
        
        if (error) throw error;
        
        // Show success notification
        alert('Feeding triggered successfully!');
        
        // Reload dashboard data
        loadDashboardData();
        
    } catch (error) {
        console.error('Error triggering feeding:', error);
        alert('Failed to trigger feeding. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * Skip a scheduled feeding
 */
async function skipScheduledFeeding(scheduleId) {
    if (!confirm('Are you sure you want to skip this feeding?')) {
        return;
    }
    
    // In a real app, you might record this skip in the database
    // For this demo, we'll just show a success message
    alert('Feeding has been skipped for today.');
}

/**
 * Initialize notifications functionality
 */
function initNotifications() {
    const notificationBell = document.querySelector('.notification-bell');
    const markAllReadBtn = document.querySelector('.mark-all-read');
    const notificationCloseButtons = document.querySelectorAll('.notification-close');
    
    // Mark all notifications as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const unreadNotifications = document.querySelectorAll('.notification-item.unread');
            unreadNotifications.forEach(notification => {
                notification.classList.remove('unread');
            });
            
            // Update notification count
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
            }
        });
    }
    
    // Close individual notifications
    notificationCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const notification = button.closest('.notification-item');
            notification.style.height = notification.offsetHeight + 'px';
            
            // Trigger reflow
            notification.offsetHeight;
            
            // Add exit animation class
            notification.classList.add('removing');
            
            // Remove after animation completes
            setTimeout(() => {
                notification.remove();
                
                // Update notification count
                updateNotificationCount();
            }, 300);
        });
    });
}

/**
 * Update notification count
 */
function updateNotificationCount() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        badge.textContent = unreadNotifications.length;
        
        // Hide badge if no notifications
        if (unreadNotifications.length === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'flex';
        }
    }
}

/**
 * Setup event handlers for dashboard actions
 */
function setupDashboardActions() {
    // Any other dashboard-specific actions can be added here
}

/**
 * Format time (12-hour format)
 */
function formatTime(date) {
    return date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
}

/**
 * Show/hide loading state
 */
function showLoading(isLoading) {
    // You could implement a loading indicator here
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
} 