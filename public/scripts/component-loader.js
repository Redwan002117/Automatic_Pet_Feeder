/**
 * Component Loader Script for Automatic Pet Feeder
 * Handles dynamic loading of reusable components like headers and loading overlays
 */

// Initialize the app namespace if it doesn't exist
window.app = window.app || {};

// Component Loader class
class ComponentLoader {
    constructor() {
        this.componentsLoaded = false;
        this.componentsToLoad = [];
        this.loadPromises = [];
    }

    /**
     * Load a component into a target element
     * @param {string} componentPath - Path to the component HTML file
     * @param {string} targetSelector - CSS selector for the target element
     * @param {Object} options - Additional options (data attributes, etc.)
     * @returns {Promise} - Promise that resolves when the component is loaded
     */
    loadComponent(componentPath, targetSelector, options = {}) {
        const promise = new Promise((resolve, reject) => {
            this.componentsToLoad.push({
                componentPath,
                targetSelector,
                options,
                resolve,
                reject
            });
        });
        
        this.loadPromises.push(promise);
        return promise;
    }

    /**
     * Process all component loading requests
     * @returns {Promise} - Promise that resolves when all components are loaded
     */
    async processComponents() {
        if (this.componentsToLoad.length === 0) {
            return Promise.resolve();
        }

        const requests = this.componentsToLoad.map(item => {
            return fetch(item.componentPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load component from ${item.componentPath}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const target = document.querySelector(item.targetSelector);
                    if (!target) {
                        throw new Error(`Target element not found: ${item.targetSelector}`);
                    }
                    
                    target.innerHTML = html;
                    
                    // Apply any data attributes from options
                    if (item.options && item.options.data) {
                        Object.entries(item.options.data).forEach(([key, value]) => {
                            target.setAttribute(`data-${key}`, value);
                        });
                    }
                    
                    // Execute any initialization code for the component
                    if (item.options && item.options.onLoad && typeof item.options.onLoad === 'function') {
                        item.options.onLoad(target);
                    }
                    
                    item.resolve(target);
                    return target;
                })
                .catch(error => {
                    console.error(`Error loading component ${item.componentPath}:`, error);
                    item.reject(error);
                    return null;
                });
        });

        try {
            const results = await Promise.all(requests);
            this.componentsLoaded = true;
            this.componentsToLoad = [];
            this.loadPromises = [];
            return results;
        } catch (error) {
            console.error('Error loading components:', error);
            throw error;
        }
    }

    /**
     * Initialize page components
     * This is the main method that should be called to load all components on a page
     * @returns {Promise} - Promise that resolves when all components are initialized
     */
    async initializePageComponents() {
        // Load the header component if it exists in the page
        const headerContainer = document.querySelector('#header-container');
        if (headerContainer) {
            // Get the page title from the data attribute, or use document title as fallback
            const pageTitle = headerContainer.getAttribute('data-title') || document.title.split(' - ')[0];
            this.loadComponent('components/header.html', '#header-container', {
                data: { title: pageTitle },
                onLoad: (element) => {
                    // Initialize header-specific functionality
                    if (window.initializeHeader && typeof window.initializeHeader === 'function') {
                        window.initializeHeader();
                    }
                }
            });
        }

        // Load the sidebar component if it exists in the page
        const sidebarContainer = document.querySelector('#sidebar-container');
        if (sidebarContainer) {
            this.loadComponent('components/sidebar.html', '#sidebar-container', {
                onLoad: (element) => {
                    // Initialize sidebar-specific functionality
                    if (window.initializeSidebar && typeof window.initializeSidebar === 'function') {
                        window.initializeSidebar();
                    }
                }
            });
        }

        // Load the loading overlay component
        const loadingContainer = document.querySelector('#loading-container');
        if (loadingContainer) {
            this.loadComponent('components/loading-overlay.html', '#loading-container', {
                onLoad: (element) => {
                    // Store references to loading overlay methods on the app object
                    const overlay = element.querySelector('.loading-overlay');
                    
                    window.app.showLoading = function() {
                        if (overlay) {
                            overlay.style.display = 'flex';
                            setTimeout(() => {
                                overlay.style.opacity = '1';
                            }, 10);
                        }
                    };
                    
                    window.app.hideLoading = function() {
                        if (overlay) {
                            overlay.style.opacity = '0';
                            setTimeout(() => {
                                overlay.style.display = 'none';
                            }, 500);
                        }
                    };
                    
                    // Show loading overlay initially
                    window.app.showLoading();
                }
            });
        }

        // Handle components specified via data-component attribute
        const componentElements = document.querySelectorAll('[data-component]');
        componentElements.forEach(element => {
            const componentName = element.getAttribute('data-component');
            if (componentName) {
                this.loadComponent(`components/${componentName}.html`, `[data-component="${componentName}"]`, {
                    onLoad: (loadedElement) => {
                        // Call component-specific initializer if it exists
                        const initFunctionName = `initialize${componentName.charAt(0).toUpperCase() + componentName.slice(1)}`;
                        if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
                            window[initFunctionName](loadedElement);
                        }
                    }
                });
            }
        });

        // Process all component loading requests
        return this.processComponents();
    }
}

// Create and expose the component loader instance
window.app.componentLoader = new ComponentLoader();

// Initialize components when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Make sure window.app exists and componentLoader is properly initialized
        if (window.app && window.app.componentLoader && typeof window.app.componentLoader.initializePageComponents === 'function') {
            await window.app.componentLoader.initializePageComponents();
            console.log('Components loaded successfully');
        } else {
            console.error('Component loader not properly initialized');
        }
    } catch (error) {
        console.error('Failed to initialize components:', error);
    }
});