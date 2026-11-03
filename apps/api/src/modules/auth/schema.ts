import { t } from "elysia";

export const loginBodySchema = t.Object({
	email: t.String({ format: "email" }),
	password: t.String({ minLength: 1 }),
});

export const changePasswordBodySchema = t.Object({
	oldPassword: t.String({ minLength: 1 }),
	newPassword: t.String({ minLength: 12 }),
});
