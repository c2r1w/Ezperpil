#!/bin/bash

# This script helps fix Nginx permission issues and optionally configure Nginx to use the root group.
#
# IMPORTANT SECURITY WARNING:
# Running Nginx with the 'root' user or 'root' group is a significant security risk.
# If Nginx is compromised, an attacker could gain root-level access to your system.
# The recommended and more secure approach is to grant the Nginx user (e.g., www-data)
# appropriate permissions to your web content directory.

# --- Configuration Variables ---
NGINX_CONTENT_DIR="/root/raju/public/uploads/"
NGINX_CONF_FILE="/etc/nginx/nginx.conf"

# --- Determine Nginx User ---
# Attempt to find the Nginx user from its configuration or common defaults
NGINX_USER=$(grep -E '^\s*user\s+' "$NGINX_CONF_FILE" | awk '{print $2}' | sed 's/;//')
if [ -z "$NGINX_USER" ]; then
    echo "Could not determine Nginx user from $NGINX_CONF_FILE. Using 'www-data' as default."
    NGINX_USER="www-data" # Common default for Debian/Ubuntu
fi
NGINX_GROUP=$(grep -E '^\s*user\s+' "$NGINX_CONF_FILE" | awk '{print $3}' | sed 's/;//')
if [ -z "$NGINX_GROUP" ]; then
    echo "Could not determine Nginx group from $NGINX_CONF_FILE. Assuming it's the same as the user."
    NGINX_GROUP="$NGINX_USER"
fi


echo "--- Nginx Permission and Configuration Script ---"
echo "Target Nginx content directory: $NGINX_CONTENT_DIR"
echo "Detected Nginx user: $NGINX_USER"
echo "Detected Nginx group: $NGINX_GROUP"
echo ""

# --- Step 1: Fix Directory Permissions (Recommended Secure Method) ---
echo "1. Attempting to fix directory permissions for Nginx content ($NGINX_CONTENT_DIR)..."
echo "   Changing ownership to $NGINX_USER:$NGINX_GROUP and setting permissions to 755."
sudo chown -R "$NGINX_USER":"$NGINX_GROUP" "$NGINX_CONTENT_DIR"
if [ $? -eq 0 ]; then
    echo "   Ownership changed successfully."
else
    echo "   Failed to change ownership. Please check your sudo permissions or directory path."
fi

sudo chmod -R 755 "$NGINX_CONTENT_DIR"
if [ $? -eq 0 ]; then
    echo "   Permissions set successfully."
else
    echo "   Failed to set permissions. Please check your sudo permissions or directory path."
fi
echo ""

# --- Step 2: (Optional & Highly Discouraged) Change Nginx to Root Group ---
echo "2. Optional: Configure Nginx to run with 'root' group (HIGHLY DISCOURAGED)."
echo "   This step is commented out by default due to security risks."
echo "   If you proceed, ensure you understand the implications."
echo "   To enable, uncomment the lines below in the script."
echo ""

# Uncomment the following lines ONLY if you understand and accept the security risks.
# echo "   Modifying Nginx configuration file: $NGINX_CONF_FILE"
# # Use sed to replace the user line. This assumes the 'user' directive is on a single line.
# # It will try to replace 'user www-data;' or 'user nginx;' with 'user www-data root;'
# # Adjust the 'www-data' part if your Nginx user is different (e.g., 'nginx')
# sudo sed -i "/^\s*user\s\+[^;]\+;/c\user $NGINX_USER root;" "$NGINX_CONF_FILE"
# if [ $? -eq 0 ]; then
#     echo "   Nginx user directive updated to 'user $NGINX_USER root;'."
# else
#     echo "   Failed to modify Nginx user directive. Manual edit may be required."
# fi
# echo ""

# --- Step 3: Test Nginx Configuration ---
echo "3. Testing Nginx configuration for syntax errors..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "   Nginx configuration test successful."
    CONFIG_OK=true
else
    echo "   Nginx configuration test FAILED. Please review the errors above."
    CONFIG_OK=false
fi
echo ""

# --- Step 4: Reload Nginx ---
if [ "$CONFIG_OK" = true ]; then
    echo "4. Reloading Nginx service to apply changes..."
    sudo systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "   Nginx reloaded successfully."
        echo "   You should now try accessing cdn.ezperfilwebinars.com to verify."
    else
        echo "   Failed to reload Nginx. Please check systemctl status nginx for details."
    fi
else
    echo "4. Nginx not reloaded due to configuration errors. Please fix them first."
fi

echo ""
echo "--- Script Finished ---"
