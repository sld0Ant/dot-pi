/**
 * Claude Rules Extension
 *
 * Scans ~/.pi/agent/rules/ for rule files and lists them in the system prompt.
 * The agent can then use the read tool to load specific rules when needed.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Recursively find all .md files in a directory
 */
function findMarkdownFiles(dir: string, basePath: string = ""): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(path.join(dir, entry.name), relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(relativePath);
    }
  }

  return results;
}

export default function rulesExtension(pi: ExtensionAPI) {
  let ruleFiles: string[] = [];
  const rulesDir = path.join(os.homedir(), ".pi", "agent", "rules");

  // Scan for rules on session start
  pi.on("session_start", async (_event, ctx) => {
    ruleFiles = findMarkdownFiles(rulesDir);

    if (ruleFiles.length > 0) {
      ctx.ui.notify(`Found ${ruleFiles.length} rule(s) in ~/.pi/agent/rules/`, "info");
    }
  });

  // Append available rules to system prompt
  pi.on("before_agent_start", async (event) => {
    if (ruleFiles.length === 0) {
      return;
    }

    const rulesList = ruleFiles.map((f) => `- ${rulesDir}/${f}`).join("\n");

    return {
      systemPrompt:
        event.systemPrompt +
        `

## Global Rules

The following global rules are available in ~/.pi/agent/rules/:

${rulesList}

When working on tasks related to these rules, use the read tool to load the relevant rule files for guidance.
`,
    };
  });
}
