import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

export interface RemarkAutoTwoslashOptions {
	exclude: RegExp;
}

export function remarkAutoTwoslash({ exclude }: RemarkAutoTwoslashOptions) {
	return function createTransformer() {
		return function transformer(tree: Root, file: VFile): void {
			const filePath = file.path || "";
			if (exclude.test(filePath)) {
				return;
			}

			visit(tree, "code", (node) => {
				if (node.lang?.startsWith("ts")) {
					if (!node.meta?.includes("twoslash")) {
						node.meta = node.meta ? `${node.meta} twoslash` : "twoslash";
					}
				}
			});
		};
	};
}
