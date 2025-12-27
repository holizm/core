sudo chattr -i /etc/hosts
sudo chown root:dev /etc/hosts
sudo chmod 664 /etc/hosts
sudo setfacl -b /etc/hosts
