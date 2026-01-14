import type { FileReport } from "@flint.fyi/core";
import * as fs from "node:fs";

import type { Presenter } from "../../presenters/types.ts";

export async function printFile(
	filePath: string,
	presenter: Presenter,
	reports: FileReport[],
) {
	return (
		await Array.fromAsync(
			presenter.renderFile({
				file: {
					filePath,
					text: fs.readFileSync(filePath, "utf-8"),
				},
				reports,
			}),
		)
	)
		.join("")
		.trim();
}
