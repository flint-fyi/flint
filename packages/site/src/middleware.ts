import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
	if (context.request.url !== context.request.url.toLowerCase()) {
		return Response.redirect(context.request.url.toLowerCase(), 307);
	}

	return next();
});
