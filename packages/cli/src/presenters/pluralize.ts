export function pluralize(count: number, label: string): string {
	return `${count} ${label}${count !== 1 ? "s" : ""}`;
}
