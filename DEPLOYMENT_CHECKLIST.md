# cPanel Git Version Control Deployment Checklist

Use this checklist to ensure your Automatic Pet Feeder application deploys correctly on cPanel with Git Version Control.

## Before Deployment

- [ ] Ensure your Supabase project settings are configured correctly:
  - [ ] Site URL in Supabase Authentication settings includes your production domain
  - [ ] Redirect URLs include your production domain
  - [ ] CORS settings allow your production domain

- [ ] Check that all environment configurations are present:
  - [ ] `.env.php` file contains correct Supabase credentials
  - [ ] `production-config.js` has been updated with the correct values
  - [ ] `config.js` does not contain development-only settings

- [ ] Verify file permissions:
  - [ ] All PHP files have 644 permissions
  - [ ] All directories have 755 permissions

## During Deployment

- [ ] When setting up Git Version Control in cPanel:
  - [ ] Choose "Clone a Repository" option
  - [ ] Enter your repository URL
  - [ ] Use the main/master branch
  - [ ] Set the deployment path to public_html (or your desired subdomain)
  - [ ] Enable automatic deployment if desired

- [ ] After initial deployment:
  - [ ] Check that `.htaccess` file was properly deployed
  - [ ] Verify that `api.php` and other PHP files were deployed
  - [ ] Check that all directories and files are in the correct structure

## After Deployment

- [ ] Test your application functionality:
  - [ ] Test the API connection using `/api-connection-test.php`
  - [ ] Test authentication (login, signup, password reset)
  - [ ] Verify that Supabase integration is working
  - [ ] Test CORS functionality (frontend can connect to Supabase)

- [ ] If issues occur:
  - [ ] Check cPanel error logs for PHP errors
  - [ ] Verify environment variables are loaded correctly
  - [ ] Test API endpoints to ensure they are working
  - [ ] Ensure `.htaccess` rules are working properly

## Making Changes

- [ ] When making changes to your local repository:
  - [ ] Use the `scripts/cpanel-git-deploy.sh` script to push changes
  - [ ] Or push changes to your repository and let cPanel auto-deploy
  - [ ] Verify changes appear on your website after deployment

## Troubleshooting Common Issues

1. **Supabase Connection Fails**
   - Check your Supabase URL and key in `.env.php` and `production-config.js`
   - Verify CORS settings in Supabase to allow your domain
   - Check `.htaccess` CORS headers are correctly set

2. **Password Reset Not Working**
   - Verify Supabase Site URL and Redirect URL configuration
   - Check that `reset-confirm.html` is properly handling URL hash parameters
   - Test the password reset flow manually

3. **API Endpoints Not Accessible**
   - Ensure `.htaccess` rewrite rules are configured correctly
   - Check that `api.php` has proper permissions
   - Use `/api-connection-test.php` to test connectivity

4. **Assets Not Loading**
   - Verify all paths are using the correct format (starting with /)
   - Check file permissions for your asset directories
   - Check for console errors in the browser

Remember to update your deployment settings in cPanel if you change your repository URL or branch.