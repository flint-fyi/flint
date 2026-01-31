import type { RuleReport } from "./reports.ts";

export type MessageForContext<Context extends RuleContext<never>> =
	Context extends RuleContext<infer MessageId> ? MessageId : never;

export interface RuleContext<MessageId extends string> {
	report: RuleReporter<MessageId>;
}

export type RuleReporter<MessageId extends string> = (
	report: RuleReport<MessageId>,
) => void;
