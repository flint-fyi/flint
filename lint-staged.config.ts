export default {
	"*": "prettier --experimental-cli --ignore-unknown --write",
	".changeset/*.md": "node scripts/validate-changesets.ts",
};
