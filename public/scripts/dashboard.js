/**
 * Dashboard functionality for the Automatic Pet Feeder
 * Handles dashboard UI, device status, feeding schedules, and analytics
 */

// Store references to key dashboard elements
const dashboardElements = {
    deviceCards: document.getElementById('device-status-cards'),
    upcomingFeedings: document.getElementById('upcoming-feedings-list'),
    recentHistory: document.getElementById('recent-history-list'),
    activeDevicesCount: document.getElementById('active-devices-count'),
    petsCount: document.getElementById('pets-count'),
    schedulesCount: document.getElementById('schedules-count'),
    feedingsCount: document.getElementById('feedings-count'),
    weeklyChart: document.getElementById('weekly-feeding-chart'),
    consumptionChart: document.getElementById('consumption-chart')
};

// Data storage
let devices = [];
let pets = [];
let schedules = [];
let feedingHistory = [];

// Initialize dashboard
async function initDashboard() {
    try {
        // Show loading state
        if (window.app && window.app.showLoading) {
            window.app.showLoading(true);
        }
        
        console.log('Initializing dashboard...');
        
        // Make sure Supabase is initialized
        await initSupabase();
        
        // Initialize UI components
        initializeUI();
        
        // Add event listeners
        addDashboardEventListeners();
        
        // Check authentication first
        const isAuthenticated = await checkAuthentication();
        
        if (isAuthenticated) {
            // Load dashboard data only if user is authenticated
            await loadDashboardData();
            
            // Initialize the header
            initializeHeader();
            
            // Set up notification system
            initializeNotifications();
            
            // Initialize charts
            initializeCharts();
        } else {
            // Show login prompt if not authenticated
            showLoginPrompt();
        }
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to initialize dashboard. Please refresh the page.', 'error');
        }
    } finally {
        // Hide loading state
        if (window.app && window.app.showLoading) {
            window.app.showLoading(false);
        }
    }
}

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.warn('Authentication check error:', error);
            return false;
        }
        
        return data && data.session && data.session.user;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Show login prompt for unauthenticated users
function showLoginPrompt() {
    // Hide regular dashboard content
    const dashboardContent = document.querySelector('.content-body');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }
    
    // Create and show login prompt
    const loginPrompt = document.createElement('div');
    loginPrompt.className = 'login-prompt ios-card';
    loginPrompt.innerHTML = `
        <div class="login-prompt-content">
            <i class="fas fa-lock login-prompt-icon"></i>
            <h2 class="login-prompt-title">Authentication Required</h2>
            <p class="login-prompt-message">Please log in to access your dashboard and control your pet feeders.</p>
            <div class="login-prompt-actions">
                <a href="/login.html" class="ios-button ios-button-primary">Log In</a>
                <a href="/signup.html" class="ios-button ios-button-outline">Sign Up</a>
            </div>
        </div>
    `;
    
    // Insert login prompt
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(loginPrompt);
        
        // Add some basic styles
        const style = document.createElement('style');
        style.textContent = `
            .login-prompt {
                max-width: 500px;
                margin: 100px auto;
                padding: 40px;
                text-align: center;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .login-prompt-icon {
                font-size: 48px;
                color: var(--ios-blue);
                margin-bottom: 20px;
            }
            .login-prompt-title {
                margin-bottom: 16px;
                font-size: 24px;
                font-weight: 600;
            }
            .login-prompt-message {
                margin-bottom: 30px;
                color: var(--text-secondary);
            }
            .login-prompt-actions {
                display: flex;
                justify-content: center;
                gap: 16px;
            }
            .dark-mode .login-prompt {
                background-color: #1c1c1e;
                color: white;
            }
            .dark-mode .login-prompt-message {
                color: rgba(255, 255, 255, 0.7);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update header to remove user profile and show login buttons
    updateHeaderForUnauthenticated();
}

// Update header for unauthenticated users
function updateHeaderForUnauthenticated() {
    // Hide user profile and notifications
    const userProfile = document.querySelector('.user-profile');
    const notifications = document.querySelector('.notifications');
    
    if (userProfile) userProfile.style.display = 'none';
    if (notifications) notifications.style.display = 'none';
    
    // Add login buttons if they don't exist
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !headerRight.querySelector('.auth-buttons')) {
        const authButtons = document.createElement('div');
        authButtons.className = 'auth-buttons';
        authButtons.innerHTML = `
            <a href="/login.html" class="ios-button ios-button-primary">Log In</a>
            <a href="/signup.html" class="ios-button ios-button-outline">Sign Up</a>
        `;
        headerRight.appendChild(authButtons);
    }
}

// Initialize Supabase for dashboard
async function initSupabase() {
    try {
        // Check if Supabase is already initialized globally
        if (window.supabase) {
            return window.supabase;
        }
        
        // If not, initialize it
        console.log('Initializing Supabase client from dashboard.js');
        
        // Check if configuration is available
        if (!window.appConfig) {
            throw new Error('Missing appConfig. Make sure config.js is loaded before dashboard.js');
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
        
        console.log('Supabase client initialized successfully from dashboard.js');
        return window.supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        throw error;
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Check if user is authenticated before loading data
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        // Load user data
        await loadUserData();
        
        // Load active devices count and device status
        await loadDeviceStatus();
        
        // Load pets count
        await loadPetsData();
        
        // Load active schedules count
        await loadSchedules();
        
        // Load feeding history
        await loadFeedingHistory();
        
        // Update charts with data
        updateCharts();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        throw error;
    }
}

// Load device status
async function loadDeviceStatus() {
    try {
        // First check if we have a valid session
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
            // Show login prompt since we don't have a valid session
            showLoginPrompt();
            return [];
        }
        
        const user = sessionData.session.user;
        
        // Fetch devices associated with the current user
        const { data, error } = await window.supabase
            .from('devices')
            .select('*')
            .eq('user_id', user.id);
            
        if (error) {
            // Handle missing table gracefully
            if (error.code === '42P01') { // "relation does not exist" error
                console.warn('Error loading device status:', error);
                console.log('The devices table does not exist. Using demo device data.');
                
                // Create demo device data for testing
                const demoDevices = [
                    {
                        id: 'demo-device-1',
                        name: 'Kitchen Feeder',
                        device_id: 'PF001',
                        status: 'online',
                        food_level: 75,
                        battery_level: 90,
                        location: 'Kitchen',
                        last_connected: new Date().toISOString()
                    },
                    {
                        id: 'demo-device-2',
                        name: 'Living Room Feeder',
                        device_id: 'PF002',
                        status: 'offline',
                        food_level: 15,
                        battery_level: 20,
                        location: 'Living Room',
                        last_connected: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                    }
                ];
                
                // Store demo devices data
                devices = demoDevices;
                
                // Update active devices count
                const activeDevices = devices.filter(device => device.status === 'online');
                if (dashboardElements.activeDevicesCount) {
                    dashboardElements.activeDevicesCount.textContent = `${activeDevices.length}/${devices.length}`;
                }
                
                // Update device status cards
                updateDeviceStatusCards(devices);
                
                return devices;
            } else {
                throw error;
            }
        }
        
        // Store devices data globally
        devices = data || [];
        
        // Update active devices count
        const activeDevices = devices.filter(device => device.status === 'online');
        if (dashboardElements.activeDevicesCount) {
            dashboardElements.activeDevicesCount.textContent = `${activeDevices.length}/${devices.length}`;
        }
        
        // Update device status cards
        updateDeviceStatusCards(devices);
        
        return devices;
    } catch (error) {
        console.error('Error loading device status:', error);
        // Show error toast if available
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load device status', 'error');
        }
        throw error;
    }
}

// Load pets data
async function loadPetsData() {
    try {
        // First check if we have a valid session
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
            // Show login prompt since we don't have a valid session
            showLoginPrompt();
            return [];
        }
        
        const user = sessionData.session.user;
        
        // Fetch pets associated with the current user
        const { data, error } = await window.supabase
            .from('pets')
            .select('*')
            .eq('user_id', user.id);
            
        if (error) {
            // Handle missing table gracefully
            if (error.code === '42P01') { // "relation does not exist" error
                console.warn('Error loading pets data:', error);
                console.log('The pets table does not exist. Using demo pet data.');
                
                // Create demo pet data for testing
                const demoPets = [
                    {
                        id: 'demo-pet-1',
                        name: 'Buddy',
                        species: 'Dog',
                        breed: 'Golden Retriever',
                        weight: 65,
                        weight_unit: 'lbs',
                        age: 3,
                        photo_url: '/assets/images/dog-placeholder.jpg'
                    },
                    {
                        id: 'demo-pet-2',
                        name: 'Whiskers',
                        species: 'Cat',
                        breed: 'Tabby',
                        weight: 10,
                        weight_unit: 'lbs',
                        age: 5,
                        photo_url: '/assets/images/cat-placeholder.jpg'
                    }
                ];
                
                // Store demo pets data
                pets = demoPets;
                
                // Update pets count
                if (dashboardElements.petsCount) {
                    dashboardElements.petsCount.textContent = pets.length.toString();
                }
                
                return pets;
            } else {
                throw error;
            }
        }
        
        // Store pets data globally
        pets = data || [];
        
        // Update pets count
        if (dashboardElements.petsCount) {
            dashboardElements.petsCount.textContent = pets.length.toString();
        }
        
        return pets;
    } catch (error) {
        console.error('Error loading pets data:', error);
        // Show error toast if available
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load pets data', 'error');
        }
        throw error;
    }
}

// Update user interface with profile data - make sure we're using proper format for the query
function updateUserInterface(user, profile) {
    // Update profile name
    const profileNameElements = document.querySelectorAll('#profile-name');
    const displayName = profile?.username || profile?.full_name || user.email?.split('@')[0] || 'User';
    
    profileNameElements.forEach(element => {
        if (element) element.textContent = displayName;
    });
    
    // Update profile image if available
    const profileImageElements = document.querySelectorAll('#profile-image');
    const avatarUrl = profile?.avatar_url || '/assets/images/profile-placeholder.jpg';
    
    profileImageElements.forEach(element => {
        if (element) element.src = avatarUrl;
    });
    
    // Update any other user-specific UI elements here
}

/**
 * Load current user data from Supabase and update UI
 */
async function loadUserData() {
    try {
        // Check if user is authenticated before loading data
        const { data: sessionData, error: sessionError } = await window.supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
            throw new Error('No authenticated user found');
        }
        
        const user = sessionData.session.user;
        
        // Fetch additional user profile data from profiles table
        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
        if (profileError) {
            // Handle missing table gracefully
            if (profileError.code === '42P01') { // "relation does not exist" error
                console.warn('Error fetching user profile:', profileError);
                console.log('The profiles table does not exist. Using default profile data.');
                
                // Create a default profile object
                const defaultProfile = {
                    username: user.email.split('@')[0],
                    full_name: null,
                    avatar_url: '/assets/images/profile-placeholder.jpg'
                };
                
                // Update UI with default profile
                updateUserInterface(user, defaultProfile);
                return { user, profile: defaultProfile };
            } else if (profileError.code !== 'PGRST116') { // Ignore "No rows found" error
                console.warn('Error fetching user profile:', profileError);
            }
        }
        
        // Update UI with user data
        updateUserInterface(user, profile);
        
        return { user, profile };
    } catch (error) {
        console.error('Error loading user data:', error);
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load user data', 'error');
        }
        throw error;
    }
}

// Load feeding schedules
async function loadSchedules() {
    try {
        // First check if we have a valid session
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
            // Show login prompt since we don't have a valid session
            showLoginPrompt();
            return [];
        }
        
        const user = sessionData.session.user;
        
        // Fetch feeding schedules
        const { data, error } = await window.supabase
            .from('feeding_schedules')
            .select(`
                *,
                pet:pets(*),
                device:devices(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Store schedules data globally
        schedules = data || [];
        
        // Update schedules count
        if (dashboardElements.schedulesCount) {
            dashboardElements.schedulesCount.textContent = schedules.length.toString();
        }
        
        // Update upcoming feedings list
        updateUpcomingFeedingsList(schedules);
        
        return schedules;
    } catch (error) {
        console.error('Error loading schedules:', error);
        // Show error toast if available
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load feeding schedules', 'error');
        }
        throw error;
    }
}

// Load feeding history
async function loadFeedingHistory() {
    try {
        // First check if we have a valid session
        const { data: sessionData } = await window.supabase.auth.getSession();
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
            // Show login prompt since we don't have a valid session
            showLoginPrompt();
            return [];
        }
        
        const user = sessionData.session.user;
        
        // Get today's date at midnight for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch feeding history
        const { data, error } = await window.supabase
            .from('feeding_events')  // Use feeding_events table
            .select(`
                *,
                pet:pets(*),
                device:devices(*)
            `)
            .eq('user_id', user.id)
            .order('fed_at', { ascending: false })
            .limit(10);
            
        if (error) {
            // Handle missing table gracefully
            if (error.code === '42P01') { // "relation does not exist" error
                console.warn('Error loading feeding history:', error);
                console.log('The feeding_events table does not exist. Using demo feeding history data.');
                
                // Create demo feeding history for testing
                const demoFeedings = [
                    {
                        id: 'demo-feeding-1',
                        device_id: 'demo-device-1',
                        pet_id: 'demo-pet-1',
                        amount: 1.5,
                        unit: 'cups',
                        status: 'completed',
                        fed_at: new Date().toISOString(),
                        pet: {
                            name: 'Buddy',
                            photo_url: '/assets/images/dog-placeholder.jpg'
                        },
                        device: {
                            name: 'Kitchen Feeder'
                        }
                    },
                    {
                        id: 'demo-feeding-2',
                        device_id: 'demo-device-2',
                        pet_id: 'demo-pet-2',
                        amount: 0.5,
                        unit: 'cups',
                        status: 'completed',
                        fed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                        pet: {
                            name: 'Whiskers',
                            photo_url: '/assets/images/cat-placeholder.jpg'
                        },
                        device: {
                            name: 'Living Room Feeder'
                        }
                    },
                    {
                        id: 'demo-feeding-3',
                        device_id: 'demo-device-1',
                        pet_id: 'demo-pet-1',
                        amount: 1.5,
                        unit: 'cups',
                        status: 'completed',
                        fed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                        pet: {
                            name: 'Buddy',
                            photo_url: '/assets/images/dog-placeholder.jpg'
                        },
                        device: {
                            name: 'Kitchen Feeder'
                        }
                    }
                ];
                
                // Store demo feeding history data
                feedingHistory = demoFeedings;
                
                // Update feedings count for today
                if (dashboardElements.feedingsCount) {
                    // Filter for today's feedings
                    const todayFeedings = feedingHistory.filter(feeding => {
                        const feedingDate = new Date(feeding.fed_at);
                        feedingDate.setHours(0, 0, 0, 0);
                        return feedingDate.getTime() === today.getTime();
                    });
                    
                    dashboardElements.feedingsCount.textContent = todayFeedings.length.toString();
                }
                
                // Update recent history list
                updateRecentHistoryList(feedingHistory);
                
                return feedingHistory;
            } else {
                throw error;
            }
        }
        
        // Store feeding history data globally
        feedingHistory = data || [];
        
        // Update feedings count for today
        if (dashboardElements.feedingsCount) {
            // Filter for today's feedings
            const todayFeedings = feedingHistory.filter(feeding => {
                const feedingDate = new Date(feeding.fed_at);
                feedingDate.setHours(0, 0, 0, 0);
                return feedingDate.getTime() === today.getTime();
            });
            
            dashboardElements.feedingsCount.textContent = todayFeedings.length.toString();
        }
        
        // Update recent history list
        updateRecentHistoryList(feedingHistory);
        
        return feedingHistory;
    } catch (error) {
        console.error('Error loading feeding history:', error);
        // Show error toast if available
        if (window.app && window.app.showToast) {
            window.app.showToast('Failed to load feeding history', 'error');
        }
        throw error;
    }
}

/**
 * Initialize UI elements and event listeners
 */
function initializeUI() {
    // Initialize event listeners for feed now modal
    const feedNowModal = document.getElementById('feed-now-modal');
    const feedNowForm = document.getElementById('feed-now-form');
    const cancelFeedBtn = document.getElementById('cancel-feed');
    const feedPortionSelect = document.getElementById('feed-portion');
    const customPortionDiv = document.querySelector('.custom-portion');
    
    if (feedNowModal && cancelFeedBtn) {
        // Close modal when cancel button is clicked
        cancelFeedBtn.addEventListener('click', () => {
            feedNowModal.classList.remove('open');
        });
        
        // Close modal when clicking outside
        feedNowModal.addEventListener('click', (e) => {
            if (e.target === feedNowModal) {
                feedNowModal.classList.remove('open');
            }
        });
        
        // Close modal when ESC key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && feedNowModal.classList.contains('open')) {
                feedNowModal.classList.remove('open');
            }
        });
    }
    
    if (feedPortionSelect && customPortionDiv) {
        // Show/hide custom portion input based on selection
        feedPortionSelect.addEventListener('change', () => {
            customPortionDiv.style.display = feedPortionSelect.value === 'custom' ? 'block' : 'none';
        });
    }
    
    if (feedNowForm) {
        // Handle feed now form submission
        feedNowForm.addEventListener('submit', handleFeedNowSubmit);
    }
    
    // Initialize any tooltips
    initializeTooltips();
    
    // Initialize any tabs in the dashboard
    initializeTabs();
    
    console.log('UI components initialized');
}

/**
 * Initialize tooltips across the dashboard
 */
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', () => {
            const tooltipText = tooltip.getAttribute('data-tooltip');
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.textContent = tooltipText;
            
            document.body.appendChild(tooltipEl);
            
            const rect = tooltip.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();
            
            tooltipEl.style.left = rect.left + (rect.width / 2) - (tooltipRect.width / 2) + 'px';
            tooltipEl.style.top = rect.top - tooltipRect.height - 10 + 'px';
            
            setTimeout(() => {
                tooltipEl.classList.add('visible');
            }, 10);
            
            tooltip.addEventListener('mouseleave', () => {
                tooltipEl.classList.remove('visible');
                
                setTimeout(() => {
                    if (tooltipEl.parentNode) {
                        tooltipEl.parentNode.removeChild(tooltipEl);
                    }
                }, 200);
            });
        });
    });
}

/**
 * Initialize any tabs in the dashboard
 */
function initializeTabs() {
    const tabContainers = document.querySelectorAll('.tabs-container');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanes = container.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to current button and pane
                button.classList.add('active');
                container.querySelector(`.tab-pane[data-tab="${tabId}"]`).classList.add('active');
            });
        });
    });
}

// Handle feed now form submission
async function handleFeedNowSubmit(event) {
    // ...existing code...
}

// Update device status cards
function updateDeviceStatusCards(devices) {
    // ...existing code...
}

// Create a device card element
function createDeviceCard(device) {
    // ...existing code...
}

// Format date for display
function formatDate(dateString) {
    // ...existing code...
}

// Update upcoming feedings list
function updateUpcomingFeedingsList(schedules) {
    // ...existing code...
}

// Update recent history list
function updateRecentHistoryList(feedings) {
    // ...existing code...
}

// Initialize charts
function initializeCharts() {
    // ...existing code...
}

// Update charts with real data
function updateCharts() {
    // ...existing code...
}

// Function to handle feed now button click
function openFeedNowModal(deviceId) {
    // ...existing code...
}

// Load pets for the feed now modal
async function loadPetsForFeedNow() {
    // ...existing code...
}

// Initialize header elements
function initializeHeader() {
    // ...existing code...
}

// Set up notification system
function initializeNotifications() {
    // ...existing code...
}

// Add all dashboard event listeners
function addDashboardEventListeners() {
    // ...existing code...
}

// Initialize dashboard when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-container')) {
        initDashboard();
    }
});