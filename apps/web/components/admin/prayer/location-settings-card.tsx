import { MapPin } from "lucide-react";

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
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<MapPin className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Lokasi & Koordinat Kampus
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Garis Lintang (Latitude):
					</label>
					<input
						type="number"
						step="0.0001"
						required
						value={latitude}
						onChange={(e) => onChangeLatitude(Number.parseFloat(e.target.value))}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Garis Bujur (Longitude):
					</label>
					<input
						type="number"
						step="0.0001"
						required
						value={longitude}
						onChange={(e) => onChangeLongitude(Number.parseFloat(e.target.value))}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div className="sm:col-span-2">
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Zona Waktu (IANA):
					</label>
					<input
						type="text"
						required
						value={timezone}
						onChange={(e) => onChangeTimezone(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
					<p className="mt-1 text-[11px] text-[#64748B]">
						Contoh: <code>Asia/Jakarta</code> (WIB), <code>Asia/Makassar</code> (WITA).
					</p>
				</div>
			</div>
		</div>
	);
}
