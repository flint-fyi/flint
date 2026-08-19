export default {
	"*": "prettier --ignore-unknown --write",
	".changeset/*.md": "node scripts/validate-changesets.ts",
};
