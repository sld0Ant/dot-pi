/**
 * Question Tool Extension
 *
 * Registers a tool that lets the LLM ask the user a question with selectable options.
 * Uses ctx.ui.select() for interactive selection.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

interface QuestionDetails {
  question: string;
  options: string[];
  answer: string | null;
}

interface QuestionParams {
  question: string;
  options: string[];
}

const QuestionParamsSchema = Type.Object({
  question: Type.String({ description: "The question to ask the user" }),
  options: Type.Array(Type.String(), { description: "Options for the user to choose from" }),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "question",
    label: "Question",
    description:
      "Ask the user a question and let them pick from options. Use when you need user input to proceed.",
    parameters: QuestionParamsSchema as any,

    async execute(_toolCallId, params, _onUpdate, ctx, _signal) {
      const { question, options } = params as QuestionParams;
      if (!ctx.hasUI) {
        return {
          content: [
            { type: "text", text: "Error: UI not available (running in non-interactive mode)" },
          ],
          details: { question, options, answer: null } as QuestionDetails,
        };
      }

      if (options.length === 0) {
        return {
          content: [{ type: "text", text: "Error: No options provided" }],
          details: { question, options: [], answer: null } as QuestionDetails,
        };
      }

      const answer = await ctx.ui.select(question, options);

      if (answer === undefined) {
        return {
          content: [{ type: "text", text: "User cancelled the selection" }],
          details: { question, options, answer: null } as QuestionDetails,
        };
      }

      return {
        content: [{ type: "text", text: `User selected: ${answer}` }],
        details: { question, options, answer } as QuestionDetails,
      };
    },

    renderCall(params, theme) {
      const args = params as QuestionParams;
      let text = theme.fg("toolTitle", theme.bold("question ")) + theme.fg("muted", args.question);
      if (args.options?.length) {
        text += `\n${theme.fg("dim", `  Options: ${args.options.join(", ")}`)}`;
      }
      return new Text(text, 0, 0);
    },

    renderResult(result, _options, theme) {
      const details = result.details as QuestionDetails | undefined;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }

      if (details.answer === null) {
        return new Text(theme.fg("warning", "Cancelled"), 0, 0);
      }

      return new Text(theme.fg("success", "✓ ") + theme.fg("accent", details.answer), 0, 0);
    },
  });
}
