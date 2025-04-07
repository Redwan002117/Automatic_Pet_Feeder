/**
 * Production Configuration for Automatic Pet Feeder
 * 
 * This file contains production-specific configuration settings.
 * Copy this file to config.js when deploying to production.
 */

// Supabase configuration - PRODUCTION VALUES
const SUPABASE_URL = 'https://mgqtlgpcdswfmvgheeff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjUxOTUsImV4cCI6MjA1OTU0MTE5NX0.bIQBXBmi4x1GYjh7nFRZ0vcFb-Rs2yn2hKMROxt5r3w';

// API endpoints
const API_BASE_URL = '/api';

// Device specific settings
const MAX_FEEDING_AMOUNT = 5; // cups
const MIN_FEEDING_AMOUNT = 0.1; // cups
const DEFAULT_FEEDING_AMOUNT = 1; // cups

// UI configuration
const SIDEBAR_WIDTH = '250px';
const SIDEBAR_COLLAPSED_WIDTH = '70px';
const HEADER_HEIGHT = '60px';
const Z_INDEX_DROPDOWN = 100;
const Z_INDEX_FIXED = 1000;
const Z_INDEX_MODAL = 1050;

// iOS style configuration
const IOS_PRIMARY = '#007AFF'; // iOS blue
const IOS_SUCCESS = '#34C759'; // iOS green
const IOS_DANGER = '#FF3B30';  // iOS red
const IOS_WARNING = '#FF9500'; // iOS orange
const IOS_GRAY = '#8E8E93';    // iOS gray
const IOS_LIGHT_GRAY = '#E5E5EA'; // iOS light gray
const IOS_BACKGROUND = '#F2F2F7'; // iOS background
const IOS_CARD_BACKGROUND = '#FFFFFF'; // iOS card background
const IOS_BORDER_RADIUS = '10px';
const IOS_BLUR_EFFECT = 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);';

// Default animation duration
const ANIMATION_DURATION = 300; // ms

// Toast notification duration
const TOAST_DURATION = 4000; // ms

// App version
const APP_VERSION = '1.0.0';

// Make configurations globally available
window.appConfig = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    API_BASE_URL,
    MAX_FEEDING_AMOUNT,
    MIN_FEEDING_AMOUNT,
    DEFAULT_FEEDING_AMOUNT,
    ANIMATION_DURATION,
    TOAST_DURATION,
    APP_VERSION,
    SIDEBAR_WIDTH,
    SIDEBAR_COLLAPSED_WIDTH,
    HEADER_HEIGHT,
    Z_INDEX_DROPDOWN,
    Z_INDEX_FIXED,
    Z_INDEX_MODAL,
    // iOS styles
    IOS_PRIMARY,
    IOS_SUCCESS,
    IOS_DANGER,
    IOS_WARNING,
    IOS_GRAY,
    IOS_LIGHT_GRAY,
    IOS_BACKGROUND,
    IOS_CARD_BACKGROUND,
    IOS_BORDER_RADIUS,
    IOS_BLUR_EFFECT
};