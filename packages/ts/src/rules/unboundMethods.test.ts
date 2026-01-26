import { ruleTester } from "./ruleTester.ts";
import rule from "./unboundMethods.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `class Logger {
    log(message: string): void {
        console.log(message);
    }
}
const logger = new Logger();
const unbound = logger.log;`,
			snapshot: `class Logger {
    log(message: string): void {
        console.log(message);
    }
}
const logger = new Logger();
const unbound = logger.log;
                ~~~~~~~~~~
                This method may lose its 'this' context.`,
		},
		{
			code: `class Service {
    fetch(): Promise<void> {
        return Promise.resolve();
    }
}
const service = new Service();
setTimeout(service.fetch, 1000);`,
			snapshot: `class Service {
    fetch(): Promise<void> {
        return Promise.resolve();
    }
}
const service = new Service();
setTimeout(service.fetch, 1000);
           ~~~~~~~~~~~~~
           This method may lose its 'this' context.`,
		},
	],
	valid: [
		`class Logger {
    log(message: string): void {
        console.log(message);
    }
}
const logger = new Logger();
logger.log("hello");`,
		`class Service {
    fetch(): Promise<void> {
        return Promise.resolve();
    }
}
const service = new Service();
setTimeout(() => service.fetch(), 1000);`,
		`class Handler {
    handle = (): void => {
        console.log(this);
    };
}
const handler = new Handler();
const bound = handler.handle;`,
		`const obj = {
    method(): void {}
};
const unbound = obj.method;`,
	],
});
