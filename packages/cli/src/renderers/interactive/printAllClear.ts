import { styleText } from "node:util";

export function printAllClear(): string {
	return styleText("green", "No lint reports. Yay!");
}
