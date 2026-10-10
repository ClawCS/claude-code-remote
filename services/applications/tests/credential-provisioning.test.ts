import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const directory = resolve("deploy/hetzner/applications");
const localPath = resolve(directory, "provision-mailbox-credential.sh");
const remotePath = resolve(directory, "provision-mailbox-credential.remote.sh");
const local = readFileSync(localPath, "utf8");
const remote = readFileSync(remotePath, "utf8");

describe("operator-only mailbox credential provisioning", () => {
  it("has valid shell syntax and refuses non-interactive execution before SSH or writes", () => {
    for (const path of [localPath, remotePath]) {
      expect(spawnSync("bash", ["-n", path]).status).toBe(0);
      const result = spawnSync("bash", [path], { encoding: "utf8", input: "synthetic-not-a-password\n", timeout: 1000 });
      expect(result.status).toBe(1);
      expect(result.error).toBeUndefined();
      expect(result.stdout + result.stderr).not.toContain("synthetic-not-a-password");
    }
  });

  it("pins the existing SSH destination and obtains secrets only from the remote hidden prompt", () => {
    expect(local).toContain("StrictHostKeyChecking=yes");
    expect(local).toContain("UpdateHostKeys=no");
    expect(local).toContain("IdentitiesOnly=yes");
    expect(local).toContain("BatchMode=yes");
    expect(local).toContain("root@159.69.37.200");
    expect(local).not.toMatch(/sshpass|StrictHostKeyChecking=no|set -x/);
    expect(remote).toContain("systemd-ask-password --timeout=300 --echo=no --emoji=no -n");
    expect(remote).not.toMatch(/--accept-cached|--echo=yes|set -x|SMTP_PASS|IMAP_PASS/);
    expect(remote).toContain('systemd-creds encrypt --with-key=host --name="$name" - "$temporary"');
  });

  it("publishes only checked ciphertext without replacing existing credentials", () => {
    expect(remote).toContain("set -euo pipefail");
    expect(remote).toContain("umask 077");
    expect(remote).toContain('[[ $EUID -eq 0 && -t 0 && -t 1 ]] || exit 1');
    expect(remote).toContain('[[ ! -L "$directory" && ! -e "$target" && ! -L "$target" ]]');
    expect(remote).toContain("0:0:700");
    expect(remote).toContain("'rm -f -- \"$temporary\"' EXIT");
    expect(remote).toContain('[[ $bytes -gt 0 && $bytes -le 512 ]]');
    expect(remote).toContain('chmod 0600 -- "$temporary"');
    expect(remote).toContain('ln -- "$temporary" "$target"');
    expect(remote).not.toMatch(/ln -f|mv .*\$target|smtp\.ionos|imap\.ionos|curl|wget/);
  });
});
