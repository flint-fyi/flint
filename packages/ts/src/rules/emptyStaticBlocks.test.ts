import rule from "./emptyStaticBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    static {
    }
}
`,
			snapshot: `
class Example {
    static {
    ~~~~~~~~
    Empty static blocks serve no purpose and should be removed for cleaner code.
    }
}
`,
			suggestions: [
				{
					id: "removeEmptyStaticBlock",
					updated: `
class Example {
    
}
`,
				},
			],
		},
		{
			code: `
class Example {
    static {


    }
}
`,
			snapshot: `
class Example {
    static {
    ~~~~~~~~
    Empty static blocks serve no purpose and should be removed for cleaner code.


    }
}
`,
			suggestions: [
				{
					id: "removeEmptyStaticBlock",
					updated: `
class Example {
    
}
`,
				},
			],
		},
		{
			code: `
class Multiple {
    static property = 1;

    static {
    }

    method() {}
}
`,
			snapshot: `
class Multiple {
    static property = 1;

    static {
    ~~~~~~~~
    Empty static blocks serve no purpose and should be removed for cleaner code.
    }

    method() {}
}
`,
			suggestions: [
				{
					id: "removeEmptyStaticBlock",
					updated: `
class Multiple {
    static property = 1;

    

    method() {}
}
`,
				},
			],
		},
		{
			code: `
class MultipleBlocks {
    static {
        console.log("first");
    }

    static {
    }
}
`,
			snapshot: `
class MultipleBlocks {
    static {
        console.log("first");
    }

    static {
    ~~~~~~~~
    Empty static blocks serve no purpose and should be removed for cleaner code.
    }
}
`,
			suggestions: [
				{
					id: "removeEmptyStaticBlock",
					updated: `
class MultipleBlocks {
    static {
        console.log("first");
    }

    
}
`,
				},
			],
		},
	],
	valid: [
		`class Example { static property = 1; }`,
		`class Example { static method() {} }`,
		`
class Example {
    static {
        console.log("initialization");
    }
}
`,
		`
class Example {
    static {
        this.property = 1;
    }
}
`,
		`
class Multiple {
    static {
        console.log("first");
    }

    static {
        console.log("second");
    }
}
`,
	],
});
