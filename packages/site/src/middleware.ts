import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	const lowercasePath = url.pathname.toLowerCase();

	// If the URL has uppercase letters, rewrite to the lowercase version
	if (url.pathname !== lowercasePath) {
		return context.rewrite(lowercasePath);
	}

	return next();
});
