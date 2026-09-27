import { expectTypeOf } from "vitest";

import type { TypeScriptNodesByName } from "./nodes.ts";

type HasNodeName<Name extends string> = Name extends keyof TypeScriptNodesByName
	? true
	: false;

expectTypeOf<HasNodeName<"Identifier">>().toEqualTypeOf<true>();
expectTypeOf<HasNodeName<"SourceFile">>().toEqualTypeOf<true>();
expectTypeOf<HasNodeName<"VariableStatement">>().toEqualTypeOf<true>();

expectTypeOf<HasNodeName<"FirstNode">>().toEqualTypeOf<false>();
expectTypeOf<HasNodeName<"FirstStatement">>().toEqualTypeOf<false>();
expectTypeOf<HasNodeName<"LastStatement">>().toEqualTypeOf<false>();
