import { createServer, type Socket } from "node:net";
import type { AddressInfo } from "node:net";

export interface TestMessage { uid: number; raw: Buffer; flags: Set<string> }
export interface TestFolder { path: string; messages: TestMessage[]; uidValidity?: string; denied?: boolean; readOnly?: boolean; noFlags?: boolean; noSelect?: boolean; selectCode?: string }
export interface Command { tag: string; verb: string; args: string; folder?: string }
export interface ServerOptions {
  folders: TestFolder[]; uidplus?: boolean; withdrawal?: "untagged" | "tagged";
  namespacePrefix?: string;
  intercept?: (command: Command, socket: Socket) => boolean;
}
export async function imapServer(options: ServerOptions) {
  const commands: Command[] = [], sockets = new Set<Socket>();
  const server = createServer(socket => {
    sockets.add(socket); socket.on("error", () => {}); socket.on("close", () => sockets.delete(socket));
    let input = "", selected: TestFolder | undefined, capability = `IMAP4rev1${options.uidplus === false ? "" : " UIDPLUS"}${options.namespacePrefix ? " NAMESPACE" : ""}`;
    socket.write(`* PREAUTH [CAPABILITY ${capability}] synthetic fixture\r\n`);
    socket.on("data", bytes => {
      input += bytes.toString();
      while (input.includes("\r\n")) {
        const end = input.indexOf("\r\n"), line = input.slice(0, end); input = input.slice(end + 2);
        const match = /^(\S+) (UID \S+|\S+)(?: (.*))?$/.exec(line);
        if (!match) { socket.destroy(); return; }
        const [, tag, verb, args = ""] = match;
        const command = { tag, verb: verb.toUpperCase(), args, folder: selected?.path }; commands.push(command);
        if (options.intercept?.(command, socket)) continue;
        const ok = (code = "") => socket.write(`${tag} OK ${code}complete\r\n`);
        if (verb === "CAPABILITY") { socket.write(`* CAPABILITY ${capability}\r\n`); ok(); }
        else if (verb === "NAMESPACE") { socket.write(`* NAMESPACE (("${options.namespacePrefix}" ".")) NIL NIL\r\n`); ok(); }
        else if (verb === "LIST" || verb === "LSUB") {
          const pattern = /(?:"([^"]*)"|(\S+))$/.exec(args)?.slice(1).find(v => v !== undefined) ?? "*";
          const listed = pattern === "" ? [{ path: "", noSelect: true }] : options.folders.filter(f => pattern === "*" ? (!options.namespacePrefix || f.path !== "INBOX") : pattern === f.path);
          for (const folder of listed) socket.write(`* ${verb} (${folder.noSelect ? "\\Noselect" : ""}) "/" "${folder.path}"\r\n`);
          ok();
        } else if (verb === "SELECT" || verb === "EXAMINE") {
          const path = args.replace(/^"|"$/g, ""); selected = options.folders.find(f => f.path === path);
          if (!selected || selected.denied) { socket.write(`${tag} NO unavailable\r\n`); continue; }
          socket.write(`* ${selected.messages.length} EXISTS\r\n* FLAGS (\\Seen \\Deleted)\r\n`);
          if (selected.uidValidity !== "missing") socket.write(`* OK [UIDVALIDITY ${selected.uidValidity ?? "77"}] identity\r\n`);
          if (!selected.noFlags) socket.write("* OK [PERMANENTFLAGS (\\Seen \\Deleted)] rights\r\n");
          ok(verb === "SELECT" && selected.selectCode !== undefined ? (selected.selectCode ? `[${selected.selectCode}] ` : "") : `[${verb === "EXAMINE" || selected.readOnly ? "READ-ONLY" : "READ-WRITE"}] `);
        } else if (verb === "UID SEARCH") {
          const criteria = [...args.matchAll(/HEADER ([A-Z-]+) (?:"([^"]*)"|(\S+))/gi)];
          const matches = (selected?.messages ?? []).filter(m => criteria.length && criteria.every(([, key, quoted, atom]) => new RegExp(`^${key}:.*${(quoted ?? atom).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "im").test(m.raw.toString())));
          socket.write(`* SEARCH${matches.map(m => ` ${m.uid}`).join("")}\r\n`); ok();
        } else if (verb === "UID FETCH") {
          const uid = Number(args.split(" ")[0]), message = selected?.messages.find(m => m.uid === uid);
          if (message) {
            const part = /BODY(?:\.PEEK)?\[(HEADER)?\]<(\d+)\.(\d+)>/.exec(args);
            if (part) {
              if (!args.includes("BODY.PEEK")) message.flags.add("\\Seen");
              const header = message.raw.subarray(0, message.raw.indexOf("\r\n\r\n") + 4);
              const source = part[1] ? header : message.raw, start = Number(part[2]), length = Number(part[3]);
              const bytes = source.subarray(start, start + length);
              socket.write(`* 1 FETCH (UID ${uid} RFC822.SIZE ${message.raw.length} BODY[${part[1] ?? ""}]<${start}> {${bytes.length}}\r\n`);
              socket.write(bytes); socket.write(")\r\n");
            }
          }
          ok();
        } else if (verb === "UID STORE") {
          const message = selected?.messages.find(m => m.uid === Number(args.split(" ")[0])); message?.flags.add("\\Deleted");
          if (options.withdrawal) capability = "IMAP4rev1";
          if (options.withdrawal === "untagged") socket.write(`* CAPABILITY ${capability}\r\n`);
          ok(options.withdrawal === "tagged" ? `[CAPABILITY ${capability}] ` : "");
        } else if (verb === "UID EXPUNGE" || verb === "EXPUNGE" || verb === "CLOSE") {
          if (selected) selected.messages = selected.messages.filter(m => !m.flags.has("\\Deleted") || (verb === "UID EXPUNGE" && m.uid !== Number(args)));
          ok();
        } else if (verb === "LOGOUT") { socket.write(`* BYE done\r\n${tag} OK logout\r\n`); socket.end(); }
        else if (verb === "NOOP") ok();
        else socket.write(`${tag} BAD unsupported fixture command\r\n`);
      }
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  return { port: (server.address() as AddressInfo).port, commands, async close() { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}
