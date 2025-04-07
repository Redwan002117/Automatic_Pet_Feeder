#!/bin/bash

# Script to resolve Git merge conflicts in cPanel Git Version Control
# This script should be run on the cPanel server via SSH

# Default variables - these will be confirmed/updated during script execution
REPO_DIR="/home/$(whoami)/public_html"
BRANCH="main"

# Display header
echo "===== cPanel Git Conflict Resolution Script ====="
echo "This script will help resolve Git merge conflicts in cPanel"
echo "Specifically for .htaccess files that have local changes"
echo ""

# Confirm repository directory
echo "Current repository directory is set to: $REPO_DIR"
read -p "Is this correct? (y/n): " confirm_dir

if [[ $confirm_dir != "y" && $confirm_dir != "Y" ]]; then
    read -p "Please enter the correct repository directory: " REPO_DIR
    echo "Repository directory updated to: $REPO_DIR"
fi

# Confirm branch name
echo "Current branch is set to: $BRANCH"
read -p "Is this correct? (y/n): " confirm_branch

if [[ $confirm_branch != "y" && $confirm_branch != "Y" ]]; then
    read -p "Please enter the correct branch name: " BRANCH
    echo "Branch updated to: $BRANCH"
fi

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
echo -e "\n3. Creating backup of .htaccess files..."

# Create timestamped backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

if [ -f ".htaccess" ]; then
    cp -f .htaccess ".htaccess.backup.$TIMESTAMP"
    echo "   Backup created: .htaccess.backup.$TIMESTAMP"
else
    echo "   Warning: .htaccess file not found in root directory"
fi

if [ -f "public/.htaccess" ]; then
    cp -f public/.htaccess "public/.htaccess.backup.$TIMESTAMP"
    echo "   Backup created: public/.htaccess.backup.$TIMESTAMP"
else
    echo "   Warning: .htaccess file not found in public directory"
fi

# Prompt user for action
echo -e "\n4. Choose an action to resolve the conflict:"
echo "   1) Commit local changes (preserves your cPanel modifications)"
echo "      - This will save your current .htaccess files to Git before pulling"
echo "      - Best if your cPanel changes are important and should be kept"
echo ""
echo "   2) Stash local changes (temporarily saves them)"
echo "      - This will temporarily store your changes and apply GitHub's version"
echo "      - You can later restore your changes with 'git stash pop'"
echo "      - Best for temporary changes you might want to restore later"
echo ""
echo "   3) Discard local changes (use GitHub version)"
echo "      - This will completely discard your cPanel modifications"
echo "      - The GitHub version will be used instead"
echo "      - Best if your cPanel changes were accidental or no longer needed"
echo ""
read -p "   Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "\n5. Committing local changes..."
        git add .htaccess public/.htaccess 2>/dev/null || echo "   Warning: Some files could not be added, they may not exist"
        git commit -m "Save local .htaccess modifications from cPanel - $TIMESTAMP"
        echo "   Local changes committed. Now attempting to pull from GitHub..."
        if git pull origin $BRANCH; then
            echo "   Pull successful! Your local changes were preserved and GitHub changes were merged."
        else
            echo "   Error: Pull failed. You may need to resolve conflicts manually."
            echo "   Run 'git status' to see the current state."
        fi
        ;;
    2)
        echo -e "\n5. Stashing local changes..."
        if git stash push -- .htaccess public/.htaccess; then
            echo "   Local changes stashed. Now attempting to pull from GitHub..."
            if git pull origin $BRANCH; then
                echo "   Pull successful! GitHub changes have been applied."
                echo -e "\n6. To restore your stashed changes later, run: git stash pop"
                echo "   Note: This might cause conflicts that you'll need to resolve manually."
            else
                echo "   Error: Pull failed. Attempting to restore your stashed changes..."
                git stash pop
                echo "   Your original changes have been restored."
            fi
        else
            echo "   Error: Could not stash changes. They may not exist or there might be another issue."
        fi
        ;;
    3)
        echo -e "\n5. Discarding local changes..."
        git checkout -- .htaccess public/.htaccess 2>/dev/null || echo "   Warning: Some files could not be checked out, they may not exist"
        echo "   Local changes discarded. Now attempting to pull from GitHub..."
        if git pull origin $BRANCH; then
            echo "   Pull successful! GitHub version is now applied."
        else
            echo "   Error: Pull failed. Run 'git status' to see the current state."
        fi
        ;;
    *)
        echo -e "\nInvalid choice. Exiting without making changes."
        echo "Your .htaccess backups are still available with timestamp: $TIMESTAMP"
        exit 1
        ;;
esac

echo -e "\n===== Conflict resolution completed ====="
echo "If you need to restore from backups, run:"
echo "cp -f .htaccess.backup.$TIMESTAMP .htaccess"
echo "cp -f public/.htaccess.backup.$TIMESTAMP public/.htaccess"

echo -e "\nRemember: To avoid this issue in the future:"
echo "1. Always make changes through Git instead of directly on the server"
echo "2. If you must make emergency changes on the server, commit them right away"
echo "3. Use the provided cpanel-git-deploy.sh script for smoother deployments"