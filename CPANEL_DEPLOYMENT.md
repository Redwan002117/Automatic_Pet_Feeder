# cPanel Deployment Guide for Automatic Pet Feeder

This guide will help you deploy the Automatic Pet Feeder application on a cPanel hosting environment.

## Prerequisites

- A cPanel hosting account
- FTP access to your hosting account (or cPanel File Manager)
- A domain or subdomain to host the application

## Deployment Steps

### 1. Prepare Your Files

Before uploading to cPanel, ensure your project is properly prepared:

- The `.htaccess` file is in the `public` directory
- The `api.php` and `api-wrapper.php` files are in the `public` directory
- The `.env.php` file is properly configured with your production credentials
- All frontend files are in the `public` directory

### 2. Upload Files to cPanel

1. Log in to your cPanel account
2. Navigate to the File Manager
3. Go to the public_html directory (or the directory for your specific domain/subdomain)
4. Upload the contents of the `public` directory to this location
   - You can use the File Manager's upload feature or FTP
   - Make sure to maintain the directory structure

### 3. Configure Environment Variables

The application needs access to environment variables, particularly Supabase credentials. In a cPanel environment, there are three ways to set up these variables:

#### Option 1: Using .env.php file (Recommended)

1. **Create the .env.php file**:
   - If it doesn't already exist, create a file named `.env.php` in the root of your uploaded files
   - This file should contain your production environment variables

2. **Add the following content**:

```php
<?php
/**
 * Environment Variables for Automatic Pet Feeder
 * 
 * This file provides environment variables for the application when deployed on cPanel
 */

// Supabase configuration
$_ENV['SUPABASE_URL'] = 'https://your-project-id.supabase.co';
$_ENV['SUPABASE_ANON_KEY'] = 'your-supabase-anon-key';
$_ENV['APP_VERSION'] = '1.0.0';
$_ENV['APP_NAME'] = 'Automatic Pet Feeder';

// Make environment variables available in the global scope
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}
```

#### Option 2: Using cPanel's Custom PHP INI

1. In cPanel, go to Software > MultiPHP INI Editor
2. Select your domain
3. Add the following lines to the directive:

```
env[SUPABASE_URL] = https://your-project-id.supabase.co
env[SUPABASE_ANON_KEY] = your-supabase-anon-key
env[APP_VERSION] = 1.0.0
env[APP_NAME] = Automatic Pet Feeder
```

#### Option 3: Using production-config.js

If you're unable to set environment variables, you can use the provided production configuration file:

1. Locate the `production-config.js` file in your project
2. Update it with your production Supabase URL and key values
3. Upload it to your cPanel hosting
4. Rename it to `config.js` (replacing the existing config.js file)

```javascript
// Example of production-config.js with your values
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### 4. Configure PHP Settings

1. **PHP Version**:
   - In cPanel, go to Software > MultiPHP Manager
   - Select PHP version 7.4 or higher for your domain
   - Click 'Apply'

2. **PHP Extensions**:
   - In cPanel, go to Software > Select PHP Version
   - Ensure these extensions are enabled:
     - curl
     - json
     - mbstring
     - openssl
     - pdo_mysql (if using database features)
   - Click 'Save' after enabling the required extensions

3. **PHP Configuration**:
   - In cPanel, go to Software > MultiPHP INI Editor
   - Select your domain
   - Recommended settings:
     ```
     memory_limit = 128M
     upload_max_filesize = 10M
     post_max_size = 10M
     max_execution_time = 30
     display_errors = Off (for production)
     ```
   - Click 'Apply' to save changes

4. **File Permissions**:
   - Set the correct permissions for your files:
     - Directories: 755 (drwxr-xr-x)
     - Files: 644 (-rw-r--r--)
   - You can set these using File Manager (Right-click > Change Permissions)
   - Special case: `.env.php` may need 600 permissions for security

### 5. Configure Cloudflare Turnstile (Captcha)

The application uses Cloudflare Turnstile for captcha protection. Make sure the domain you're hosting on is allowed in your Cloudflare Turnstile settings.

### 6. Test the Application

1. Navigate to your domain in a web browser
2. Verify that the application loads correctly
3. Test the authentication functionality
4. Test the Supabase integration

### 7. Troubleshooting

If you encounter issues:

#### Common Issues

1. **404 Not Found Errors**: 
   - Ensure the `.htaccess` file is properly uploaded and that your hosting supports mod_rewrite
   - Check if mod_rewrite is enabled in your cPanel (Software > Select PHP Version > Extensions)
   - If using a subdirectory, make sure the RewriteBase in .htaccess is set correctly

2. **API Connection Issues**: 
   - Check that the Supabase URL and key are correctly set in your environment variables or config.js file
   - Verify that the api.php and api-wrapper.php files are properly uploaded and have the correct permissions
   - Test the API endpoint directly by visiting yourdomain.com/api/health
   - If API calls fail, try uncommenting the alternative API routing in .htaccess
   - Check that .env.php is accessible and has the correct permissions

3. **Captcha Not Working**: 
   - Verify that your domain is allowed in Cloudflare Turnstile settings
   - Check browser console for any CORS errors

4. **Blank Page**: 
   - Check the browser console for JavaScript errors
   - Enable PHP error display temporarily for debugging (in .env.php add: `ini_set('display_errors', 1);`)
   - Verify all required files were uploaded correctly

5. **Authentication Issues**:
   - Clear browser cookies and cache
   - Ensure Supabase is properly configured to allow authentication from your domain
   - Check that the redirect URLs in Supabase project settings include your domain

#### Checking Error Logs

1. In cPanel, go to Metrics > Error Log
2. Review the logs for any PHP or server errors
3. You can also add custom logging to api.php for debugging:```php
error_log('Debug message', 0);
```

## Additional Configuration

### Configuring Supabase for Production

When deploying to production, you need to configure Supabase to work with your domain:

1. **Update Site URL in Supabase**:
   - Log in to your Supabase dashboard
   - Go to Authentication > URL Configuration
   - Add your production domain to the Site URL list
   - Add your domain to the Redirect URLs (e.g., https://yourdomain.com/login.html)

2. **CORS Configuration**:
   - In Supabase dashboard, go to API Settings > CORS
   - Add your domain to the allowed origins (e.g., https://yourdomain.com)

3. **Test Authentication Flow**:
   - After deployment, test the login and signup functionality
   - Verify that redirects work correctly

### Setting Up a Subdomain

If you want to host the application on a subdomain:

1. In cPanel, go to Domains > Subdomains
2. Create a new subdomain (e.g., petfeeder.yourdomain.com)
3. Upload the application files to the subdomain's directory

### Enabling HTTPS

For security, especially with authentication features, enable HTTPS:

1. In cPanel, go to Security > SSL/TLS
2. Install an SSL certificate for your domain
3. Enable Force HTTPS Redirect in the .htaccess file

## Maintenance

### Updating the Application

To update the application:

1. Backup your current files
2. Download the latest version of the application
3. Before uploading, preserve these configuration files:
   - `.env.php` (if using)
   - `.htaccess` (if customized)
   - `scripts/config.js` (if manually configured)
4. Upload the new files to your cPanel hosting
5. Restore your preserved configuration files if needed
6. Test the application thoroughly after updating
7. Clear browser cache to ensure users get the latest version

### Backup

1. **Regular Backups**:
   - Use cPanel's Backup feature to create full or partial backups
   - Go to cPanel > Backup > Download a Full Account Backup
   - Or use cPanel > Backup Wizard for more options

2. **Database Backups**:
   - Regularly export your Supabase data using their dashboard
   - Store backups in a secure location

3. **Automated Backups**:
   - Consider setting up automated backups using cPanel's Backup Configuration
   - Or use a third-party backup service compatible with cPanel

## Support

If you need further assistance, please contact support at support@petfeeder.redwancodes.com.