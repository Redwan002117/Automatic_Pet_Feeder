# cPanel Git Conflict Resolution Guide

## The Problem

You're encountering the following error in cPanel Git Version Control:

```
Error: (XID v3626z) "/usr/local/cpanel/3rdparty/bin/git" reported error code "1" when it ended:
error: Your local changes to the following files would be overwritten by merge:
.htaccess public/.htaccess
Please commit your changes or stash them before you merge.
Aborting
```

This error occurs because there are uncommitted changes to the `.htaccess` files on the cPanel server that would be overwritten when trying to merge changes from your GitHub repository.

## Why This Happens

This typically happens when:

1. Changes were made directly to files on the cPanel server (via File Manager or FTP)
2. These changes weren't committed to Git
3. You're now trying to deploy updates from GitHub that modify the same files

## Solutions

You have three main options to resolve this conflict:

### Option 1: Commit the Local Changes (Preserve cPanel Modifications)

This approach saves the modifications made on the cPanel server before pulling from GitHub.

1. Log in to your cPanel account
2. Navigate to **Git™ Version Control**
3. Click on your repository
4. Click **Manage** and then **Terminal**
5. Run the following commands:

```bash
# Check what changes exist
git status

# Add the modified .htaccess files
git add .htaccess public/.htaccess

# Commit the changes
git commit -m "Save local .htaccess modifications from cPanel"

# Now pull from GitHub
git pull origin main
```

If there are conflicts after the pull, you'll need to resolve them manually.

### Option 2: Stash the Local Changes (Temporarily Save Them)

This approach temporarily saves the local changes so you can apply them later.

1. Log in to your cPanel account
2. Navigate to **Git™ Version Control**
3. Click on your repository
4. Click **Manage** and then **Terminal**
5. Run the following commands:

```bash
# Stash the local changes
git stash push -- .htaccess public/.htaccess

# Pull from GitHub
git pull origin main

# Later, if you want to reapply your changes
git stash pop
```

### Option 3: Discard the Local Changes (Use GitHub Version)

If the changes on the cPanel server are no longer needed, you can discard them.

1. Log in to your cPanel account
2. Navigate to **Git™ Version Control**
3. Click on your repository
4. Click **Manage** and then **Terminal**
5. Run the following commands:

```bash
# Discard local changes
git checkout -- .htaccess public/.htaccess

# Pull from GitHub
git pull origin main
```

## Preventing This Issue in the Future

To avoid this issue in the future:

1. **Always make changes through Git**: Instead of modifying files directly on the server, make changes locally, commit them to GitHub, and then deploy to cPanel.

2. **Use the deployment script**: If you need to make emergency changes on the server, use the provided `cpanel-git-deploy.sh` script afterward to commit those changes.

3. **Create a pre-deployment checklist**: Before deploying, check if there are any uncommitted changes on the server that need to be handled.

## Using the Provided Resolution Script

A script has been created to help you resolve this issue more easily. To use it:

1. Upload the `resolve-cpanel-conflict.sh` script to your cPanel server
2. Make it executable: `chmod +x resolve-cpanel-conflict.sh`
3. Run it: `./resolve-cpanel-conflict.sh`
4. Follow the prompts to choose how you want to resolve the conflict

The script will create backups of your .htaccess files before making any changes, so you can always restore them if needed.

## Need Further Assistance?

If you continue to experience issues with Git deployment in cPanel, please contact your hosting provider's support team or refer to the cPanel documentation on Git Version Control.