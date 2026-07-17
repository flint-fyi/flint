export function pluralize(count: number, label: string) {
	return `${count} ${label}${count === 1 ? "" : "s"}`;
}
