import rule from "./restrictedProperties.ts";
import { ruleTester } from "./ruleTester.ts";

const jsonParseRestriction = {
	object: { from: "lib" as const, name: "JSON" },
	property: "parse",
};

const serviceDeclarations = `
export interface Service {
    blocked(): void;
    nested: Service;
}
export interface DerivedService extends Service {}
export declare const service: { blocked(): void };
`;

const serviceRestriction = {
	object: {
		from: "file" as const,
		name: ["Service", "service"],
		path: "./service.ts",
	},
	property: "blocked",
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
JSON.parse("{}");
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
JSON.parse("{}");
     ~~~~~
     Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
const parse = JSON["parse"];
`,
			options: {
				restrictions: [
					{ ...jsonParseRestriction, message: "Use the validated parser." },
				],
			},
			snapshot: `
const parse = JSON["parse"];
                   ~~~~~~~
                   Accessing the 'parse' property on this type or value is restricted. Use the validated parser.
`,
		},
		{
			code: `
JSON.parse("{}");
`,
			options: {
				restrictions: [
					jsonParseRestriction,
					{ ...jsonParseRestriction, message: "This message must not win." },
				],
			},
			snapshot: `
JSON.parse("{}");
     ~~~~~
     Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
const key = "parse" as const;
JSON[key];
JSON[\`parse\`];
JSON?.[key];
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
const key = "parse" as const;
JSON[key];
     ~~~
     Accessing the 'parse' property on this type or value is restricted.
JSON[\`parse\`];
     ~~~~~~~
     Accessing the 'parse' property on this type or value is restricted.
JSON?.[key];
       ~~~
       Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
(JSON as typeof JSON).parse;
(JSON satisfies typeof JSON).parse;
JSON!.parse;
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
(JSON as typeof JSON).parse;
                      ~~~~~
                      Accessing the 'parse' property on this type or value is restricted.
(JSON satisfies typeof JSON).parse;
                             ~~~~~
                             Accessing the 'parse' property on this type or value is restricted.
JSON!.parse;
      ~~~~~
      Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
JSON.parse = () => undefined;
JSON.parse++;
delete JSON.parse;
new JSON.parse();
JSON.parse\`value\`;
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
JSON.parse = () => undefined;
     ~~~~~
     Accessing the 'parse' property on this type or value is restricted.
JSON.parse++;
     ~~~~~
     Accessing the 'parse' property on this type or value is restricted.
delete JSON.parse;
            ~~~~~
            Accessing the 'parse' property on this type or value is restricted.
new JSON.parse();
         ~~~~~
         Accessing the 'parse' property on this type or value is restricted.
JSON.parse\`value\`;
     ~~~~~
     Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
const JSONAlias = JSON;
const secondAlias = JSONAlias;
secondAlias?.parse("{}");
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
const JSONAlias = JSON;
const secondAlias = JSONAlias;
secondAlias?.parse("{}");
             ~~~~~
             Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
const { parse, parse: parser, ["parse"]: computedParser, ...rest } = JSON;
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
const { parse, parse: parser, ["parse"]: computedParser, ...rest } = JSON;
        ~~~~~
        Accessing the 'parse' property on this type or value is restricted.
               ~~~~~
               Accessing the 'parse' property on this type or value is restricted.
                               ~~~~~~~
                               Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
JSON[0];
JSON[1n];
const key = 2 as const;
JSON[key];
JSON[""];
`,
			options: {
				restrictions: [
					{ object: jsonParseRestriction.object, property: "0" },
					{ object: jsonParseRestriction.object, property: "1" },
					{ object: jsonParseRestriction.object, property: "2" },
					{ object: jsonParseRestriction.object, property: "" },
				],
			},
			snapshot: `
JSON[0];
     ~
     Accessing the '0' property on this type or value is restricted.
JSON[1n];
     ~~
     Accessing the '1' property on this type or value is restricted.
const key = 2 as const;
JSON[key];
     ~~~
     Accessing the '2' property on this type or value is restricted.
JSON[""];
     ~~
     Accessing the '' property on this type or value is restricted.
`,
		},
		{
			code: `
const { parse: parser, ["parse"]: computedParser, ...rest } = JSON;
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
const { parse: parser, ["parse"]: computedParser, ...rest } = JSON;
        ~~~~~
        Accessing the 'parse' property on this type or value is restricted.
                        ~~~~~~~
                        Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
let parse: typeof JSON.parse;
let parser: typeof JSON.parse;
({ parse, ["parse"]: parser } = JSON);
`,
			options: { restrictions: [jsonParseRestriction] },
			snapshot: `
let parse: typeof JSON.parse;
let parser: typeof JSON.parse;
({ parse, ["parse"]: parser } = JSON);
   ~~~~~
   Accessing the 'parse' property on this type or value is restricted.
           ~~~~~~~
           Accessing the 'parse' property on this type or value is restricted.
`,
		},
		{
			code: `
import { service as renamedService } from "./service";
renamedService.blocked();
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import { service as renamedService } from "./service";
renamedService.blocked();
               ~~~~~~~
               Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import type { DerivedService, Service } from "./service";
declare const derived: DerivedService;
declare const intersection: Service & { extra: true };
declare const nullable: Service | undefined;
derived.blocked();
intersection.blocked();
nullable?.blocked();
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import type { DerivedService, Service } from "./service";
declare const derived: DerivedService;
declare const intersection: Service & { extra: true };
declare const nullable: Service | undefined;
derived.blocked();
        ~~~~~~~
        Accessing the 'blocked' property on this type or value is restricted.
intersection.blocked();
             ~~~~~~~
             Accessing the 'blocked' property on this type or value is restricted.
nullable?.blocked();
          ~~~~~~~
          Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import type { DerivedService, Service } from "./service";
declare const first: Service;
declare const second: DerivedService;
declare const union: typeof first | typeof second;
function access<T extends Service>(value: T) {
    value.blocked();
}
union.blocked();
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import type { DerivedService, Service } from "./service";
declare const first: Service;
declare const second: DerivedService;
declare const union: typeof first | typeof second;
function access<T extends Service>(value: T) {
    value.blocked();
          ~~~~~~~
          Accessing the 'blocked' property on this type or value is restricted.
}
union.blocked();
      ~~~~~~~
      Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import type { Service } from "./service";
function consume({ blocked: operation, ["blocked"]: computed }: Service) {}
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import type { Service } from "./service";
function consume({ blocked: operation, ["blocked"]: computed }: Service) {}
                   ~~~~~~~
                   Accessing the 'blocked' property on this type or value is restricted.
                                        ~~~~~~~~~
                                        Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import type { Service } from "./service";
declare const source: { nested: Service };
const { nested: { blocked } } = source;
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import type { Service } from "./service";
declare const source: { nested: Service };
const { nested: { blocked } } = source;
                  ~~~~~~~
                  Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import type { Service } from "./service";
declare const source: { nested: { nested: Service } };
let blocked: Service["blocked"];
({ nested: { nested: { blocked } } } = source);
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
			snapshot: `
import type { Service } from "./service";
declare const source: { nested: { nested: Service } };
let blocked: Service["blocked"];
({ nested: { nested: { blocked } } } = source);
                       ~~~~~~~
                       Accessing the 'blocked' property on this type or value is restricted.
`,
		},
		{
			code: `
import { service } from "test-package";
service.blocked();
`,
			files: {
				"test-package.d.ts": `declare module "test-package" { export const service: { blocked(): void }; }`,
			},
			options: {
				restrictions: [
					{
						object: {
							from: "package",
							name: "service",
							package: "test-package",
						},
						property: "blocked",
					},
				],
			},
			snapshot: `
import { service } from "test-package";
service.blocked();
        ~~~~~~~
        Accessing the 'blocked' property on this type or value is restricted.
`,
		},
	],
	valid: [
		`JSON.parse("{}");`,
		{
			code: `export {}; const JSON = { parse() {}, stringify() {} }; JSON.parse();`,
			options: { restrictions: [jsonParseRestriction] },
		},
		{
			code: `const key: string = "parse"; JSON[key]; JSON["parse" + ""];`,
			options: { restrictions: [jsonParseRestriction] },
		},
		{
			code: `JSON.stringify({}); JSON[true];`,
			options: {
				restrictions: [
					jsonParseRestriction,
					{ ...jsonParseRestriction, message: "This must not win." },
				],
			},
		},
		{
			code: `({ parse: () => {} }); JSON.parse && ({ ...JSON });`,
			options: { restrictions: [] },
		},
		{
			code: `
import type { Service } from "./service";
interface Similar { blocked(): void }
declare const mixed: Service | Similar;
declare const similar: Similar;
declare const anything: any;
declare const uncertain: unknown;
mixed.blocked();
similar.blocked();
anything.blocked();
uncertain;
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
		},
		{
			code: `
import { service } from "./service";
let mutable = service;
mutable = { blocked() {} };
mutable.blocked();
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
		},
		{
			code: `
import type { Service } from "./service";
declare const source: Service;
const { ...rest } = source;
let blocked: Service["blocked"];
({ ...rest } = source);
[blocked] = [];
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
		},
		{
			code: `
import type { Service } from "./service";
declare const source: Record<string, Service>;
declare const dynamic: string;
let blocked: Service["blocked"];
({ [dynamic]: { blocked } } = source);
`,
			files: { "service.ts": serviceDeclarations },
			options: { restrictions: [serviceRestriction] },
		},
	],
});
