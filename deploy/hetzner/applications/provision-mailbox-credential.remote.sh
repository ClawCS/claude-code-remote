#!/usr/bin/env bash
# Fixed-destination, operator-driven one-time provisioning. No secret arguments,
# environment variables, shell history, plaintext files or authentication probe.
set -euo pipefail
umask 077
[[ $EUID -eq 0 && -t 0 && -t 1 ]] || exit 1
directory=/etc/credstore.encrypted
name=trinkgut-applications-mailbox-password
target=$directory/$name
[[ ! -L "$directory" && ! -e "$target" && ! -L "$target" ]] || {
  printf '%s\n' 'Credential exists or destination is unsafe; nothing changed.' >&2
  exit 1
}
if [[ ! -e "$directory" ]]; then
  install -d -m 0700 -o root -g root -- "$directory"
fi
[[ -d "$directory" && $(stat -c '%u:%g:%a' -- "$directory") == 0:0:700 ]] || exit 1
temporary=$(mktemp "$directory/.trinkgut-mailbox.XXXXXXXX")
trap 'rm -f -- "$temporary"' EXIT
systemd-ask-password --timeout=300 --echo=no --emoji=no -n \
  'Existing password for info@trinkgut-jammers.de: ' \
  | systemd-creds encrypt --with-key=host --name="$name" - "$temporary"
# Verification returns only a byte count internally, never the plaintext.
bytes=$(systemd-creds decrypt --name="$name" "$temporary" - | wc -c)
[[ $bytes -gt 0 && $bytes -le 512 ]] || {
  printf '%s\n' 'Empty or oversized credential rejected.' >&2
  exit 1
}
chmod 0600 -- "$temporary"
# Atomic no-clobber publication; even a concurrent operator cannot overwrite it.
ln -- "$temporary" "$target"
printf '%s\n' 'Encrypted mailbox credential stored. Mail service remains disabled.'
