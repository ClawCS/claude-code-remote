#!/usr/bin/env bash
# Run only on the explicitly approved, new Jammers VM. No application secrets.
set -euo pipefail
test "$(id -u)" = 0
test "$(hostname)" = trinkgut-jammers-web-01
test "$(uname -m)" = x86_64
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https xz-utils ufw fail2ban python3-systemd nftables unattended-upgrades linux-image-virtual

# Establish SSH access before enabling a default-deny firewall. Web ports are
# opened separately, after the production app and proxy have been verified.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'Key-only administration'
ufw --force enable

install -d -m 0755 /opt /usr/share/keyrings /etc/apt/sources.list.d
download_dir=$(mktemp -d)
trap 'rm -rf "$download_dir"' EXIT
cd "$download_dir"
curl --fail --show-error --silent --location --proto '=https' --tlsv1.2 https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o SHASUMS256.txt
archive=$(awk '$2 ~ /^node-v22\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz$/ {print $2}' SHASUMS256.txt)
test "$(printf '%s\n' "$archive" | wc -l)" -eq 1
test -n "$archive"
curl --fail --show-error --silent --location --proto '=https' --tlsv1.2 "https://nodejs.org/dist/latest-v22.x/$archive" -o "$archive"
awk -v archive="$archive" '$2 == archive {print}' SHASUMS256.txt | sha256sum --check --strict
node_dir=${archive%.tar.xz}
test ! -e "/opt/$node_dir"
tar -xJf "$archive" -C /opt
ln -sfn "/opt/$node_dir" /opt/node
/opt/node/bin/node --version

curl --fail --show-error --silent --location --proto '=https' --tlsv1.2 https://dl.cloudsmith.io/public/caddy/stable/gpg.key -o caddy.gpg.key
gpg --dearmor --output /usr/share/keyrings/caddy-stable-archive-keyring.gpg caddy.gpg.key
curl --fail --show-error --silent --location --proto '=https' --tlsv1.2 https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
chmod a+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
# Package installation starts Caddy; the firewall still admits only SSH.
systemctl stop caddy

id jammers >/dev/null 2>&1 || useradd --system --create-home --home-dir /srv/trinkgut-jammers --shell /usr/sbin/nologin jammers
install -d -m 0755 -o jammers -g jammers /srv/trinkgut-jammers/releases
install -d -m 0750 -o root -g jammers /etc/trinkgut-jammers
systemctl enable unattended-upgrades
ufw status verbose
caddy version
test ! -f /var/run/reboot-required || printf '%s\n' 'REBOOT_REQUIRED'
