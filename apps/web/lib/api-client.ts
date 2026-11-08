export interface ApiError {
	code: string;
	message: string;
}

export interface ApiResponse<T> {
	data: T | null;
	error: ApiError | null;
}

// URL basis API:
// - NEXT_PUBLIC_API_URL (disarankan dikosongkan di dev/prod agar same-origin
//   "/api/..." lewat rewrite Next.js di next.config.ts → tidak kena CORS).
// - NEXT_PUBLIC_API_BASE_URL didukung sebagai alias lama (dipakai deploy/compose.yml).
// - SSR (server) memakai INTERNAL_API_URL bila keduanya kosong.
const API_BASE =
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	(typeof window === "undefined"
		? process.env.INTERNAL_API_URL || "http://127.0.0.1:3001"
		: "");

export async function fetchApi<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<ApiResponse<T>> {
	const url = endpoint.startsWith("http")
		? endpoint
		: `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

	try {
		const res = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				...options?.headers,
			},
			credentials: "include",
		});

		const json = (await res.json()) as ApiResponse<T>;

		if (!res.ok) {
			return {
				data: null,
				error: json?.error || {
					code: `HTTP_${res.status}`,
					message:
						res.status === 404
							? "Layanan atau data tidak ditemukan."
							: res.status === 503
								? "Layanan server sedang dalam pemeliharaan atau DB belum siap."
								: "Terjadi kendala saat menghubungi server.",
				},
			};
		}

		return json;
	} catch (err) {
		return {
			data: null,
			error: {
				code: "NETWORK_ERROR",
				message:
					err instanceof Error
						? err.message
						: "Gagal terhubung ke server API UNIDA Prayer.",
			},
		};
	}
}
