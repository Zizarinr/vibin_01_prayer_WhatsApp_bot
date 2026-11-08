"use client";

import { RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { ContentSettingsCard } from "../../../components/admin/settings/content-settings-card";
import { KillSwitchBanner } from "../../../components/admin/settings/kill-switch-banner";
import { KillSwitchModal } from "../../../components/admin/settings/kill-switch-modal";
import { ReminderSettingsCard } from "../../../components/admin/settings/reminder-settings-card";
import {
	SystemDiagnosticsCard,
	type SystemStatusData,
} from "../../../components/admin/settings/system-diagnostics-card";
import { AdminPageHeader } from "../../../components/admin/shared/admin-page-header";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";

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

export default function AdminSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const [sendingEnabled, setSendingEnabled] = useState(true);
	const [includeHadith, setIncludeHadith] = useState(true);
	const [reminderEnabled, setReminderEnabled] = useState(true);
	const [adhanEnabled, setAdhanEnabled] = useState(true);
	const [preReminderEnabled, setPreReminderEnabled] = useState(true);
	const [preReminderMinutes, setPreReminderMinutes] = useState(3);
	const [lateGraceMinutes, setLateGraceMinutes] = useState(5);

	const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);

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
			<AdminPageHeader
				title="Pengaturan Sistem & Pengiriman"
				description="Kontrol darurat pengiriman pesan (kill-switch), kebijakan reminder, dan diagnostik server."
			>
				<button
					type="button"
					onClick={() => loadData()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan Status</span>
				</button>
			</AdminPageHeader>

			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			{loading ? (
				<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
					<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
					<span className="text-xs">Memuat konfigurasi sistem...</span>
				</div>
			) : (
				<div className="space-y-6">
					<KillSwitchBanner
						sendingEnabled={sendingEnabled}
						saving={saving}
						onToggle={handleToggleKillSwitch}
					/>

					<form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="lg:col-span-2 space-y-6">
							<ReminderSettingsCard
								reminderEnabled={reminderEnabled}
								adhanEnabled={adhanEnabled}
								preReminderEnabled={preReminderEnabled}
								preReminderMinutes={preReminderMinutes}
								lateGraceMinutes={lateGraceMinutes}
								onChangeReminderEnabled={setReminderEnabled}
								onChangeAdhanEnabled={setAdhanEnabled}
								onChangePreReminderEnabled={setPreReminderEnabled}
								onChangePreMinutes={setPreReminderMinutes}
								onChangeLateGrace={setLateGraceMinutes}
							/>

							<ContentSettingsCard
								includeHadith={includeHadith}
								onChangeIncludeHadith={setIncludeHadith}
							/>

							<div className="flex justify-end rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs backdrop-blur-md">
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

						<div className="space-y-6">
							<SystemDiagnosticsCard systemStatus={systemStatus} />
						</div>
					</form>
				</div>
			)}

			<KillSwitchModal
				isOpen={showKillSwitchModal}
				pendingKillSwitchState={pendingKillSwitchState}
				onClose={() => setShowKillSwitchModal(false)}
				onConfirm={confirmKillSwitch}
			/>
		</div>
	);
}
