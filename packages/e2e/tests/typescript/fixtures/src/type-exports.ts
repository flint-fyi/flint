interface Account {
	name: string;
}

// @ts-expect-error -- Verifies the lint rule independently of the matching compiler error.
export { Account };
