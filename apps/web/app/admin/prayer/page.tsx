"use client";

import { RefreshCw, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { AdjustmentsSettingsCard } from "../../../components/admin/prayer/adjustments-settings-card";
import { CalculationSettingsCard } from "../../../components/admin/prayer/calculation-settings-card";
import { LocationSettingsCard } from "../../../components/admin/prayer/location-settings-card";
import {
	PreviewCalculatorCard,
	type PreviewResult,
} from "../../../components/admin/prayer/preview-calculator-card";
import { RecalculateConfirmModal } from "../../../components/admin/prayer/recalculate-confirm-modal";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";

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
			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			{loading ? (
				<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
					<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
					<span className="text-xs">Memuat parameter hisab...</span>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2 space-y-6">
						<form onSubmit={handleSave} className="space-y-6">
							<LocationSettingsCard
								locationName={locationName}
								latitude={latitude}
								longitude={longitude}
								timezone={timezone}
								onChangeLocationName={setLocationName}
								onChangeLatitude={setLatitude}
								onChangeLongitude={setLongitude}
								onChangeTimezone={setTimezone}
							/>

							<CalculationSettingsCard
								methodLabel={methodLabel}
								asrFactor={asrFactor}
								fajrAngle={fajrAngle}
								ishaAngle={ishaAngle}
								onChangeMethodLabel={setMethodLabel}
								onChangeAsrFactor={setAsrFactor}
								onChangeFajrAngle={setFajrAngle}
								onChangeIshaAngle={setIshaAngle}
							/>

							<AdjustmentsSettingsCard
								adjFajr={adjFajr}
								adjSunrise={adjSunrise}
								adjDhuhr={adjDhuhr}
								adjAsr={adjAsr}
								adjMaghrib={adjMaghrib}
								adjIsha={adjIsha}
								hijriAdjustmentDays={hijriAdjustmentDays}
								onChangeAdjFajr={setAdjFajr}
								onChangeAdjSunrise={setAdjSunrise}
								onChangeAdjDhuhr={setAdjDhuhr}
								onChangeAdjAsr={setAdjAsr}
								onChangeAdjMaghrib={setAdjMaghrib}
								onChangeAdjIsha={setAdjIsha}
								onChangeHijriDays={setHijriAdjustmentDays}
							/>

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

					<div>
						<PreviewCalculatorCard
							previewDate={previewDate}
							previewResult={previewResult}
							loadingPreview={loadingPreview}
							onChangePreviewDate={setPreviewDate}
							onRunPreview={runPreview}
						/>
					</div>
				</div>
			)}

			<RecalculateConfirmModal
				isOpen={showRecalcModal}
				onClose={() => setShowRecalcModal(false)}
				onConfirm={handleRecalculate}
			/>
		</div>
	);
}
