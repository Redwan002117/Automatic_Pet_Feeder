#!/bin/bash
# Git deployment script for Automatic Pet Feeder on cPanel
# This script helps sync changes between your local repository and cPanel Git Version Control

# Configuration - Edit these variables to match your environment
REPO_NAME="Automatic_Pet_Feeder"
CPANEL_GIT_REMOTE="origin"
BRANCH="main"

echo "===== cPanel Git Deployment Script ====="
echo "Repository: $REPO_NAME"
echo "Remote: $CPANEL_GIT_REMOTE"
echo "Branch: $BRANCH"

# Check if we're in the correct repository
if [ ! -d ".git" ]; then
    echo "Error: This script must be run from the root of your git repository"
    exit 1
fi

# Check if the remote exists
if ! git remote | grep -q "$CPANEL_GIT_REMOTE"; then
    echo "Error: Remote '$CPANEL_GIT_REMOTE' not found"
    echo "Available remotes:"
    git remote -v
    exit 1
fi

# Ensure we have the latest changes from remote
echo -e "\n1. Fetching latest changes from remote..."
git fetch $CPANEL_GIT_REMOTE

# Check if we have local changes to commit
if [ -n "$(git status --porcelain)" ]; then
    echo -e "\n2. Local changes detected. Committing changes..."
    
    # Ask for commit message
    echo "Enter commit message (or press enter for default message):"
    read commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update site files - $(date +'%Y-%m-%d %H:%M:%S')"
    fi
    
    # Add all changes and commit
    git add .
    git commit -m "$commit_msg"
    
    echo "Changes committed with message: '$commit_msg'"
else
    echo -e "\n2. No local changes to commit."
fi

# Check for conflicts before merging or pushing
echo -e "\n3. Checking for potential conflicts with remote branch..."
if git diff --name-only --diff-filter=U | grep -q .; then
    echo "Error: You have merge conflicts that need to be resolved before deploying"
    echo "Files with conflicts:"
    git diff --name-only --diff-filter=U
    exit 1
fi

# Pull changes from remote to integrate them
echo -e "\n4. Pulling latest changes from remote..."
if ! git pull $CPANEL_GIT_REMOTE $BRANCH; then
    echo "Error: Failed to pull latest changes from remote"
    exit 1
fi

# Push changes to remote
echo -e "\n5. Pushing changes to cPanel Git repository..."
if ! git push $CPANEL_GIT_REMOTE $BRANCH; then
    echo "Error: Failed to push changes to remote"
    exit 1
fi

echo -e "\n===== Deployment completed successfully ====="
echo "Your changes have been deployed to cPanel Git Version Control"
echo "Note: It may take a few moments for changes to appear on your website"
echo "Remember to check the cPanel Git Version Control interface to verify deployment"