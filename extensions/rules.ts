/**
 * Rules Extension
 *
 * Scans ~/.pi/agent/rules/ for rule files and lists them in the system prompt.
 * The agent can then use the read tool to load specific rules when needed.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

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
    const fullPath = path.join(dir, entry.name);

    let isDirectory = entry.isDirectory();
    let isFile = entry.isFile();

    if (entry.isSymbolicLink()) {
      try {
        const stats = fs.statSync(fullPath);
        isDirectory = stats.isDirectory();
        isFile = stats.isFile();
      } catch {
        continue;
      }
    }

    if (isDirectory) {
      results.push(...findMarkdownFiles(fullPath, relativePath));
    } else if (isFile && entry.name.endsWith(".md")) {
      results.push(relativePath);
    }
  }

  return results;
}

const RULES_MESSAGE_TYPE = "rules-list";

type RulesMessageDetails = {
  files: string[];
};

function isRulesListMessage(message: AgentMessage): boolean {
  if (message.role !== "custom") {
    return false;
  }

  return (message as { customType?: string }).customType === RULES_MESSAGE_TYPE;
}

export default function rulesExtension(pi: ExtensionAPI) {
  let ruleFiles: string[] = [];
  const rulesDir = path.join(os.homedir(), ".pi", "agent", "rules");

  pi.registerMessageRenderer<RulesMessageDetails>(RULES_MESSAGE_TYPE, (message, _options, theme) => {
    const files = message.details?.files ?? [];
    const list = files.map((file) => theme.fg("dim", `  ${file}`)).join("\n");
    return new Text(theme.fg("muted", "Loaded rules:\n") + list, 0, 0);
  });

  pi.on("context", async (event) => {
    return {
      messages: event.messages.filter((message) => !isRulesListMessage(message)),
    };
  });

  // Scan for rules on session start
  pi.on("session_start", async (_event, ctx) => {
    ruleFiles = findMarkdownFiles(rulesDir);

    if (ruleFiles.length > 0) {
      if (ctx.hasUI) {
        const files = ruleFiles.map((file) => path.join(rulesDir, file));
        pi.sendMessage({
          customType: RULES_MESSAGE_TYPE,
          content: "Loaded rules",
          display: true,
          details: { files },
        });
      }

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
