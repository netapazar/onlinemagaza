const fs = require("fs");
const norm = (t) => t.replace(/\r\n/g, "\n");
const crm = norm(fs.readFileSync("/tmp/final-schema.prisma", "utf8"));
const p = "prisma/schema.prisma";
const raw = fs.readFileSync(p, "utf8"); const crlf = raw.includes("\r\n"); const on = norm(raw);
const marker = "enum Role {";
const out = on.slice(0, on.indexOf(marker)) + crm.slice(crm.indexOf(marker));
fs.writeFileSync(p, crlf ? out.replace(/\n/g, "\r\n") : out);
const chk = norm(fs.readFileSync(p, "utf8")); console.log("nihai CRM şemasıyla eşit:", chk.slice(chk.indexOf(marker)) === crm.slice(crm.indexOf(marker)));
