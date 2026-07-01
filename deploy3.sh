#!/bin/bash
set -e
echo "Starting ultra-lightweight deployment..."

# 1. Open Firewall
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --reload

# 2. Download and install Node.js manually (bypassing DNF)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSLO https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz
    sudo tar -xJf node-v18.17.1-linux-x64.tar.xz -C /usr/local --strip-components=1
    rm node-v18.17.1-linux-x64.tar.xz
fi

# 3. Download the Website Code (bypassing Git)
echo "Downloading website code..."
mkdir -p /home/opc/THE-5-DESIGNS
cd /home/opc/THE-5-DESIGNS
curl -L https://github.com/rahul-0109/THE-5-DESIGNS/tarball/master | tar -xz --strip-components=1

# 4. Create a lightweight background service (bypassing PM2)
echo "Creating systemd service..."
sudo bash -c 'cat <<EOF > /etc/systemd/system/the5designs.service
[Unit]
Description=The 5 Designs Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/opc/THE-5-DESIGNS
ExecStart=/usr/local/bin/node /home/opc/THE-5-DESIGNS/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF'

# 5. Start the service
sudo systemctl daemon-reload
sudo systemctl enable the5designs
sudo systemctl restart the5designs

echo "Deployment fully completed successfully!"
