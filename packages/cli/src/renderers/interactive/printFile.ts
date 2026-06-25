import type { FileReport, LinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import type { Presenter } from "../../presenters/types.ts";

export async function printFile(
	host: LinterHost,
	filePath: string,
	presenter: Presenter,
	reports: FileReport[],
) {
	return (
		await Array.fromAsync(
			presenter.renderFile({
				file: {
					filePath,
					text: nullThrows(
						host.readFileSync(filePath),
						"Expected reported file to exist.",
					),
				},
				reports,
			}),
		)
	)
		.join("")
		.trim();
}
