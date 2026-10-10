#!/usr/bin/env bash
# Run by the operator in a private local terminal, never through a chat prompt.
set -euo pipefail
if [[ ! -t 0 || ! -t 1 ]]; then
  printf '%s\n' 'A private interactive terminal is required.' >&2
  exit 1
fi
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
remote_script=$(<"$script_dir/provision-mailbox-credential.remote.sh")
printf -v remote_command 'bash -c %q' "$remote_script"
printf '%s\n' 'Existing mailbox password for info@trinkgut-jammers.de.' \
  'Input is hidden. No mail is sent and no mailbox content is read.' \
  'The encrypted credential is stored only on the existing website server.'
exec ssh -tt -i /Users/niko/.ssh/id_ed25519 \
  -o BatchMode=yes -o StrictHostKeyChecking=yes -o UpdateHostKeys=no \
  -o IdentitiesOnly=yes root@159.69.37.200 "$remote_command"
