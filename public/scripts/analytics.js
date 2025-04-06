/**
 * Analytics script for Automatic Pet Feeder
 */

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    checkAuth();
    
    // Set up filter form event listeners
    const filterForm = document.getElementById('analytics-filters');
    if (filterForm) {
        filterForm.addEventListener('submit', handleFilterSubmit);
        
        // Add change event listeners to date inputs
        document.getElementById('start-date').addEventListener('change', updateEndDateMin);
        
        // Set default date range (last 30 days)
        setDefaultDateRange();
    }
    
    // Listen for export button clicks
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAnalyticsData);
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
    
    await loadUserData();
    loadAnalyticsData();
}

// Load user data (pets and devices)
async function loadUserData() {
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Load pets for pet filter
    const { data: pets, error: petsError } = await window.supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id);
    
    if (petsError) {
        console.error('Error loading pets:', petsError);
        return;
    }
    
    // Load devices for device filter
    const { data: devices, error: devicesError } = await window.supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);
    
    if (devicesError) {
        console.error('Error loading devices:', devicesError);
        return;
    }
    
    // Populate filter dropdowns
    populateFilterDropdowns(pets, devices);
}

// Populate filter dropdowns with user's pets and devices
function populateFilterDropdowns(pets, devices) {
    const petSelect = document.getElementById('pet-filter');
    const deviceSelect = document.getElementById('device-filter');
    
    // Clear existing options except "All" option
    while (petSelect.options.length > 1) {
        petSelect.remove(1);
    }
    
    while (deviceSelect.options.length > 1) {
        deviceSelect.remove(1);
    }
    
    // Add pets to select
    pets.forEach(pet => {
        const option = document.createElement('option');
        option.value = pet.id;
        option.textContent = pet.name;
        petSelect.appendChild(option);
    });
    
    // Add devices to select
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = device.name;
        deviceSelect.appendChild(option);
    });
}

// Set default date range (last 30 days)
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('start-date').valueAsDate = startDate;
    document.getElementById('end-date').valueAsDate = endDate;
    
    // Set min and max dates
    document.getElementById('end-date').min = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').max = endDate.toISOString().split('T')[0];
}

// Update end date min attribute when start date changes
function updateEndDateMin() {
    const startDate = document.getElementById('start-date').value;
    document.getElementById('end-date').min = startDate;
    
    // If end date is before start date, update it
    const endDateInput = document.getElementById('end-date');
    if (endDateInput.value < startDate) {
        endDateInput.value = startDate;
    }
}

// Handle filter form submission
function handleFilterSubmit(e) {
    e.preventDefault();
    loadAnalyticsData();
}

// Load analytics data based on filters
async function loadAnalyticsData() {
    showLoading('.analytics-container');
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Get filter values
    const petId = document.getElementById('pet-filter').value;
    const deviceId = document.getElementById('device-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const groupBy = document.getElementById('group-by').value;
    
    // Base query for feeding history
    let query = window.supabase
        .from('feeding_history')
        .select(`
            id,
            device_id,
            feeding_time,
            amount,
            method,
            devices(name),
            pets(id, name)
        `)
        .eq('user_id', user.id)
        .gte('feeding_time', `${startDate}T00:00:00`)
        .lte('feeding_time', `${endDate}T23:59:59`)
        .order('feeding_time', { ascending: false });
    
    // Add pet filter if selected
    if (petId !== 'all') {
        query = query.eq('pets.id', petId);
    }
    
    // Add device filter if selected
    if (deviceId !== 'all') {
        query = query.eq('device_id', deviceId);
    }
    
    // Execute query
    const { data: feedingHistory, error } = await query;
    
    hideLoading('.analytics-container');
    
    if (error) {
        console.error('Error loading feeding history:', error);
        showError('.analytics-container', 'Failed to load analytics data');
        return;
    }
    
    // Process and display the data
    processAnalyticsData(feedingHistory, groupBy);
}

// Process and display analytics data
function processAnalyticsData(feedingHistory, groupBy) {
    if (feedingHistory.length === 0) {
        document.querySelector('.analytics-container').innerHTML = 
            '<div class="no-data"><i class="fas fa-chart-bar"></i><p>No feeding data found for the selected filters</p></div>';
        return;
    }
    
    // Calculate summary statistics
    const totalFeedings = feedingHistory.length;
    const totalAmount = feedingHistory.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const avgAmountPerFeeding = totalAmount / totalFeedings;
    
    // Count by method
    const methodCounts = feedingHistory.reduce((acc, item) => {
        acc[item.method] = (acc[item.method] || 0) + 1;
        return acc;
    }, {});
    
    // Update summary cards
    updateSummaryCards(totalFeedings, totalAmount, avgAmountPerFeeding, methodCounts);
    
    // Generate data for charts based on group by option
    let chartData;
    switch (groupBy) {
        case 'day':
            chartData = groupDataByDay(feedingHistory);
            break;
        case 'week':
            chartData = groupDataByWeek(feedingHistory);
            break;
        case 'month':
            chartData = groupDataByMonth(feedingHistory);
            break;
        case 'pet':
            chartData = groupDataByPet(feedingHistory);
            break;
        case 'device':
            chartData = groupDataByDevice(feedingHistory);
            break;
        default:
            chartData = groupDataByDay(feedingHistory);
    }
    
    // Render charts
    renderFeedingFrequencyChart(chartData);
    renderFeedingAmountChart(chartData);
    
    // Render feeding history table
    renderFeedingHistoryTable(feedingHistory);
}

// Update summary cards with analytics data
function updateSummaryCards(totalFeedings, totalAmount, avgAmountPerFeeding, methodCounts) {
    document.getElementById('total-feedings').textContent = totalFeedings;
    document.getElementById('total-amount').textContent = totalAmount.toFixed(2) + ' portions';
    document.getElementById('avg-amount').textContent = avgAmountPerFeeding.toFixed(2) + ' portions';
    
    // Calculate percentages for methods
    const methodPercentages = {};
    Object.keys(methodCounts).forEach(method => {
        methodPercentages[method] = (methodCounts[method] / totalFeedings * 100).toFixed(1) + '%';
    });
    
    // Update method breakdown
    const methodBreakdown = document.getElementById('method-breakdown');
    methodBreakdown.innerHTML = '';
    
    Object.keys(methodCounts).forEach(method => {
        const methodItem = document.createElement('div');
        methodItem.className = 'method-item';
        methodItem.innerHTML = `
            <span class="method-name">${method.charAt(0).toUpperCase() + method.slice(1)}:</span>
            <span class="method-count">${methodCounts[method]} (${methodPercentages[method]})</span>
        `;
        methodBreakdown.appendChild(methodItem);
    });
}

// Group data by day for charts
function groupDataByDay(feedingHistory) {
    const grouped = {};
    
    feedingHistory.forEach(item => {
        const date = item.feeding_time.split('T')[0];
        
        if (!grouped[date]) {
            grouped[date] = {
                count: 0,
                amount: 0
            };
        }
        
        grouped[date].count += 1;
        grouped[date].amount += parseFloat(item.amount);
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    
    return {
        labels: sortedDates,
        counts: sortedDates.map(date => grouped[date].count),
        amounts: sortedDates.map(date => grouped[date].amount)
    };
}

// Group data by week for charts
function groupDataByWeek(feedingHistory) {
    const grouped = {};
    
    feedingHistory.forEach(item => {
        const date = new Date(item.feeding_time);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!grouped[weekKey]) {
            grouped[weekKey] = {
                count: 0,
                amount: 0,
                label: `Week of ${weekStart.toLocaleDateString()}`
            };
        }
        
        grouped[weekKey].count += 1;
        grouped[weekKey].amount += parseFloat(item.amount);
    });
    
    // Sort weeks
    const sortedWeeks = Object.keys(grouped).sort();
    
    return {
        labels: sortedWeeks.map(week => grouped[week].label),
        counts: sortedWeeks.map(week => grouped[week].count),
        amounts: sortedWeeks.map(week => grouped[week].amount)
    };
}

// Group data by month for charts
function groupDataByMonth(feedingHistory) {
    const grouped = {};
    
    feedingHistory.forEach(item => {
        const date = new Date(item.feeding_time);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                count: 0,
                amount: 0,
                label: monthName
            };
        }
        
        grouped[monthKey].count += 1;
        grouped[monthKey].amount += parseFloat(item.amount);
    });
    
    // Sort months
    const sortedMonths = Object.keys(grouped).sort();
    
    return {
        labels: sortedMonths.map(month => grouped[month].label),
        counts: sortedMonths.map(month => grouped[month].count),
        amounts: sortedMonths.map(month => grouped[month].amount)
    };
}

// Group data by pet for charts
function groupDataByPet(feedingHistory) {
    const grouped = {};
    
    feedingHistory.forEach(item => {
        if (!item.pets) return;
        
        const petId = item.pets.id;
        const petName = item.pets.name;
        
        if (!grouped[petId]) {
            grouped[petId] = {
                count: 0,
                amount: 0,
                label: petName
            };
        }
        
        grouped[petId].count += 1;
        grouped[petId].amount += parseFloat(item.amount);
    });
    
    const petIds = Object.keys(grouped);
    
    return {
        labels: petIds.map(id => grouped[id].label),
        counts: petIds.map(id => grouped[id].count),
        amounts: petIds.map(id => grouped[id].amount)
    };
}

// Group data by device for charts
function groupDataByDevice(feedingHistory) {
    const grouped = {};
    
    feedingHistory.forEach(item => {
        const deviceId = item.device_id;
        const deviceName = item.devices?.name || 'Unknown Device';
        
        if (!grouped[deviceId]) {
            grouped[deviceId] = {
                count: 0,
                amount: 0,
                label: deviceName
            };
        }
        
        grouped[deviceId].count += 1;
        grouped[deviceId].amount += parseFloat(item.amount);
    });
    
    const deviceIds = Object.keys(grouped);
    
    return {
        labels: deviceIds.map(id => grouped[id].label),
        counts: deviceIds.map(id => grouped[id].count),
        amounts: deviceIds.map(id => grouped[id].amount)
    };
}

// Render feeding frequency chart
function renderFeedingFrequencyChart(data) {
    const ctx = document.getElementById('feedingFrequencyChart').getContext('2d');
    
    // iOS-style gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(54, 162, 235, 0.8)');
    gradient.addColorStop(1, 'rgba(54, 162, 235, 0.2)');
    
    // Font settings for iOS-like appearance
    Chart.defaults.font.family = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    Chart.defaults.font.size = 12;
    
    window.feedingFrequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Feedings',
                data: data.counts,
                backgroundColor: gradient,
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(0, 122, 255, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#8E8E93',
                        padding: 10
                    },
                    grid: {
                        display: true,
                        color: 'rgba(200, 200, 200, 0.2)',
                        borderDash: [5, 5]
                    }
                },
                x: {
                    ticks: {
                        color: '#8E8E93',
                        padding: 10
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 15,
                        usePointStyle: true,
                        padding: 20,
                        color: '#1D1D1F'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1D1D1F',
                    bodyColor: '#1D1D1F',
                    borderColor: 'rgba(200, 200, 200, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Feedings: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Render feeding amount chart
function renderFeedingAmountChart(data) {
    const ctx = document.getElementById('feeding-amount-chart').getContext('2d');
    
    // Destroy previous chart if exists
    if (window.feedingAmountChart) {
        window.feedingAmountChart.destroy();
    }
    
    window.feedingAmountChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Portions',
                data: data.amounts,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} portions`;
                        }
                    }
                }
            }
        }
    });
}

// Render feeding history table
function renderFeedingHistoryTable(feedingHistory) {
    const tableBody = document.querySelector('.feeding-history-table tbody');
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    // Add data rows
    feedingHistory.forEach(item => {
        const row = document.createElement('tr');
        
        const date = new Date(item.feeding_time);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${item.devices?.name || 'Unknown'}</td>
            <td>${item.pets?.name || 'Not assigned'}</td>
            <td>${item.amount} portions</td>
            <td><span class="method-badge method-${item.method}">${item.method}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update table pagination
    updateTablePagination(feedingHistory.length);
}

// Update table pagination
function updateTablePagination(totalItems) {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const paginationElement = document.querySelector('.table-pagination');
    paginationElement.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = true;
    paginationElement.appendChild(prevButton);
    
    // Page buttons (show max 5 pages)
    const maxVisiblePages = 5;
    const startPage = 1;
    const endPage = Math.min(totalPages, maxVisiblePages);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn page-num' + (i === 1 ? ' active' : '');
        pageButton.textContent = i;
        pageButton.dataset.page = i;
        paginationElement.appendChild(pageButton);
    }
    
    // Show ellipsis if more pages
    if (totalPages > maxVisiblePages) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationElement.appendChild(ellipsis);
        
        // Show last page
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'pagination-btn page-num';
        lastPageButton.textContent = totalPages;
        lastPageButton.dataset.page = totalPages;
        paginationElement.appendChild(lastPageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = totalPages === 1;
    paginationElement.appendChild(nextButton);
    
    // Add event listeners for pagination
    paginationElement.addEventListener('click', handlePaginationClick);
}

// Handle pagination button clicks
function handlePaginationClick(e) {
    if (!e.target.classList.contains('pagination-btn') || e.target.disabled) {
        return;
    }
    
    const tableRows = document.querySelectorAll('.feeding-history-table tbody tr');
    const itemsPerPage = 10;
    const totalPages = Math.ceil(tableRows.length / itemsPerPage);
    
    let currentPage = 1;
    const activeButton = document.querySelector('.pagination-btn.page-num.active');
    if (activeButton) {
        currentPage = parseInt(activeButton.dataset.page, 10);
    }
    
    let newPage = currentPage;
    
    if (e.target.classList.contains('prev')) {
        newPage = Math.max(1, currentPage - 1);
    } else if (e.target.classList.contains('next')) {
        newPage = Math.min(totalPages, currentPage + 1);
    } else if (e.target.classList.contains('page-num')) {
        newPage = parseInt(e.target.dataset.page, 10);
    }
    
    if (newPage === currentPage) {
        return;
    }
    
    // Update active page button
    const allPageButtons = document.querySelectorAll('.pagination-btn.page-num');
    allPageButtons.forEach(button => {
        button.classList.toggle('active', parseInt(button.dataset.page, 10) === newPage);
    });
    
    // Update prev/next button states
    document.querySelector('.pagination-btn.prev').disabled = newPage === 1;
    document.querySelector('.pagination-btn.next').disabled = newPage === totalPages;
    
    // Show relevant rows
    const startIdx = (newPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    tableRows.forEach((row, index) => {
        row.style.display = (index >= startIdx && index < endIdx) ? '' : 'none';
    });
}

// Export analytics data as CSV
function exportAnalyticsData() {
    const tableRows = document.querySelectorAll('.feeding-history-table tbody tr');
    
    if (tableRows.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Time,Device,Pet,Amount,Method\n';
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => {
            // Clean data for CSV (remove any commas and wrap in quotes)
            return `"${cell.textContent.trim().replace(/"/g, '""')}"`;
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set file name with current date
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `feeding-history-${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Feeding history exported successfully', 'success');
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

// Initialize analytics enhancements
function initAnalytics() {
    // Set up event listeners
    const filterForm = document.querySelector('.filter-form');
    const dateRange = document.getElementById('date-range');
    const dateInputs = document.querySelector('.date-inputs');
    
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            if (this.value === 'custom') {
                dateInputs.style.display = 'flex';
                dateInputs.classList.add('ios-animate');
            } else {
                dateInputs.style.display = 'none';
            }
        });
    }
    
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading animation
            const loadingEl = document.createElement('div');
            loadingEl.className = 'loading-indicator';
            loadingEl.innerHTML = '<div class="spinner"></div>';
            document.querySelector('.content-body').appendChild(loadingEl);
            
            // Simulate API call
            setTimeout(() => {
                loadingEl.remove();
                refreshCharts();
            }, 800);
        });
    }
    
    // Initialize all charts with sample data
    initCharts();
}

function initCharts() {
    // Sample data for feeding frequency
    const frequencyData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        counts: [4, 5, 3, 5, 4, 3, 6]
    };
    
    renderFeedingFrequencyChart(frequencyData);
    
    // Initialize other charts...
}

function refreshCharts() {
    // Refresh with simulated new data
    if (window.feedingFrequencyChart) {
        const newData = [3, 6, 4, 5, 3, 4, 5];
        window.feedingFrequencyChart.data.datasets[0].data = newData;
        window.feedingFrequencyChart.update();
    }
    
    // Refresh other charts...
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAnalytics);