#!/bin/bash
set -e
echo "Starting SSL Configuration..."

# 1. Ensure enough Swap to avoid OOM during DNF
if [ $(free -m | grep -i swap | awk '{print $2}') -lt 1500 ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
fi

# 2. Open Port 443 (HTTPS) in firewall
echo "Opening firewall for HTTPS..."
sudo firewall-cmd --zone=public --add-port=443/tcp --permanent || true
sudo firewall-cmd --reload || true

# 3. Change Node.js to run on Port 8080 instead of 80 (to make room for Nginx)
echo "Reconfiguring Node.js port..."
sudo sed -i 's/Environment=PORT=80/Environment=PORT=8080/g' /etc/systemd/system/the5designs.service
sudo systemctl daemon-reload
sudo systemctl restart the5designs

# 4. Install Nginx and Certbot
echo "Installing Nginx and Certbot..."
sudo dnf install epel-release -y
sudo dnf install nginx certbot python3-certbot-nginx -y

# 5. Configure Nginx Reverse Proxy
echo "Configuring Nginx..."
sudo bash -c 'cat <<EOF > /etc/nginx/conf.d/the5designs.conf
server {
    listen 80;
    server_name the5designs.in www.the5designs.in;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

# Remove default nginx config to prevent conflicts
sudo rm -f /etc/nginx/conf.d/default.conf || true

sudo systemctl enable nginx
sudo systemctl restart nginx

# 6. Generate SSL Certificate
echo "Generating SSL Certificate..."
sudo certbot --nginx -d the5designs.in -d www.the5designs.in --register-unsafely-without-email --agree-tos --non-interactive

# 7. Restart Nginx to apply SSL
sudo systemctl restart nginx

echo "SSL Configuration Completed Successfully!"
