export default {
	"*": "prettier --ignore-unknown --write",
	".changeset/!(README).md": "node scripts/validate-changesets.ts",
};
