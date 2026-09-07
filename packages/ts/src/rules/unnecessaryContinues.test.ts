import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryContinues.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
while (ready) {
    continue;
}
`,
			output: `
while (ready) {
    
}
`,
			snapshot: `
while (ready) {
    continue;
    ~~~~~~~~
    This \`continue\` statement does not change control flow.
}
`,
		},
		{
			code: `
while (ready) {
    try {
        work();
    } finally {
        while (nested) continue;
    }
}
`,
			output: `
while (ready) {
    try {
        work();
    } finally {
        while (nested) ;
    }
}
`,
			snapshot: `
while (ready) {
    try {
        work();
    } finally {
        while (nested) continue;
                       ~~~~~~~~
                       This \`continue\` statement does not change control flow.
    }
}
`,
		},
		{
			code: `
do continue; while (ready);
for (;;) continue
for (const key in record) continue;
for (const value of values) continue;
`,
			output: `
do ; while (ready);
for (;;) ;
for (const key in record) ;
for (const value of values) ;
`,
			snapshot: `
do continue; while (ready);
   ~~~~~~~~
   This \`continue\` statement does not change control flow.
for (;;) continue
         ~~~~~~~~
         This \`continue\` statement does not change control flow.
for (const key in record) continue;
                          ~~~~~~~~
                          This \`continue\` statement does not change control flow.
for (const value of values) continue;
                            ~~~~~~~~
                            This \`continue\` statement does not change control flow.
`,
		},
		{
			code: `
async function read(stream: AsyncIterable<string>) {
    for await (const value of stream) {
        if (value) {
            continue;
        } else continue;
    }
}
`,
			output: `
async function read(stream: AsyncIterable<string>) {
    for await (const value of stream) {
        if (value) {
            
        } else ;
    }
}
`,
			snapshot: `
async function read(stream: AsyncIterable<string>) {
    for await (const value of stream) {
        if (value) {
            continue;
            ~~~~~~~~
            This \`continue\` statement does not change control flow.
        } else continue;
               ~~~~~~~~
               This \`continue\` statement does not change control flow.
    }
}
`,
		},
		{
			code: `
outer: inner: while (ready) {
    branch: {
        continue outer;
    }
}
first: second: while (ready) {
    continue second;
}
`,
			output: `
outer: inner: while (ready) {
    branch: {
        
    }
}
first: second: while (ready) {
    
}
`,
			snapshot: `
outer: inner: while (ready) {
    branch: {
        continue outer;
        ~~~~~~~~
        This \`continue\` statement does not change control flow.
    }
}
first: second: while (ready) {
    continue second;
    ~~~~~~~~
    This \`continue\` statement does not change control flow.
}
`,
		},
		{
			code: `
loop: for (;;) continue loop;
`,
			output: `
loop: for (;;) ;
`,
			snapshot: `
loop: for (;;) continue loop;
               ~~~~~~~~
               This \`continue\` statement does not change control flow.
`,
		},
		{
			code: `
while (ready) {
    with (state) continue;
}
`,
			output: `
while (ready) {
    with (state) ;
}
`,
			snapshot: `
while (ready) {
    with (state) continue;
                 ~~~~~~~~
                 This \`continue\` statement does not change control flow.
}
`,
		},
		{
			code: `
while (ready) {
    try {
        continue;
    } catch {
        continue;
    } finally {
        cleanup();
    }
}
`,
			output: `
while (ready) {
    try {
        
    } catch {
        
    } finally {
        cleanup();
    }
}
`,
			snapshot: `
while (ready) {
    try {
        continue;
        ~~~~~~~~
        This \`continue\` statement does not change control flow.
    } catch {
        continue;
        ~~~~~~~~
        This \`continue\` statement does not change control flow.
    } finally {
        cleanup();
    }
}
`,
		},
		{
			code: `
while (ready) {
    try {
        continue;
    } catch {
        continue;
    }
}
`,
			output: `
while (ready) {
    try {
        
    } catch {
        
    }
}
`,
			snapshot: `
while (ready) {
    try {
        continue;
        ~~~~~~~~
        This \`continue\` statement does not change control flow.
    } catch {
        continue;
        ~~~~~~~~
        This \`continue\` statement does not change control flow.
    }
}
`,
		},
		{
			code: `
while (ready) {
    switch (value) {
        case 0:
            continue;
        case 1:
        default:
    }
}
`,
			output: `
while (ready) {
    switch (value) {
        case 0:
            
        case 1:
        default:
    }
}
`,
			snapshot: `
while (ready) {
    switch (value) {
        case 0:
            continue;
            ~~~~~~~~
            This \`continue\` statement does not change control flow.
        case 1:
        default:
    }
}
`,
		},
		{
			code: `
while (ready) {
    switch (value) {
        case 0:
            work();
            break;
        default:
            continue;
    }
}
`,
			output: `
while (ready) {
    switch (value) {
        case 0:
            work();
            break;
        default:
            
    }
}
`,
			snapshot: `
while (ready) {
    switch (value) {
        case 0:
            work();
            break;
        default:
            continue;
            ~~~~~~~~
            This \`continue\` statement does not change control flow.
    }
}
`,
		},
		{
			code: `
while (ready) {
    // retained
    continue; // retained too
}
`,
			output: `
while (ready) {
    // retained
     // retained too
}
`,
			snapshot: `
while (ready) {
    // retained
    continue; // retained too
    ~~~~~~~~
    This \`continue\` statement does not change control flow.
}
`,
		},
		{
			code: `
while (ready) /* retained */ continue; // retained too
`,
			output: `
while (ready) /* retained */ ; // retained too
`,
			snapshot: `
while (ready) /* retained */ continue; // retained too
                             ~~~~~~~~
                             This \`continue\` statement does not change control flow.
`,
		},
		{
			code: `
while (ready) {
    continue /* explanation */;
}
`,
			snapshot: `
while (ready) {
    continue /* explanation */;
    ~~~~~~~~
    This \`continue\` statement does not change control flow.
}
`,
		},
	],
	valid: [
		`while (ready) { continue; work(); }`,
		`while (ready) { continue; return; }`,
		`while (ready) { continue; throw new Error(); }`,
		`while (ready) { continue; break; }`,
		`outer: while (ready) { while (nested) { continue outer; } }`,
		`label: { while (ready) { continue label; } }`,
		`while (ready) { continue missing; }`,
		`continue;`,
		`while (ready) { (() => { continue; }); }`,
		`while (ready) { switch (value) { case 0: continue; default: work(); } }`,
		`while (ready) { switch (value) { case 0: continue; work(); } }`,
		`while (ready) { switch (value) { case 0: continue; } work(); }`,
		`while (ready) { try { work(); } finally { continue; } }`,
		`while (ready) { try { continue; work(); } catch {} }`,
		`while (ready) { with (state) continue; work(); }`,
		`while (ready) { if (ready) continue; work(); }`,
	],
});
