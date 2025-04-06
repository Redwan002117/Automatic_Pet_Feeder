# Deployment Checklist for Automatic Pet Feeder

Use this checklist to ensure you've completed all necessary steps for deploying the Automatic Pet Feeder application to cPanel.

## Pre-Deployment

- [ ] Verify all files in the `public` directory are ready for production
- [ ] Ensure `.htaccess` file is properly configured
- [ ] Update Supabase configuration for production environment
- [ ] Test application locally before deployment

## cPanel Setup

- [ ] Set up domain or subdomain in cPanel
- [ ] Configure PHP version (7.4 or higher)
- [ ] Enable required PHP extensions (curl, json, mbstring, openssl)

## File Upload

- [ ] Upload all files from the `public` directory to the appropriate location in cPanel
- [ ] Verify `.htaccess` file was uploaded correctly (not skipped)
- [ ] Verify `api.php` file was uploaded correctly
- [ ] Set correct file permissions (directories: 755, files: 644)

## Environment Configuration

- [ ] Create `.env.php` file with production environment variables
- [ ] OR configure environment variables in cPanel's PHP INI
- [ ] OR update `config.js` with production values

## Supabase Configuration

- [ ] Update Site URL in Supabase Authentication settings
- [ ] Add production domain to Redirect URLs in Supabase
- [ ] Configure CORS settings in Supabase to allow your domain

## Security

- [ ] Enable HTTPS for your domain
- [ ] Verify security headers are working
- [ ] Configure Cloudflare Turnstile for your domain

## Testing

- [ ] Test application loading
- [ ] Test authentication (login, signup, password reset)
- [ ] Test API endpoints
- [ ] Test device management features
- [ ] Test scheduling features
- [ ] Verify all assets (images, styles) load correctly

## Post-Deployment

- [ ] Set up regular backups
- [ ] Monitor error logs for any issues
- [ ] Test on multiple devices and browsers

## Notes

Use this space to document any specific configurations or issues encountered during deployment:

```

```