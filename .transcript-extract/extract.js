import fs from "fs";
const transcriptPath =
  "C:/Users/lenovo/.cursor/projects/c-Users-lenovo-Desktop-imageOptimizer-frontend/agent-transcripts/37fcdd5e-ed7e-4ba7-b4c6-f59687c0774a/37fcdd5e-ed7e-4ba7-b4c6-f59687c0774a.jsonl";
const lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
const writes = new Map();

for (const line of lines) {
  const obj = JSON.parse(line);
  const content = obj.message?.content;
  if (!Array.isArray(content)) continue;
  for (const item of content) {
    if (
      item.type === "tool_use" &&
      item.name === "Write" &&
      item.input?.path?.includes("app\\admin")
    ) {
      const p = item.input.path.replace(/\\/g, "/").split("frontend/")[1];
      writes.set(p, item.input.contents);
    }
    if (
      item.type === "tool_use" &&
      item.name === "StrReplace" &&
      item.input?.path?.includes("app\\admin")
    ) {
      const p = item.input.path.replace(/\\/g, "/").split("frontend/")[1];
      const cur = writes.get(p);
      if (cur && cur.includes(item.input.old_string)) {
        writes.set(p, cur.replace(item.input.old_string, item.input.new_string));
      }
    }
  }
}

const outDir = "C:/Users/lenovo/Desktop/imageOptimizer/frontend/.transcript-extract";
for (const [p, contents] of [...writes.entries()].sort()) {
  const rel = p.replace(/\//g, "__");
  fs.writeFileSync(`${outDir}/${rel}`, contents);
  console.log(p, "->", contents.length, "chars");
}
console.log("Total files:", writes.size);
