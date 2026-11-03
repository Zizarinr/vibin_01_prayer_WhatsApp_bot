"use client";

import {
	AlertCircle,
	Check,
	CheckCircle2,
	Compass,
	Eye,
	HelpCircle,
	MapPin,
	RefreshCw,
	RotateCcw,
	Save,
	Sliders,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface SettingsData {
	location: {
		name: string;
		latitude: number;
		longitude: number;
		timezone: string;
	};
	prayer_calculation: {
		fajrAngle: number;
		ishaAngle: number;
		asrFactor: 1 | 2;
		methodLabel: string;
	};
	prayer_adjustments: {
		FAJR: number;
		SUNRISE: number;
		DHUHR: number;
		ASR: number;
		MAGHRIB: number;
		ISHA: number;
	};
	reminder_settings: {
		enabled: boolean;
		preReminderEnabled: boolean;
		adhanReminderEnabled: boolean;
		preReminderMinutes: number;
		lateGraceMinutes: number;
	};
	hijri_settings: {
		adjustmentDays: number;
	};
	content_settings: {
		includeHadith: boolean;
		sendingEnabled: boolean;
	};
}

interface PreviewResult {
	input: {
		dateLocal: string;
		latitude: number;
		longitude: number;
	};
	times: Record<
		string,
		{
			displayName: string;
			time24: string;
			timeLabel: string;
		}
	>;
	isFriday: boolean;
}

export default function AdminPrayerPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [recalculating, setRecalculating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Settings Form State
	const [locationName, setLocationName] = useState("");
	const [latitude, setLatitude] = useState<number>(-7.8652);
	const [longitude, setLongitude] = useState<number>(111.4617);
	const [timezone, setTimezone] = useState("Asia/Jakarta");
	const [fajrAngle, setFajrAngle] = useState<number>(20.0);
	const [ishaAngle, setIshaAngle] = useState<number>(18.0);
	const [asrFactor, setAsrFactor] = useState<1 | 2>(1);
	const [methodLabel, setMethodLabel] = useState("Kemenag");
	const [adjFajr, setAdjFajr] = useState(0);
	const [adjSunrise, setAdjSunrise] = useState(0);
	const [adjDhuhr, setAdjDhuhr] = useState(0);
	const [adjAsr, setAdjAsr] = useState(0);
	const [adjMaghrib, setAdjMaghrib] = useState(0);
	const [adjIsha, setAdjIsha] = useState(0);
	const [hijriAdjustmentDays, setHijriAdjustmentDays] = useState(0);

	// Preview Hisab State
	const [previewDate, setPreviewDate] = useState("");
	const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	// Confirmation Modal for Recalculate
	const [showRecalcModal, setShowRecalcModal] = useState(false);

	const loadSettings = useCallback(async () => {
		setLoading(true);
		setError(null);
		setPreviewDate(new Date().toISOString().slice(0, 10));
		const res = await fetchApi<SettingsData>("/api/admin/settings");
		if (res.data) {
			const s = res.data;
			setLocationName(s.location.name);
			setLatitude(s.location.latitude);
			setLongitude(s.location.longitude);
			setTimezone(s.location.timezone);
			setFajrAngle(s.prayer_calculation.fajrAngle);
			setIshaAngle(s.prayer_calculation.ishaAngle);
			setAsrFactor(s.prayer_calculation.asrFactor);
			setMethodLabel(s.prayer_calculation.methodLabel);
			setAdjFajr(s.prayer_adjustments.FAJR ?? 0);
			setAdjSunrise(s.prayer_adjustments.SUNRISE ?? 0);
			setAdjDhuhr(s.prayer_adjustments.DHUHR ?? 0);
			setAdjAsr(s.prayer_adjustments.ASR ?? 0);
			setAdjMaghrib(s.prayer_adjustments.MAGHRIB ?? 0);
			setAdjIsha(s.prayer_adjustments.ISHA ?? 0);
			setHijriAdjustmentDays(s.hijri_settings.adjustmentDays ?? 0);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	// Jalankan preview kalkulasi hisab
	const runPreview = async () => {
		setLoadingPreview(true);
		const res = await fetchApi<PreviewResult>("/api/admin/prayer/preview", {
			method: "POST",
			body: JSON.stringify({
				dateLocal: previewDate,
				latitude,
				longitude,
				timezone,
				fajrAngle,
				ishaAngle,
				asrFactor,
				adjustmentsMinutes: {
					FAJR: adjFajr,
					SUNRISE: adjSunrise,
					DHUHR: adjDhuhr,
					ASR: adjAsr,
					MAGHRIB: adjMaghrib,
					ISHA: adjIsha,
				},
			}),
		});

		if (res.data) {
			setPreviewResult(res.data);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoadingPreview(false);
	};

	// Simpan pengaturan
	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccessMsg(null);

		const res = await fetchApi<{
			settings: SettingsData;
			recalculateSummary?: {
				generatedCount: number;
				preservedCount: number;
			};
		}>("/api/admin/settings", {
			method: "PATCH",
			body: JSON.stringify({
				location: {
					name: locationName,
					latitude,
					longitude,
					timezone,
				},
				prayer_calculation: {
					fajrAngle,
					ishaAngle,
					asrFactor,
					methodLabel,
				},
				prayer_adjustments: {
					FAJR: adjFajr,
					SUNRISE: adjSunrise,
					DHUHR: adjDhuhr,
					ASR: adjAsr,
					MAGHRIB: adjMaghrib,
					ISHA: adjIsha,
				},
				hijri_settings: {
					adjustmentDays: hijriAdjustmentDays,
				},
			}),
		});

		if (res.data) {
			setSuccessMsg(
				"Pengaturan hisab berhasil diperbarui. Jadwal PENDING masa depan otomatis dihitung ulang.",
			);
		} else if (res.error) {
			setError(res.error.message);
		}
		setSaving(false);
	};

	// Eksekusi Recalculate
	const handleRecalculate = async () => {
		setShowRecalcModal(false);
		setRecalculating(true);
		setError(null);
		setSuccessMsg(null);

		const res = await fetchApi<{
			generatedCount: number;
			preservedCount: number;
		}>("/api/admin/prayer/recalculate", {
			method: "POST",
		});

		if (res.data) {
			setSuccessMsg(
				`Pembaruan hisab berhasil! ${res.data.generatedCount} jadwal telah dipersiapkan untuk 7 hari ke depan, ${res.data.preservedCount} data riwayat dipertahankan.`,
			);
		} else if (res.error) {
			setError(res.error.message);
		}
		setRecalculating(false);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Jadwal & Parameter Hisab
					</h1>
					<p className="text-xs text-[#64748B]">
						Kelola koordinat lokasi, metode hisab, koreksi menit (ihtiyath), dan kalkulasi jadwal.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowRecalcModal(true)}
						disabled={recalculating || loading}
						className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-[#123B6D] border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50"
					>
						<RotateCcw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
						<span>{recalculating ? "Menghitung..." : "Hitung Ulang Jadwal (Recalculate)"}</span>
					</button>
				</div>
			</div>

			{/* Alert Messages */}
			{error && (
				<div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
					<AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
					<span className="flex-1 font-medium">{error}</span>
					<button
						type="button"
						onClick={() => setError(null)}
						className="text-rose-600 hover:underline"
					>
						Tutup
					</button>
				</div>
			)}

			{successMsg && (
				<div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
					<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
					<span className="flex-1 font-medium">{successMsg}</span>
					<button
						type="button"
						onClick={() => setSuccessMsg(null)}
						className="text-emerald-600 hover:underline"
					>
						Tutup
					</button>
				</div>
			)}

			{loading ? (
				<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
					<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
					<span className="text-xs">Memuat parameter hisab...</span>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Left / Main Column: Settings Form */}
					<div className="lg:col-span-2 space-y-6">
						<form onSubmit={handleSave} className="space-y-6">
							{/* Card 1: Lokasi & Koordinat */}
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
											onChange={(e) => setLocationName(e.target.value)}
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
											onChange={(e) => setLatitude(Number.parseFloat(e.target.value))}
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
											onChange={(e) => setLongitude(Number.parseFloat(e.target.value))}
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
											onChange={(e) => setTimezone(e.target.value)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
										<p className="mt-1 text-[11px] text-[#64748B]">
											Contoh: <code>Asia/Jakarta</code> (WIB), <code>Asia/Makassar</code> (WITA).
										</p>
									</div>
								</div>
							</div>

							{/* Card 2: Metode Perhitungan */}
							<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
								<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
									<Compass className="h-4 w-4 text-[#1D5FA7]" />
									<h2 className="text-sm font-bold text-[#102A46]">
										Metode & Parameter Hisab
									</h2>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">
											Standar Metode:
										</label>
										<input
											type="text"
											value={methodLabel}
											onChange={(e) => setMethodLabel(e.target.value)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>

									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">
											Madzhab Waktu Ashar:
										</label>
										<select
											value={asrFactor}
											onChange={(e) => setAsrFactor(Number(e.target.value) as 1 | 2)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										>
											<option value={1}>Syafi'i, Maliki, Hanbali (Bayangan 1x)</option>
											<option value={2}>Hanafi (Bayangan 2x)</option>
										</select>
									</div>

									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">
											Sudut Fajar / Subuh (derajat):
										</label>
										<input
											type="number"
											step="0.1"
											value={fajrAngle}
											onChange={(e) => setFajrAngle(Number.parseFloat(e.target.value))}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
										<p className="mt-1 text-[11px] text-[#64748B]">Kemenag RI: 20.0°</p>
									</div>

									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">
											Sudut Isya (derajat):
										</label>
										<input
											type="number"
											step="0.1"
											value={ishaAngle}
											onChange={(e) => setIshaAngle(Number.parseFloat(e.target.value))}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
										<p className="mt-1 text-[11px] text-[#64748B]">Kemenag RI: 18.0°</p>
									</div>
								</div>
							</div>

							{/* Card 3: Koreksi Menit (Ihtiyath) */}
							<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
								<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
									<Sliders className="h-4 w-4 text-[#1D5FA7]" />
									<h2 className="text-sm font-bold text-[#102A46]">
										Koreksi Menit Shalat (Ihtiyath: -10 s/d +10 Menit)
									</h2>
								</div>

								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Subuh:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjFajr}
											onChange={(e) => setAdjFajr(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Terbit:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjSunrise}
											onChange={(e) => setAdjSunrise(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Dzuhur / Jumat:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjDhuhr}
											onChange={(e) => setAdjDhuhr(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Ashar:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjAsr}
											onChange={(e) => setAdjAsr(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Maghrib:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjMaghrib}
											onChange={(e) => setAdjMaghrib(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#102A46] mb-1">Isya:</label>
										<input
											type="number"
											min={-10}
											max={10}
											value={adjIsha}
											onChange={(e) => setAdjIsha(Number.parseInt(e.target.value, 10) || 0)}
											className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
										/>
									</div>
								</div>

								<div className="border-t border-slate-100 pt-3">
									<label className="block text-xs font-semibold text-[#102A46] mb-1">
										Penyesuaian Hari Hijriyah (-2 s/d +2 hari):
									</label>
									<input
										type="number"
										min={-2}
										max={2}
										value={hijriAdjustmentDays}
										onChange={(e) => setHijriAdjustmentDays(Number.parseInt(e.target.value, 10) || 0)}
										className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-center font-bold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
									/>
									<span className="ml-2 text-[11px] text-[#64748B]">
										Digunakan untuk menyelaraskan tanggal hisab dengan hilal ru'yatul hilal lokal.
									</span>
								</div>
							</div>

							{/* Submit Button */}
							<div className="flex items-center justify-end">
								<button
									type="submit"
									disabled={saving}
									className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition disabled:opacity-50"
								>
									<Save className="h-4 w-4" />
									<span>{saving ? "Menyimpan..." : "Simpan Parameter Hisab"}</span>
								</button>
							</div>
						</form>
					</div>

					{/* Right Column: Preview Hisab Calculator */}
					<div className="space-y-6">
						<div className="rounded-3xl border border-blue-200/80 bg-white p-5 shadow-2xs space-y-4">
							<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
								<Eye className="h-4 w-4 text-[#1D5FA7]" />
								<h2 className="text-sm font-bold text-[#102A46]">
									Preview Kalkulasi Hisab
								</h2>
							</div>

							<p className="text-xs text-[#64748B]">
								Simulasikan hasil jadwal shalat secara langsung tanpa harus menyimpan perubahan ke database.
							</p>

							<div>
								<label className="block text-xs font-semibold text-[#102A46] mb-1">
									Pilih Tanggal Uji Coba:
								</label>
								<div className="flex gap-2">
									<input
										type="date"
										value={previewDate}
										onChange={(e) => setPreviewDate(e.target.value)}
										className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
									/>
									<button
										type="button"
										onClick={runPreview}
										disabled={loadingPreview}
										className="rounded-xl bg-[#1D5FA7] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#123B6D] transition disabled:opacity-50"
									>
										{loadingPreview ? "..." : "Hitung"}
									</button>
								</div>
							</div>

							{previewResult && (
								<div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 space-y-3">
									<div className="flex items-center justify-between text-xs font-bold text-[#123B6D]">
										<span>Hasil Jadwal ({previewDate})</span>
										{previewResult.isFriday && (
											<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
												Hari Jumat
											</span>
										)}
									</div>

									<div className="space-y-1.5">
										{Object.entries(previewResult.times).map(([key, item]) => (
											<div
												key={key}
												className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs shadow-2xs"
											>
												<span className="font-medium text-[#102A46]">
													{item.displayName}
												</span>
												<span className="font-bold text-[#123B6D]">
													{item.timeLabel}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="rounded-xl bg-slate-50 p-3 text-[11px] text-[#64748B] flex items-start gap-2">
								<HelpCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
								<span>
									Waktu adzan dan pre-reminder yang dikirim ke WhatsApp bersumber dari parameter di atas.
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi Recalculate */}
			{showRecalcModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-amber-600">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
								<RotateCcw className="h-5 w-5" />
							</div>
							<h3 className="text-base font-bold text-[#102A46]">
								Konfirmasi Hitung Ulang (Recalculate)
							</h3>
						</div>

						<p className="text-xs text-[#64748B] leading-relaxed">
							Tindakan ini akan membatalkan seluruh jadwal pesan <strong>PENDING</strong> masa depan, lalu membuat ulang jadwal pengingat untuk <strong>7 hari ke depan</strong> berdasarkan parameter hisab saat ini.
						</p>

						<div className="rounded-xl bg-amber-50/80 p-3 text-[11px] text-amber-900 flex items-start gap-2">
							<Check className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
							<span>
								Pesan yang sudah berstatus <strong>SENT (Terkirim)</strong> atau <strong>FAILED</strong> tidak akan diubah atau dikirim ulang.
							</span>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowRecalcModal(false)}
								className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
							>
								Batalkan
							</button>
							<button
								type="button"
								onClick={handleRecalculate}
								className="rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D5FA7] transition"
							>
								Ya, Hitung Ulang Sekarang
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
