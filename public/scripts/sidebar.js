/**
 * Sidebar Navigation Control
 * 
 * This script handles the sidebar navigation functionality including:
 * - Toggling the sidebar open/closed on mobile
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
    
    // Toggle sidebar on mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarBackdrop.classList.add('visible');
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
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('visible');
        if (mainContent) mainContent.classList.remove('sidebar-open');
    }
    
    // Highlight current page
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
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
                alert('Error signing out. Please try again.');
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
});