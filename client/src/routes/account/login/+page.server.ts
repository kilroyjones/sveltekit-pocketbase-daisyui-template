// Modules
import { pb } from '$lib/db/client';

// Types and constant
import { redirect, type Actions, fail } from '@sveltejs/kit';
import type { ErrorDetails, ErrorLoginUser, FormErrors, UserLogin } from '$lib/types';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

// Types and constants

/**
 *
 * @returns
 */
export const load: PageServerLoad = async ({}) => {
	if (pb.authStore.isValid) {
		throw redirect(301, '/');
	}
	return {};
};

export const actions = {
	/**
	 *
	 * @param param0
	 * @returns
	 */
	login: async ({ request }) => {
		const data = Object.fromEntries(await request.formData()) as UserLogin;

		try {
			await pb.collection('users').authWithPassword(data.email, data.password);
		} catch (err: any) {
			// Here we parse the response from pocketbase and match the form of the object
			// to the ErrorRegisterUser type which is used on the form to provide validation
			// information in case of errors.
			const errorDetails: ErrorDetails = err.response;
			const errors: ErrorLoginUser = Object.entries(errorDetails.data).reduce<FormErrors>(
				(acc, [key, { message }]) => {
					acc[key] = message;
					return acc;
				},
				{} as ErrorLoginUser
			);
			return fail(400, errors);
		}
		throw redirect(307, '/');
	},

	/**
	 *
	 * @param param0
	 */
	google: async ({ locals, cookies }) => {
		const provider = (
			await locals.pocketbase.collection('users').listAuthMethods()
		).authProviders.find((p: any) => p.name === 'google');

		cookies.set('provider', JSON.stringify(provider), {
			httpOnly: true,
			path: `/`
		});

		if (provider) {
			throw redirect(303, provider?.authUrl + env.REDIRECT_URL + provider?.name);
		}
	}
} satisfies Actions;
