@echo off
echo ========================================================
echo Connecting to Oracle Cloud and Deploying Website...
echo ========================================================
ssh -i "C:\Users\airah\Downloads\ssh-key-2026-07-01 (2).key" opc@140.245.240.207 "sudo dnf module enable nodejs:18 -y && sudo dnf install nodejs git -y && sudo firewall-cmd --zone=public --add-port=80/tcp --permanent && sudo firewall-cmd --reload && if [ ! -d 'THE-5-DESIGNS' ]; then git clone https://github.com/rahul-0109/THE-5-DESIGNS.git; fi && cd THE-5-DESIGNS && git pull && sudo npm install && sudo npm install -g pm2 && sudo pm2 start ecosystem.config.js || sudo pm2 restart all"
echo.
echo ========================================================
echo Deployment Complete! 
echo ========================================================
echo IMPORTANT: Don't forget to open Port 80 in Oracle Cloud's Networking Dashboard!
echo Press any key to close this window...
pause
