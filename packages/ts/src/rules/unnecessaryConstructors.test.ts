import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryConstructors.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Logger {
    constructor() {}
}
`,
			snapshot: `
class Logger {
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    constructor     () {}
}
`,
			snapshot: `
class Logger {
    constructor     () {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    'constructor'() {}
}
`,
			snapshot: `
class Logger {
    'constructor'() {}
    ~~~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    public constructor() {}
}
`,
			snapshot: `
class Logger {
    public constructor() {}
    ~~~~~~~~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    
}
`,
				},
			],
		},
		{
			code: `
class Logger implements Contract {
    constructor() {}
}
`,
			snapshot: `
class Logger implements Contract {
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger implements Contract {
    
}
`,
				},
			],
		},
		{
			code: `
const Logger = class {
    constructor() {}
};
`,
			snapshot: `
const Logger = class {
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
};
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
const Logger = class {
    
};
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor() {
        super();
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor() {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super();
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(value) {
        super(value);
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(value) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(value);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(first, second) {
        super(first, second);
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(first, second) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(first, second);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(...args) {
        super(...args);
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(...args) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(...args);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends namespaces.Base {
    constructor() {
        super(...arguments);
    }
}
`,
			snapshot: `
class Child extends namespaces.Base {
    constructor() {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(...arguments);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends namespaces.Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(first, second, ...others) {
        super(...arguments);
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(first, second, ...others) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(...arguments);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(first, second, ...others) {
        super(first, second, ...others);
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(first, second, ...others) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(first, second, ...others);
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(value) {
        (super(value));
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(value) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        (super(value));
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor(value) {
        super((value));
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor(value) {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super((value));
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Child extends Base {
    constructor() {
        super(...(arguments));
    }
}
`,
			snapshot: `
class Child extends Base {
    constructor() {
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
        super(...(arguments));
    }
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Child extends Base {
    
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    [0]() {}
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    [0]() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    ;
    [0]() {}
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    *run() {}
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    *run() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    ;
    *run() {}
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    in
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    in
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    ;
    in
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    instanceof
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    instanceof
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    ;
    instanceof
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    #instanceof
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    #instanceof
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    
    #instanceof
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label
    constructor() {}
    [0]() {}
}
`,
			snapshot: `
class Logger {
    label
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    [0]() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label
    
    [0]() {}
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready";
    constructor() {}
    [0]() {}
}
`,
			snapshot: `
class Logger {
    label = "ready";
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    [0]() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready";
    
    [0]() {}
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    label = "ready"
    constructor() {}
    run() {}
}
`,
			snapshot: `
class Logger {
    label = "ready"
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    run() {}
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    label = "ready"
    
    run() {}
}
`,
				},
			],
		},
		{
			code: `
class Logger {
    constructor() {}
    [0]() {}
    label = "ready"
}
`,
			snapshot: `
class Logger {
    constructor() {}
    ~~~~~~~~~~~
    This constructor is equivalent to the implicit default constructor, so it adds no behavior to the class.
    [0]() {}
    label = "ready"
}
`,
			suggestions: [
				{
					id: "removeConstructor",
					updated: `
class Logger {
    
    [0]() {}
    label = "ready"
}
`,
				},
			],
		},
	],
	valid: [
		"class Logger {}",
		"class Logger { constructor() { setup(); } }",
		"class Logger { log() { setup(); } }",
		"class Child extends Base { constructor() {} }",
		'class Child extends Base { constructor() { super("label"); } }',
		"class Child extends Base { constructor(first, second) { super(first, second, 1); } }",
		"class Child extends Base { constructor() { super(); setup(); } }",
		"class Child extends Base { constructor(...args) { super(...args); setup(); } }",
		"class Child extends namespaces.Base { constructor() { super(outside); } }",
		"class Child extends namespaces.Base { constructor([first, second]) { super(...arguments); } }",
		"class Child extends namespaces.Base { constructor(first = make()) { super(...arguments); } }",
		"class Child extends Base { constructor(first, second, third) { super(first, second); } }",
		"class Child extends Base { constructor(first, second) { super(first); } }",
		"class Child extends Base { constructor(value) { super(); } }",
		"class Child extends Base { constructor() { ready; } }",
		"class Child extends Base { constructor(first, second) { super(second, first); } }",
		"class Child extends Base { constructor() { setup(); } }",
		"class Child extends Base { constructor() { return super(); } }",
		"class Child extends Base { constructor(...args) { super(args); } }",
		"class Child extends Base { constructor() { super(...outside); } }",
		"class Child extends Base { constructor() { super(...arguments, extra); } }",
		"class Child extends Base { constructor(value) { super(value + 1); } }",
		"class Logger { constructor() { super(); } }",
		`
declare class Logger {
    constructor();
}
`,
		"class Logger { constructor(); }",
		"abstract class Logger { constructor(); }",
		"class Logger { constructor(name); }",
		"class Logger { constructor(private name: string) {} }",
		"class Logger { constructor(public name: string) {} }",
		"class Logger { constructor(protected name: string) {} }",
		"class Logger { constructor(readonly name: string) {} }",
		"class Logger { private constructor() {} }",
		"class Logger { protected constructor() {} }",
		"class Child extends Base { public constructor() {} }",
		"class Child extends Base { public constructor() { super(); } }",
		"class Child extends Base { protected constructor(first, second) { super(second); } }",
		"class Child extends Base { private constructor(first, second) { super(second); } }",
		"class Child extends Base { public constructor(value) { super(value); } }",
		"class Child extends Base { public constructor(value) {} }",
		"class Logger { constructor(@inject service) {} }",
		`
class Child extends Base {
    constructor(@inject service: Service) {
        super(service);
    }
}
`,
		`
class Child extends Base {
    constructor(name: string, @optional() label) {
        super(name, label);
    }
}
`,
		"const factory = { constructor() {} };",
	],
});
