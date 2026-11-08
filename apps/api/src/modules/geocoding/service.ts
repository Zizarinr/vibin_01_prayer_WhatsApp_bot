import { createLogger } from "../../core/logger";

const logger = createLogger("geocoding");

export interface GeocodingResult {
	placeId: number;
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
	type: string;
}

export interface ReverseGeocodingResult {
	placeId: number;
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
	address?: {
		road?: string;
		village?: string;
		suburb?: string;
		city?: string;
		county?: string;
		state?: string;
		country?: string;
	};
}

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const searchCache = new Map<string, CacheEntry<GeocodingResult[]>>();
const reverseCache = new Map<string, CacheEntry<ReverseGeocodingResult>>();

const USER_AGENT = "UNIDA-Prayer-Bot/2.0 (admin@unida.gontor.ac.id)";

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) {
		return [];
	}

	const cacheKey = trimmed.toLowerCase();
	const cached = searchCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.data;
	}

	try {
		const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
			trimmed,
		)}&format=json&addressdetails=1&limit=5&countrycodes=id`;

		const res = await fetch(url, {
			headers: {
				"User-Agent": USER_AGENT,
				Accept: "application/json",
			},
			signal: AbortSignal.timeout(6000),
		});

		if (!res.ok) {
			logger.warn("Pencarian lokasi Nominatim gagal merespons sukses.", {
				status: res.status,
				query: trimmed,
			});
			return [];
		}

		interface NominatimRawSearchItem {
			place_id: number;
			name?: string;
			display_name: string;
			lat: string;
			lon: string;
			type?: string;
		}

		const rawList = (await res.json()) as NominatimRawSearchItem[];
		const results: GeocodingResult[] = rawList.map((item) => {
			const lat = Number.parseFloat(item.lat);
			const lon = Number.parseFloat(item.lon);
			const firstPart = item.display_name.split(",")[0] ?? item.display_name;
			const shortName = item.name && item.name.length > 0 ? item.name : firstPart.trim();
			return {
				placeId: item.place_id,
				name: shortName,
				displayName: item.display_name,
				latitude: Number(lat.toFixed(6)),
				longitude: Number(lon.toFixed(6)),
				type: item.type ?? "place",
			};
		});

		searchCache.set(cacheKey, {
			data: results,
			expiresAt: Date.now() + CACHE_TTL_MS,
		});

		return results;
	} catch (error) {
		logger.error("Error saat memanggil Nominatim search.", {
			error: error instanceof Error ? error.message : String(error),
			query: trimmed,
		});
		return [];
	}
}

export async function reverseGeocodeLocation(
	latitude: number,
	longitude: number,
): Promise<ReverseGeocodingResult | null> {
	const roundedLat = Number(latitude.toFixed(4));
	const roundedLon = Number(longitude.toFixed(4));
	const cacheKey = `${roundedLat},${roundedLon}`;

	const cached = reverseCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.data;
	}

	try {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLon}&format=json&addressdetails=1`;

		const res = await fetch(url, {
			headers: {
				"User-Agent": USER_AGENT,
				Accept: "application/json",
			},
			signal: AbortSignal.timeout(6000),
		});

		if (!res.ok) {
			logger.warn("Reverse geocode Nominatim gagal merespons sukses.", {
				status: res.status,
				lat: roundedLat,
				lon: roundedLon,
			});
			return null;
		}

		interface NominatimRawReverseItem {
			place_id: number;
			name?: string;
			display_name: string;
			lat: string;
			lon: string;
			address?: {
				road?: string;
				village?: string;
				suburb?: string;
				city?: string;
				county?: string;
				state?: string;
				country?: string;
			};
		}

		const item = (await res.json()) as NominatimRawReverseItem;
		if (!item || !item.place_id) {
			return null;
		}

		const firstPart = item.display_name.split(",")[0] ?? item.display_name;
		const shortName = item.name && item.name.length > 0 ? item.name : firstPart.trim();
		const result: ReverseGeocodingResult = {
			placeId: item.place_id,
			name: shortName,
			displayName: item.display_name,
			latitude: Number(Number.parseFloat(item.lat).toFixed(6)),
			longitude: Number(Number.parseFloat(item.lon).toFixed(6)),
			address: item.address,
		};

		reverseCache.set(cacheKey, {
			data: result,
			expiresAt: Date.now() + CACHE_TTL_MS,
		});

		return result;
	} catch (error) {
		logger.error("Error saat memanggil Nominatim reverse geocode.", {
			error: error instanceof Error ? error.message : String(error),
			lat: roundedLat,
			lon: roundedLon,
		});
		return null;
	}
}
