import { z } from "zod/v4";

export const options: z.ZodObject<{
	"cache-ignore": z.ZodOptional<z.ZodBoolean>;
	"cache-location": z.ZodOptional<z.ZodString>;
	fix: z.ZodOptional<z.ZodBoolean>;
	"fix-suggestions": z.ZodOptional<z.ZodArray<z.ZodString>>;
	interactive: z.ZodOptional<z.ZodBoolean>;
	presenter: z.ZodOptional<
		z.ZodEnum<{ brief: "brief"; detailed: "detailed"; github: "github" }>
	>;
	"skip-formatting": z.ZodOptional<z.ZodBoolean>;
	"skip-language-reports": z.ZodOptional<z.ZodBoolean>;
	watch: z.ZodOptional<z.ZodBoolean>;
}> = z.object({
	"cache-ignore": z
		.boolean()
		.optional()
		.describe(
			"Whether to ignore any existing cache data on disk. This will cause a full re-lint of all linted files.",
		),
	"cache-location": z
		.string()
		.optional()
		.describe("The path to the cache file or directory to use.")
		.meta({ placeholder: "path" }),
	fix: z
		.boolean()
		.optional()
		.describe("Enables auto-fixing 'fixes' from rule reports."),
	"fix-suggestions": z
		.array(z.string())
		.optional()
		.describe(
			"Enables auto-fixing any number of specific 'suggestions' from rule reports.",
		)
		.meta({ placeholder: "suggestion" }),
	interactive: z
		.boolean()
		.optional()
		.describe(
			"Whether to run Flint with an interactive 'one file at a time' viewer.",
		),
	presenter: z
		.enum(["brief", "detailed", "github"])
		.optional()
		.describe(
			"Which 'presenter' to output results using: brief (default) or detailed.",
		),
	"skip-formatting": z
		.boolean()
		.optional()
		.describe("Whether to skip formatting after linting."),
	"skip-language-reports": z
		.boolean()
		.optional()
		.describe("Whether to skip generating language reports after linting."),
	watch: z
		.boolean()
		.optional()
		.describe(
			"Whether to keep the linting process running, re-linting files as they change.",
		),
});

export type OptionsValues = z.output<typeof options>;
