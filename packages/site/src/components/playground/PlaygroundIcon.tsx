import type { JSX } from "react";

const iconPaths = {
	check: ["M20 6 9 17l-5-5"],
	filePlus: [
		"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
		"M14 2v4a2 2 0 0 0 2 2h4",
		"M9 15h6",
		"M12 18v-6",
	],
	link: [
		"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
		"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
	],
	pencil: [
		"M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5Z",
	],
	trash: [
		"M3 6h18",
		"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
		"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
	],
};

export interface PlaygroundIconProps {
	name: keyof typeof iconPaths;
}

export function PlaygroundIcon({ name }: PlaygroundIconProps): JSX.Element {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="1em"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			viewBox="0 0 24 24"
			width="1em"
		>
			{iconPaths[name].map((path) => (
				<path d={path} key={path} />
			))}
		</svg>
	);
}
