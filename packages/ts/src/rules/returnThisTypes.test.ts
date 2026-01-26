import rule from "./returnThisTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Builder {
    setValue(): Builder {
        return this;
    }
}
`,
			output: `
class Builder {
    setValue(): this {
        return this;
    }
}
`,
			snapshot: `
class Builder {
    setValue(): Builder {
                ~~~~~~~
                Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Builder {
    value = function(): Builder {
        return this;
    }
}
`,
			output: `
class Builder {
    value = function(): this {
        return this;
    }
}
`,
			snapshot: `
class Builder {
    value = function(): Builder {
                        ~~~~~~~
                        Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Builder {
    setValue = (): Builder => this
}
`,
			output: `
class Builder {
    setValue = (): this => this
}
`,
			snapshot: `
class Builder {
    setValue = (): Builder => this
                   ~~~~~~~
                   Use \`this\` as the return type instead of the class name for polymorphic chaining.
}
`,
		},
		{
			code: `
class Builder {
    setValue = (): Builder => {
        return this;
    }
}
`,
			output: `
class Builder {
    setValue = (): this => {
        return this;
    }
}
`,
			snapshot: `
class Builder {
    setValue = (): Builder => {
                   ~~~~~~~
                   Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Builder {
    setValue(): Builder {
        const self = this;
        return self;
    }
}
`,
			output: `
class Builder {
    setValue(): this {
        const self = this;
        return self;
    }
}
`,
			snapshot: `
class Builder {
    setValue(): Builder {
                ~~~~~~~
                Use \`this\` as the return type instead of the class name for polymorphic chaining.
        const self = this;
        return self;
    }
}
`,
		},
		{
			code: `
class Builder {
    setValue(): Builder | undefined {
        return this;
    }
}
`,
			output: `
class Builder {
    setValue(): this | undefined {
        return this;
    }
}
`,
			snapshot: `
class Builder {
    setValue(): Builder | undefined {
                ~~~~~~~
                Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Animal<T> {
    eat(): Animal<T> {
        return this;
    }
}
`,
			output: `
class Animal<T> {
    eat(): this {
        return this;
    }
}
`,
			snapshot: `
class Animal<T> {
    eat(): Animal<T> {
           ~~~~~~~~~
           Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Builder {
    get self(): Builder {
        return this;
    }
}
`,
			output: `
class Builder {
    get self(): this {
        return this;
    }
}
`,
			snapshot: `
class Builder {
    get self(): Builder {
                ~~~~~~~
                Use \`this\` as the return type instead of the class name for polymorphic chaining.
        return this;
    }
}
`,
		},
		{
			code: `
class Builder {
    setValue(): Builder {
        if (Math.random() > 0.5) {
            return this;
        }
        return this;
    }
}
`,
			output: `
class Builder {
    setValue(): this {
        if (Math.random() > 0.5) {
            return this;
        }
        return this;
    }
}
`,
			snapshot: `
class Builder {
    setValue(): Builder {
                ~~~~~~~
                Use \`this\` as the return type instead of the class name for polymorphic chaining.
        if (Math.random() > 0.5) {
            return this;
        }
        return this;
    }
}
`,
		},
	],
	valid: [
		`class Builder { setValue() { return this; } }`,
		`class Builder { setValue(): this { return this; } }`,
		`class Builder { setValue(): Builder { return new Builder(); } }`,
		`class Builder { setValue(): any { return this; } }`,
		`class Builder { setValue(this: Builder): Builder { return this; } }`,
		`class Builder { setValue(value: Builder): Builder { return value; } }`,
		`class Derived extends Base { setValue(): Base { return this; } }`,
		`class Builder { static create(): Builder { return new Builder(); } }`,
		`class Builder { setValue(): Builder { } }`,
		`class Builder { setValue(): string { return ""; } }`,
		`class Builder { setValue(): void { } }`,
		`class Builder { private getValue = (): Builder => new Builder() }`,
		`class Builder { setValue(): Builder { return someOtherBuilder; } }`,
	],
});
