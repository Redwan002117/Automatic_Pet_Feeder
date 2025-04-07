#!/bin/bash

# Script to resolve Git merge conflicts in cPanel Git Version Control
# This script should be run on the cPanel server via SSH

# Set variables
REPO_DIR="/home/username/public_html"
BRANCH="main"

# Display header
echo "===== cPanel Git Conflict Resolution Script ====="
echo "This script will help resolve Git merge conflicts in cPanel"
echo "Specifically for .htaccess files that have local changes"
echo ""

# Navigate to repository directory
echo "1. Changing to repository directory: $REPO_DIR"
cd $REPO_DIR || {
    echo "Error: Could not change to repository directory $REPO_DIR"
    echo "Please update the REPO_DIR variable in this script with your correct path"
    exit 1
}

# Check Git status
echo "2. Checking Git status..."
git status

# Backup the conflicting files
echo "\n3. Creating backup of .htaccess files..."
cp -f .htaccess .htaccess.backup
cp -f public/.htaccess public/.htaccess.backup
echo "   Backups created: .htaccess.backup and public/.htaccess.backup"

# Prompt user for action
echo "\n4. Choose an action to resolve the conflict:"
echo "   1) Commit local changes (preserves your cPanel modifications)"
echo "   2) Stash local changes (temporarily saves them)"
echo "   3) Discard local changes (use GitHub version)"
read -p "   Enter your choice (1-3): " choice

case $choice in
    1)
        echo "\n5. Committing local changes..."
        git add .htaccess public/.htaccess
        git commit -m "Save local .htaccess modifications from cPanel"
        echo "   Local changes committed. Now attempting to pull from GitHub..."
        git pull origin $BRANCH
        ;;
    2)
        echo "\n5. Stashing local changes..."
        git stash push -- .htaccess public/.htaccess
        echo "   Local changes stashed. Now attempting to pull from GitHub..."
        git pull origin $BRANCH
        echo "\n6. To restore your stashed changes later, run: git stash pop"
        ;;
    3)
        echo "\n5. Discarding local changes..."
        git checkout -- .htaccess public/.htaccess
        echo "   Local changes discarded. Now attempting to pull from GitHub..."
        git pull origin $BRANCH
        ;;
    *)
        echo "\nInvalid choice. Exiting without making changes."
        echo "Your .htaccess backups are still available at .htaccess.backup and public/.htaccess.backup"
        exit 1
        ;;
esac

echo "\n===== Conflict resolution completed ====="
echo "If you need to restore from backups, run:"
echo "cp -f .htaccess.backup .htaccess"
echo "cp -f public/.htaccess.backup public/.htaccess"