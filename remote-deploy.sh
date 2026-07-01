#!/bin/bash
echo "Starting deployment..."
sudo dnf module enable nodejs:18 -y
sudo dnf install nodejs git -y
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --reload
if [ ! -d "THE-5-DESIGNS" ]; then
  git clone https://github.com/rahul-0109/THE-5-DESIGNS.git
fi
cd THE-5-DESIGNS
git pull
sudo npm install
sudo npm install -g pm2
sudo pm2 start ecosystem.config.js || sudo pm2 restart all
sudo pm2 save
echo "Deployment fully completed!"
