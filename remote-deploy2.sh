#!/bin/bash
echo "Starting deployment..."
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --reload

echo "Installing Node.js manually..."
curl -fsSLO https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz
sudo tar -xJf node-v18.17.1-linux-x64.tar.xz -C /usr/local --strip-components=1
rm node-v18.17.1-linux-x64.tar.xz

echo "Installing Git manually..."
sudo dnf install git -y

if [ ! -d "THE-5-DESIGNS" ]; then
  git clone https://github.com/rahul-0109/THE-5-DESIGNS.git
fi
cd THE-5-DESIGNS
git pull

echo "Installing NPM packages..."
sudo npm install
sudo npm install -g pm2
sudo pm2 start ecosystem.config.js || sudo pm2 restart all
sudo pm2 save

echo "Deployment fully completed!"
