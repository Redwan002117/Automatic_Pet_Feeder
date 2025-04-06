/**
 * Sidebar Navigation Control
 * 
 * This script handles the sidebar navigation functionality including:
 * - Toggling the sidebar open/closed on mobile
 * - Collapsing/expanding the sidebar in desktop view
 * - Highlighting the current active page
 * - Handling the logout functionality
 * - Showing/hiding admin sections based on user role
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const mainContent = document.querySelector('.main-content');
    const logoutButton = document.getElementById('sidebar-logout');
    const adminSection = document.getElementById('admin-section');
    const collapseToggle = document.getElementById('collapse-toggle');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    // Toggle sidebar on mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when sidebar is open
            if (mainContent) mainContent.classList.add('sidebar-open');
        });
    }
    
    // Mobile menu toggle (alternative trigger for mobile)
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
            if (mainContent) mainContent.classList.add('sidebar-open');
        });
    }
    
    // Close sidebar
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking outside
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }
    
    // Handle escape key to close sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        if (mainContent) mainContent.classList.remove('sidebar-open');
    }
    
    // Toggle sidebar collapse in desktop view
    if (collapseToggle) {
        collapseToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                // Add a small delay to let transitions complete
                setTimeout(() => {
                    // Trigger a resize event for charts to redraw
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            }
            
            // Save preference to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        // Check for saved preference
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
    
    // Highlight current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Check if the href matches the current page
        // or if we're on index.html/dashboard.html and the link is to one of them
        if (href && (href.includes(currentPage) || 
            ((currentPage === 'index.html' || currentPage === 'dashboard.html') && 
             (href.includes('index.html') || href.includes('dashboard.html'))))) {
            link.classList.add('active');
        }
    });
    
    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error signing out:', error.message);
                showToast('Error signing out. Please try again.', 'error');
            }
        });
    }
    
    // Check user role and display admin section if admin
    checkUserRole();
    
    async function checkUserRole() {
        // Hide admin section by default
        if (adminSection) {
            adminSection.style.display = 'none';
        }
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            // Get user's profile to check role
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
                
            if (error) throw error;
            
            // Show admin section if user is an admin
            if (profile && profile.role === 'admin' && adminSection) {
                adminSection.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error checking user role:', error.message);
        }
    }
    
    // Fix for iOS Safari overscroll issues
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const scrollElements = document.querySelectorAll('.sidebar, .main-content');
        scrollElements.forEach(element => {
            element.classList.add('ios-scrolling-fix');
        });
    }
});

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    // Check if the toast function exists (from ui-helper.js)
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // Fallback if toast function is not available
        console.log(`${type}: ${message}`);
        alert(message);
    }
}