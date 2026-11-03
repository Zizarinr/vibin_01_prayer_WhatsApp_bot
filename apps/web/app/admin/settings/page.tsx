"use client";

import {
	Activity,
	AlertCircle,
	CheckCircle2,
	Clock,
	Database,
	Info,
	Power,
	Radio,
	RefreshCw,
	Save,
	Server,
	ShieldAlert,
	Sliders,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface SettingsPayload {
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

interface SystemStatusData {
	api: "ok";
	database: { ok: boolean; latencyMs: number };
	worker: {
		state: "HEALTHY" | "WARNING" | "OFFLINE";
		lastHeartbeatAt: string | null;
		workerId: string | null;
	};
	waha: {
		status: string;
		session: string;
	};
}

export default function AdminSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Settings State
	const [sendingEnabled, setSendingEnabled] = useState(true);
	const [includeHadith, setIncludeHadith] = useState(true);
	const [reminderEnabled, setReminderEnabled] = useState(true);
	const [adhanEnabled, setAdhanEnabled] = useState(true);
	const [preReminderEnabled, setPreReminderEnabled] = useState(true);
	const [preReminderMinutes, setPreReminderMinutes] = useState(3);
	const [lateGraceMinutes, setLateGraceMinutes] = useState(5);

	// Diagnostics
	const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);

	// Modal Kill-Switch confirmation
	const [showKillSwitchModal, setShowKillSwitchModal] = useState(false);
	const [pendingKillSwitchState, setPendingKillSwitchState] = useState(false);

	const loadData = useCallback(async () => {
		setLoading(true);
		setError(null);

		const [sRes, sysRes] = await Promise.all([
			fetchApi<SettingsPayload>("/api/admin/settings"),
			fetchApi<SystemStatusData>("/api/admin/system/status"),
		]);

		if (sRes.data) {
			const s = sRes.data;
			setSendingEnabled(s.content_settings.sendingEnabled ?? true);
			setIncludeHadith(s.content_settings.includeHadith ?? true);
			setReminderEnabled(s.reminder_settings.enabled ?? true);
			setAdhanEnabled(s.reminder_settings.adhanReminderEnabled ?? true);
			setPreReminderEnabled(s.reminder_settings.preReminderEnabled ?? true);
			setPreReminderMinutes(s.reminder_settings.preReminderMinutes ?? 3);
			setLateGraceMinutes(s.reminder_settings.lateGraceMinutes ?? 5);
		} else if (sRes.error) {
			setError(sRes.error.message);
		}

		if (sysRes.data) {
			setSystemStatus(sysRes.data);
		}

		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleToggleKillSwitch = () => {
		setPendingKillSwitchState(!sendingEnabled);
		setShowKillSwitchModal(true);
	};

	const confirmKillSwitch = async () => {
		setShowKillSwitchModal(false);
		setSaving(true);
		setError(null);

		const res = await fetchApi<{ settings: SettingsPayload }>("/api/admin/settings", {
			method: "PATCH",
			body: JSON.stringify({
				content_settings: {
					sendingEnabled: pendingKillSwitchState,
				},
			}),
		});

		if (res.data) {
			setSendingEnabled(pendingKillSwitchState);
			setSuccessMsg(
				pendingKillSwitchState
					? "Pengiriman pesan shalat berhasil diaktifkan kembali."
					: "Kill-switch aktif: Semua pengiriman pesan shalat ditahan sementara.",
			);
		} else if (res.error) {
			setError(res.error.message);
		}
		setSaving(false);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccessMsg(null);

		const res = await fetchApi<{ settings: SettingsPayload }>("/api/admin/settings", {
			method: "PATCH",
			body: JSON.stringify({
				content_settings: {
					sendingEnabled,
					includeHadith,
				},
				reminder_settings: {
					enabled: reminderEnabled,
					adhanReminderEnabled: adhanEnabled,
					preReminderEnabled,
					preReminderMinutes,
					lateGraceMinutes,
				},
			}),
		});

		if (res.data) {
			setSuccessMsg("Konfigurasi sistem berhasil disimpan dan diperbarui.");
		} else if (res.error) {
			setError(res.error.message);
		}
		setSaving(false);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Pengaturan Sistem & Pengiriman
					</h1>
					<p className="text-xs text-[#64748B]">
						Kontrol darurat pengiriman pesan (kill-switch), kebijakan reminder, dan diagnostik server.
					</p>
				</div>
				<button
					type="button"
					onClick={() => loadData()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan Status</span>
				</button>
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
					<span className="text-xs">Memuat konfigurasi sistem...</span>
				</div>
			) : (
				<div className="space-y-6">
					{/* EMERGENCY KILL SWITCH CARD */}
					<div
						className={`rounded-3xl border p-6 shadow-xs transition ${
							sendingEnabled
								? "bg-white border-slate-200/80"
								: "bg-rose-50/70 border-rose-300"
						}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Power
										className={`h-5 w-5 ${
											sendingEnabled ? "text-emerald-600" : "text-rose-600"
										}`}
									/>
									<h2 className="text-base font-bold text-[#102A46]">
										Kill-Switch Pengiriman Pesan Global
									</h2>
								</div>
								<p className="text-xs text-[#64748B] max-w-xl">
									{sendingEnabled
										? "Pengiriman AKTIF. Pesan pengingat shalat dikirim otomatis ke grup WhatsApp yang dipilih sesuai jadwal hisab."
										: "PENGIRIMAN DITAHAN (KILL-SWITCH AKTIF). Worker tidak akan mengirim pesan apa pun ke WhatsApp hingga sakelar ini diaktifkan kembali."}
								</p>
							</div>

							<button
								type="button"
								onClick={handleToggleKillSwitch}
								disabled={saving}
								className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold shadow-xs transition ${
									sendingEnabled
										? "bg-rose-600 text-white hover:bg-rose-700"
										: "bg-emerald-600 text-white hover:bg-emerald-700"
								}`}
							>
								<Power className="h-4 w-4" />
								<span>
									{sendingEnabled ? "Matikan Pengiriman (Darurat)" : "Nyalakan Pengiriman"}
								</span>
							</button>
						</div>
					</div>

					<form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Left Column: Pengaturan Pengingat & Konten */}
						<div className="lg:col-span-2 space-y-6">
							{/* Kebijakan Reminder */}
							<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
								<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
									<Clock className="h-4 w-4 text-[#1D5FA7]" />
									<h2 className="text-sm font-bold text-[#102A46]">
										Kebijakan Pengingat Shalat
									</h2>
								</div>

								<div className="space-y-4 text-xs">
									<div className="flex items-start gap-3">
										<input
											type="checkbox"
											id="reminder-enabled-check"
											checked={reminderEnabled}
											onChange={(e) => setReminderEnabled(e.target.checked)}
											className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
										/>
										<label htmlFor="reminder-enabled-check" className="cursor-pointer">
											<span className="font-bold text-[#102A46]">
												Aktifkan Seluruh Jadwal Pengingat Shalat
											</span>
											<p className="text-[#64748B] text-[11px] mt-0.5">
												Bila dinonaktifkan, generator tidak akan membuat jadwal pesan baru.
											</p>
										</label>
									</div>

									<div className="flex items-start gap-3">
										<input
											type="checkbox"
											id="adhan-enabled-check"
											checked={adhanEnabled}
											onChange={(e) => setAdhanEnabled(e.target.checked)}
											className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
										/>
										<label htmlFor="adhan-enabled-check" className="cursor-pointer">
											<span className="font-bold text-[#102A46]">
												Pesan Saat Masuk Waktu Shalat (Adzan)
											</span>
											<p className="text-[#64748B] text-[11px] mt-0.5">
												Mengirim pesan tepat saat waktu shalat tiba (Subuh, Dzuhur/Jumat, Ashar, Maghrib, Isya).
											</p>
										</label>
									</div>

									<div className="flex items-start gap-3">
										<input
											type="checkbox"
											id="pre-reminder-enabled-check"
											checked={preReminderEnabled}
											onChange={(e) => setPreReminderEnabled(e.target.checked)}
											className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
										/>
										<label htmlFor="pre-reminder-enabled-check" className="cursor-pointer">
											<span className="font-bold text-[#102A46]">
												Pesan Pengingat Persiapan (Pre-Reminder)
											</span>
											<p className="text-[#64748B] text-[11px] mt-0.5">
												Mengirim pengingat beberapa menit sebelum waktu shalat masuk agar jamaah dapat bersiap-siap.
											</p>
										</label>
									</div>

									<div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
										<div>
											<label className="block font-bold text-[#102A46] mb-1">
												Menit Pre-Reminder:
											</label>
											<input
												type="number"
												min={1}
												max={30}
												value={preReminderMinutes}
												onChange={(e) =>
													setPreReminderMinutes(Number.parseInt(e.target.value, 10) || 3)
												}
												className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
											/>
											<span className="text-[10px] text-[#64748B]">Rentang: 1 - 30 menit sebelum adzan.</span>
										</div>

										<div>
											<label className="block font-bold text-[#102A46] mb-1">
												Toleransi Keterlambatan (Late Grace):
											</label>
											<input
												type="number"
												min={1}
												max={60}
												value={lateGraceMinutes}
												onChange={(e) =>
													setLateGraceMinutes(Number.parseInt(e.target.value, 10) || 5)
												}
												className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
											/>
											<span className="text-[10px] text-[#64748B]">
												Pesan yang tertunda melebihi menit ini otomatis ditandai <code>EXPIRED</code> (tidak dikirim).
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Pengaturan Konten Pesan */}
							<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
								<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
									<Sliders className="h-4 w-4 text-[#1D5FA7]" />
									<h2 className="text-sm font-bold text-[#102A46]">
										Pengaturan Konten & Hadits
									</h2>
								</div>

								<div className="space-y-3 text-xs">
									<div className="flex items-start gap-3">
										<input
											type="checkbox"
											id="include-hadith-check"
											checked={includeHadith}
											onChange={(e) => setIncludeHadith(e.target.checked)}
											className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
										/>
										<label htmlFor="include-hadith-check" className="cursor-pointer">
											<span className="font-bold text-[#102A46]">
												Sertakan Kutipan Hadits / Ayat Harian pada Pesan Adzan
											</span>
											<p className="text-[#64748B] text-[11px] mt-0.5">
												Bila diaktifkan, bot akan memilih hadits aktif secara acak dan bergiliran untuk disisipkan ke dalam pesan adzan.
											</p>
										</label>
									</div>
								</div>
							</div>

							{/* Save Button */}
							<div className="flex justify-end">
								<button
									type="submit"
									disabled={saving}
									className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition disabled:opacity-50"
								>
									<Save className="h-4 w-4" />
									<span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
								</button>
							</div>
						</div>

						{/* Right Column: Diagnostik Server & Worker */}
						<div className="space-y-6">
							<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
								<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
									<Activity className="h-4 w-4 text-[#1D5FA7]" />
									<h2 className="text-sm font-bold text-[#102A46]">
										Diagnostik & Kesehatan Sistem
									</h2>
								</div>

								{systemStatus ? (
									<div className="space-y-3 text-xs">
										{/* Worker State */}
										<div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-[#64748B] flex items-center gap-1.5">
													<Server className="h-3.5 w-3.5 text-[#1D5FA7]" />
													Worker Scheduler:
												</span>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
														systemStatus.worker.state === "HEALTHY"
															? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
															: systemStatus.worker.state === "WARNING"
																? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
																: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30"
													}`}
												>
													{systemStatus.worker.state}
												</span>
											</div>
											<p className="text-[10px] text-slate-400">
												ID: <code>{systemStatus.worker.workerId || "-"}</code>
											</p>
											<p className="text-[10px] text-slate-400">
												Heartbeat:{" "}
												{systemStatus.worker.lastHeartbeatAt
													? new Date(systemStatus.worker.lastHeartbeatAt).toLocaleTimeString("id-ID")
													: "Belum tercatat"}
											</p>
										</div>

										{/* Database */}
										<div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-[#64748B] flex items-center gap-1.5">
													<Database className="h-3.5 w-3.5 text-[#1D5FA7]" />
													Database MySQL:
												</span>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
														systemStatus.database.ok
															? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
															: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30"
													}`}
												>
													{systemStatus.database.ok ? "Connected" : "Error"}
												</span>
											</div>
											<p className="text-[10px] text-slate-400">
												Latensi: {systemStatus.database.latencyMs} ms
											</p>
										</div>

										{/* WAHA */}
										<div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-[#64748B] flex items-center gap-1.5">
													<Radio className="h-3.5 w-3.5 text-[#1D5FA7]" />
													WAHA WhatsApp:
												</span>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
														systemStatus.waha.status === "WORKING"
															? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
															: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
													}`}
												>
													{systemStatus.waha.status}
												</span>
											</div>
											<p className="text-[10px] text-slate-400">
												Sesi: <code>{systemStatus.waha.session}</code>
											</p>
										</div>
									</div>
								) : (
									<div className="text-xs text-slate-400">Memuat status diagnostik...</div>
								)}

								<div className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-[#1D5FA7] flex items-start gap-2">
									<Info className="h-4 w-4 shrink-0 mt-0.5" />
									<span>
										Perubahan pengaturan di halaman ini disimpan ke database MySQL (<code>app_settings</code>) dan bertahan melewati restart server.
									</span>
								</div>
							</div>
						</div>
					</form>
				</div>
			)}

			{/* Modal Konfirmasi Kill Switch */}
			{showKillSwitchModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-rose-600">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
								<ShieldAlert className="h-5 w-5" />
							</div>
							<h3 className="text-base font-bold text-[#102A46]">
								{pendingKillSwitchState
									? "Nyalakan Pengiriman Pesan?"
									: "Konfirmasi Matikan Pengiriman (Kill-Switch)?"}
							</h3>
						</div>
						<p className="text-xs text-[#64748B] leading-relaxed">
							{pendingKillSwitchState
								? "Sistem akan mengaktifkan kembali pengiriman pesan otomatis ke WhatsApp. Seluruh antrean yang relevan akan diproses oleh worker."
								: "PERINGATAN: Semua pengiriman pengingat shalat ke WhatsApp akan langsung DITAHAN sementara. Antrean pesan akan tetap dibuat namun tidak akan terkirim hingga diaktifkan kembali."}
						</p>
						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowKillSwitchModal(false)}
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={confirmKillSwitch}
								className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
									pendingKillSwitchState
										? "bg-emerald-600 hover:bg-emerald-700"
										: "bg-rose-600 hover:bg-rose-700"
								}`}
							>
								{pendingKillSwitchState ? "Ya, Aktifkan" : "Ya, Matikan Sekarang"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
