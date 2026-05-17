import { callAnthropic } from "./anthropic";
import { callOpenAICompatible, type CallProviderArgs, type ModelResult } from "./openai";

export type CallModelArgs = CallProviderArgs & {
  format: "openai" | "anthropic";
};

export async function callModel(args: CallModelArgs): Promise<ModelResult> {
  if (args.format === "anthropic") return callAnthropic(args);
  return callOpenAICompatible(args);
}
