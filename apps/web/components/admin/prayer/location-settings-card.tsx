"use client";

import {
	Check,
	Compass,
	Loader2,
	MapPin,
	Navigation,
	Search,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { MapPicker } from "./map-picker";

interface LocationSettingsCardProps {
	locationName: string;
	latitude: number;
	longitude: number;
	timezone: string;
	onChangeLocationName: (val: string) => void;
	onChangeLatitude: (val: number) => void;
	onChangeLongitude: (val: number) => void;
	onChangeTimezone: (val: string) => void;
}

interface GeocodingItem {
	placeId: number;
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
	type: string;
}

interface ReverseGeocodingItem {
	placeId: number;
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
}

function detectIndonesianTimezone(lon: number): string {
	if (lon >= 95 && lon < 115) {
		return "Asia/Jakarta";
	}
	if (lon >= 115 && lon < 125) {
		return "Asia/Makassar";
	}
	if (lon >= 125 && lon <= 142) {
		return "Asia/Jayapura";
	}
	return "Asia/Jakarta";
}

export function LocationSettingsCard({
	locationName,
	latitude,
	longitude,
	timezone,
	onChangeLocationName,
	onChangeLatitude,
	onChangeLongitude,
	onChangeTimezone,
}: LocationSettingsCardProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<GeocodingItem[]>([]);
	const [searching, setSearching] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [reverseLoading, setReverseLoading] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSearch = useCallback(
		async (query: string) => {
			const trimmed = query.trim();
			if (trimmed.length < 2) {
				setSearchResults([]);
				setShowDropdown(false);
				return;
			}

			setSearching(true);
			setSearchError(null);

			const res = await fetchApi<GeocodingItem[]>(
				`/api/admin/geocoding/search?q=${encodeURIComponent(trimmed)}`,
			);

			if (res.data) {
				setSearchResults(res.data);
				setShowDropdown(true);
			} else if (res.error) {
				setSearchError(res.error.message);
				setSearchResults([]);
			}

			setSearching(false);
		},
		[],
	);

	useEffect(() => {
		if (searchQuery.trim().length < 3) {
			setSearchResults([]);
			setShowDropdown(false);
			return;
		}

		const timer = setTimeout(() => {
			handleSearch(searchQuery);
		}, 400);

		return () => clearTimeout(timer);
	}, [searchQuery, handleSearch]);

	const handleSelectLocation = (item: GeocodingItem) => {
		onChangeLatitude(item.latitude);
		onChangeLongitude(item.longitude);
		onChangeLocationName(item.name);

		const detectedTz = detectIndonesianTimezone(item.longitude);
		onChangeTimezone(detectedTz);

		setShowDropdown(false);
		setSearchQuery(item.name);
	};

	const handleCoordinatesFromMap = (newLat: number, newLon: number) => {
		onChangeLatitude(newLat);
		onChangeLongitude(newLon);

		const detectedTz = detectIndonesianTimezone(newLon);
		if (detectedTz !== timezone) {
			onChangeTimezone(detectedTz);
		}
	};

	const handleReverseGeocode = async () => {
		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

		setReverseLoading(true);
		const res = await fetchApi<ReverseGeocodingItem>(
			`/api/admin/geocoding/reverse?lat=${latitude}&lon=${longitude}`,
		);

		if (res.data && res.data.name) {
			onChangeLocationName(res.data.name);
			setSearchQuery(res.data.name);
		}
		setReverseLoading(false);
	};

	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
			<div className="flex items-center justify-between border-b border-slate-100 pb-3">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-xl bg-blue-50 text-[#1D5FA7]">
						<MapPin className="h-4 w-4" />
					</div>
					<div>
						<h2 className="text-sm font-bold text-[#102A46]">
							Lokasi & Koordinat Kampus
						</h2>
						<p className="text-[11px] text-[#64748B]">
							Tentukan titik hisab secara visual di peta atau cari nama tempat.
						</p>
					</div>
				</div>
			</div>

			<div ref={searchContainerRef} className="relative">
				<label className="block text-xs font-semibold text-[#102A46] mb-1.5">
					Cari Lokasi / Kampus / Masjid:
				</label>
				<div className="relative flex items-center">
					<div className="absolute left-3.5 text-slate-400 pointer-events-none">
						{searching ? (
							<Loader2 className="h-4 w-4 animate-spin text-[#1D5FA7]" />
						) : (
							<Search className="h-4 w-4" />
						)}
					</div>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => {
							if (searchResults.length > 0) setShowDropdown(true);
						}}
						placeholder="Ketik nama tempat (mis: UNIDA Gontor, Siman Ponorogo, Masjid Istiqlal)..."
						className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-20 py-2.5 text-xs text-[#172B43] placeholder:text-slate-400 focus:bg-white focus:border-[#1D5FA7] focus:ring-2 focus:ring-[#1D5FA7]/10 focus:outline-none transition"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => {
								setSearchQuery("");
								setSearchResults([]);
								setShowDropdown(false);
							}}
							className="absolute right-12 text-slate-400 hover:text-slate-600 p-1"
							title="Hapus pencarian"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					)}
					<button
						type="button"
						onClick={() => handleSearch(searchQuery)}
						disabled={searching || searchQuery.trim().length < 2}
						className="absolute right-2 px-2.5 py-1 text-[11px] font-bold text-white bg-[#123B6D] hover:bg-[#1D5FA7] rounded-lg transition disabled:opacity-40 cursor-pointer"
					>
						Cari
					</button>
				</div>

				{showDropdown && searchResults.length > 0 && (
					<div className="absolute top-full left-0 right-0 z-[1100] mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
						<div className="p-1.5 divide-y divide-slate-100">
							{searchResults.map((item) => (
								<button
									key={item.placeId}
									type="button"
									onClick={() => handleSelectLocation(item)}
									className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/60 transition group flex items-start gap-2.5"
								>
									<Navigation className="h-4 w-4 text-[#1D5FA7] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<span className="text-xs font-bold text-[#102A46] group-hover:text-[#123B6D] truncate">
												{item.name}
											</span>
											<span className="shrink-0 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
												{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
											</span>
										</div>
										<p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-snug">
											{item.displayName}
										</p>
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{searchError && (
					<p className="mt-1 text-[11px] text-red-500 font-medium">
						{searchError}
					</p>
				)}
			</div>

			<div className="space-y-1.5">
				<MapPicker
					latitude={latitude}
					longitude={longitude}
					onCoordinatesChange={handleCoordinatesFromMap}
					height="320px"
				/>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-[#64748B]">
					<span>
						💡 <strong>Petunjuk:</strong> Klik di peta atau geser pin marker untuk mengatur koordinat secara akurat.
					</span>
					<button
						type="button"
						onClick={handleReverseGeocode}
						disabled={reverseLoading}
						className="inline-flex items-center gap-1 text-[#1D5FA7] hover:underline font-semibold cursor-pointer disabled:opacity-50"
					>
						{reverseLoading ? (
							<Loader2 className="h-3 w-3 animate-spin" />
						) : (
							<Compass className="h-3 w-3" />
						)}
						<span>Ambil nama tempat dari titik pin</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
				<div className="sm:col-span-2">
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Nama Lokasi:
					</label>
					<input
						type="text"
						required
						value={locationName}
						onChange={(e) => onChangeLocationName(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						placeholder="Contoh: UNIDA Gontor, Siman Ponorogo"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Garis Lintang (Latitude):
					</label>
					<input
						type="number"
						step="0.000001"
						required
						value={Number.isNaN(latitude) ? "" : latitude}
						onChange={(e) => {
							const val = Number.parseFloat(e.target.value);
							onChangeLatitude(Number.isNaN(val) ? 0 : val);
						}}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] font-mono focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Garis Bujur (Longitude):
					</label>
					<input
						type="number"
						step="0.000001"
						required
						value={Number.isNaN(longitude) ? "" : longitude}
						onChange={(e) => {
							const val = Number.parseFloat(e.target.value);
							onChangeLongitude(Number.isNaN(val) ? 0 : val);
						}}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] font-mono focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div className="sm:col-span-2 space-y-1.5">
					<label className="block text-xs font-semibold text-[#102A46]">
						Zona Waktu (IANA):
					</label>
					<input
						type="text"
						required
						value={timezone}
						onChange={(e) => onChangeTimezone(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
					<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
						<span className="text-[11px] text-[#64748B]">Pilihan Cepat:</span>
						{[
							{ id: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
							{ id: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
							{ id: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
						].map((tz) => (
							<button
								key={tz.id}
								type="button"
								onClick={() => onChangeTimezone(tz.id)}
								className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
									timezone === tz.id
										? "bg-blue-50 text-[#123B6D] border-blue-300"
										: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
								}`}
							>
								{timezone === tz.id && <Check className="h-2.5 w-2.5 text-[#1D5FA7]" />}
								<span>{tz.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
