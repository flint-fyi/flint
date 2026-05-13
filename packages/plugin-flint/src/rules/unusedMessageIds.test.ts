import { ruleTester } from "./ruleTester.ts";
import rule from "./unusedMessageIds.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
      primary: "This message ID is never used.",
      secondary: [""],
      suggestions: [""]
    }
  },
  setup(context: RuleContext) {
    context.report({
      message: "messagesId",
    });
  }
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
    ~~~~~~~~~~~~~~~
    Message ID 'unusedMessageId' is defined but never used.
      primary: "This message ID is never used.",
      secondary: [""],
      suggestions: [""]
    }
  },
  setup(context: RuleContext) {
    context.report({
      message: "messagesId",
    });
  }
});
`,
		},
		{
			code: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import { reportSourceCode } from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    usedMessageId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
      primary: "This message ID is never used.",
      secondary: [""],
      suggestions: [""]
    }
  },
  setup(context: RuleContext) {
    reportSourceCode(context, {
      message: "usedMessageId",
    });
  }
});
`,
			snapshot: `
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import { reportSourceCode } from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    usedMessageId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
    ~~~~~~~~~~~~~~~
    Message ID 'unusedMessageId' is defined but never used.
      primary: "This message ID is never used.",
      secondary: [""],
      suggestions: [""]
    }
  },
  setup(context: RuleContext) {
    reportSourceCode(context, {
      message: "usedMessageId",
    });
  }
});
`,
		},
	],
	valid: [
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
  },
  setup(context: RuleContext) {
    context.report({
      message: "messagesId",
    });
  }
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import { reportSourceCode } from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
  },
  setup(context: RuleContext) {
    reportSourceCode(context, {
      message: "messagesId",
    });
  }
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import { reportSourceCode as reportFromSourceCode } from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
  },
  setup(context: RuleContext) {
    reportFromSourceCode(context, {
      message: "messagesId",
    });
  }
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import * as volarLanguage from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
  },
  setup(context: RuleContext) {
    volarLanguage.reportSourceCode(context, {
      message: "messagesId",
    });
  }
});
`,
		`
interface RuleCreator { createRule<T>(language: any, ruleConfig: { messages: Record<string, string> }): T; };
interface RuleContext { report(descriptor: { message: string; data?: Record<string, string> }): void; };
declare const ruleCreator: RuleCreator;

declare module "@flint.fyi/volar-language" {
  export function reportSourceCode(
    context: unknown,
    descriptor: { message: string; data?: Record<string, string> },
  ): void;
}

import { reportSourceCode } from "@flint.fyi/volar-language";

ruleCreator.createRule(_, {
  messages: {
    messagesId: {
      primary: "This message ID has been used.",
      secondary: [""],
      suggestions: [""]
    },
    unusedMessageId: {
      primary: "This message ID is never used.",
      secondary: [""],
      suggestions: [""]
    }
  },
  setup(context: RuleContext) {
    const message = "messagesId";

    reportSourceCode(context, {
      message,
    });
  }
});
`,
	],
});
