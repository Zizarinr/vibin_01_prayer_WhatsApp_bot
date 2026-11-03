"use client";

import {
	AlertCircle,
	CheckCircle2,
	LogOut,
	Play,
	Power,
	QrCode,
	Radio,
	RefreshCw,
	RotateCw,
	Send,
	Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface WahaSessionInfo {
	name: string;
	status: "STOPPED" | "STARTING" | "SCAN_QR" | "WORKING" | "FAILED";
	me?: {
		id: string;
		pushName?: string;
	};
	engine?: string;
}

interface MessageTarget {
	id: number;
	name: string;
	targetId: string;
	isActive: boolean;
}

export default function WhatsappSessionPage() {
	const [session, setSession] = useState<WahaSessionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// QR Code state
	const [qrData, setQrData] = useState<string | null>(null);
	const [loadingQr, setLoadingQr] = useState(false);

	// Test Message state
	const [targets, setTargets] = useState<MessageTarget[]>([]);
	const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
	const [customText, setCustomText] = useState("");
	const [sendingTest, setSendingTest] = useState(false);
	const [testResult, setTestResult] = useState<string | null>(null);

	// Modal konfirmasi aksi
	const [confirmAction, setConfirmAction] = useState<"STOP" | "RESTART" | "LOGOUT" | null>(null);

	// Muat status sesi
	const loadSession = useCallback(async () => {
		const res = await fetchApi<WahaSessionInfo>("/api/admin/whatsapp/session");
		if (res.error || !res.data) {
			setError(res.error?.message || "Gagal memuat status sesi WAHA.");
		} else {
			setSession(res.data);
			setError(null);

			// Bila status berubah jadi WORKING, bersihkan QR
			if (res.data.status === "WORKING") {
				setQrData(null);
			}
		}
		setLoading(false);
	}, []);

	// Muat daftar target untuk test-message
	const loadTargets = useCallback(async () => {
		const res = await fetchApi<MessageTarget[]>("/api/admin/targets");
		if (res.data && Array.isArray(res.data)) {
			setTargets(res.data);
			if (res.data.length > 0 && selectedTargetId === null) {
				const activeFirst = res.data.find((t) => t.isActive) || res.data[0];
				if (activeFirst) {
					setSelectedTargetId(activeFirst.id);
				}
			}
		}
	}, [selectedTargetId]);

	// Ambil data QR Code
	const loadQrCode = useCallback(async () => {
		setLoadingQr(true);
		const res = await fetchApi<{ format: string; data: string }>(
			"/api/admin/whatsapp/session/qr",
		);
		if (res.data?.data) {
			setQrData(res.data.data);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoadingQr(false);
	}, []);

	useEffect(() => {
		loadSession();
		loadTargets();
	}, [loadSession, loadTargets]);

	// Polling berkala jika status sesi adalah SCAN_QR
	useEffect(() => {
		if (session?.status !== "SCAN_QR") return;

		// Ambil QR sekali saat awal masuk SCAN_QR jika belum ada
		if (!qrData) {
			loadQrCode();
		}

		const interval = setInterval(() => {
			loadSession();
		}, 4000);

		return () => clearInterval(interval);
	}, [session?.status, qrData, loadQrCode, loadSession]);

	// Handler aksi sesi
	const handleSessionAction = async (action: "START" | "STOP" | "RESTART" | "LOGOUT") => {
		setActionLoading(true);
		setError(null);
		setSuccessMsg(null);

		const endpoint =
			action === "START"
				? "/api/admin/whatsapp/session/start"
				: action === "STOP"
					? "/api/admin/whatsapp/session/stop"
					: action === "RESTART"
						? "/api/admin/whatsapp/session/restart"
						: "/api/admin/whatsapp/session/logout";

		const res = await fetchApi(endpoint, { method: "POST" });
		if (res.error) {
			setError(res.error.message);
		} else {
			setSuccessMsg(`Aksi ${action} berhasil dieksekusi.`);
			await loadSession();
			if (action === "START" || action === "RESTART") {
				loadQrCode();
			}
		}
		setActionLoading(false);
		setConfirmAction(null);
	};

	// Handler kirim pesan uji
	const handleSendTest = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedTargetId) {
			setError("Pilih target grup pengujian terlebih dahulu.");
			return;
		}

		setSendingTest(true);
		setTestResult(null);
		setError(null);

		const res = await fetchApi<{
			success: boolean;
			targetName: string;
			messageId: string;
		}>("/api/admin/whatsapp/test-message", {
			method: "POST",
			body: JSON.stringify({
				targetId: selectedTargetId,
				text: customText.trim() || undefined,
			}),
		});

		if (res.error) {
			setError(res.error.message);
		} else if (res.data) {
			setTestResult(
				`Pesan uji berhasil dikirim ke grup "${res.data.targetName}" (ID Pesan: ${res.data.messageId}).`,
			);
			setCustomText("");
		}
		setSendingTest(false);
	};

	const getStatusBadge = (status?: string) => {
		switch (status) {
			case "WORKING":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
						<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
						Terhubung (WORKING)
					</span>
				);
			case "SCAN_QR":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">
						<span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
						Perlu Pairing (SCAN_QR)
					</span>
				);
			case "STARTING":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-600/20">
						<RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
						Memulai...
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-400/20">
						<span className="h-2 w-2 rounded-full bg-slate-400" />
						Nonaktif (STOPPED)
					</span>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Integrasi WhatsApp (WAHA)
					</h1>
					<p className="text-xs text-[#64748B]">
						Kelola status sesi, proses pairing QR, dan pengujian pesan WhatsApp Bot.
					</p>
				</div>
				<button
					type="button"
					onClick={() => loadSession()}
					disabled={loading || actionLoading}
					className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#172B43] shadow-2xs hover:bg-slate-50 disabled:opacity-50"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan Status</span>
				</button>
			</div>

			{/* Alert Messages */}
			{error && (
				<div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-700">
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
					<div className="flex-1">{error}</div>
				</div>
			)}

			{successMsg && (
				<div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-700">
					<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
					<div className="flex-1">{successMsg}</div>
				</div>
			)}

			{/* Main Grid: Status Card & Controls */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Session Status & Info Card */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
					<div className="flex items-center justify-between border-b border-slate-100 pb-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1D5FA7]">
								<Radio className="h-5 w-5" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-[#102A46]">
									Sesi: {session?.name ?? "unida-prayer"}
								</h3>
								<p className="text-[11px] text-[#64748B]">
									Engine: {session?.engine ?? "GOWS"} (Pin Versi: 2026.10.1)
								</p>
							</div>
						</div>
						{getStatusBadge(session?.status)}
					</div>

					{/* Connected Account Details */}
					{session?.status === "WORKING" && session.me && (
						<div className="mt-4 rounded-2xl bg-slate-50 p-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
									<Smartphone className="h-5 w-5" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-[#102A46]">
										{session.me.pushName || "UNIDA Prayer Bot"}
									</h4>
									<p className="text-[11px] font-mono text-[#64748B]">
										ID Akun: {session.me.id}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="mt-6 flex flex-wrap items-center gap-3">
						{session?.status === "STOPPED" || session?.status === "FAILED" ? (
							<button
								type="button"
								onClick={() => handleSessionAction("START")}
								disabled={actionLoading}
								className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
							>
								<Play className="h-4 w-4" />
								<span>Mulai Sesi (Start)</span>
							</button>
						) : (
							<button
								type="button"
								onClick={() => setConfirmAction("STOP")}
								disabled={actionLoading}
								className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
							>
								<Power className="h-4 w-4 text-slate-500" />
								<span>Hentikan Sesi (Stop)</span>
							</button>
						)}

						<button
							type="button"
							onClick={() => setConfirmAction("RESTART")}
							disabled={actionLoading}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
						>
							<RotateCw className="h-4 w-4 text-slate-500" />
							<span>Restart</span>
						</button>

						{session?.status === "WORKING" && (
							<button
								type="button"
								onClick={() => setConfirmAction("LOGOUT")}
								disabled={actionLoading}
								className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-semibold text-red-700 shadow-2xs hover:bg-red-100 disabled:opacity-50"
							>
								<LogOut className="h-4 w-4" />
								<span>Logout (Hapus Pairing)</span>
							</button>
						)}
					</div>
				</div>

				{/* QR Code Card */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
					<div className="flex items-center gap-2 text-xs font-bold text-[#102A46] mb-3">
						<QrCode className="h-4 w-4 text-[#1D5FA7]" />
						<span>Pairing WhatsApp QR</span>
					</div>

					{session?.status === "WORKING" ? (
						<div className="p-6 text-center space-y-2">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
								<CheckCircle2 className="h-6 w-6" />
							</div>
							<p className="text-xs font-bold text-[#102A46]">Sesi Telah Terhubung</p>
							<p className="text-[11px] text-[#64748B]">
								WhatsApp Bot siap mengirimkan pesan pengingat jadwal shalat.
							</p>
						</div>
					) : qrData ? (
						<div className="space-y-3">
							<div className="rounded-2xl border border-slate-200 p-2 bg-white inline-block shadow-inner">
								{qrData.startsWith("data:image") ? (
									/* biome-ignore lint/a11y/useAltText: pairing qr code */
									<img
										src={qrData}
										className="h-48 w-48 object-contain rounded-xl"
									/>
								) : (
									<div className="p-4 font-mono text-[10px] break-all max-w-[200px]">
										{qrData}
									</div>
								)}
							</div>
							<p className="text-[11px] text-[#64748B]">
								Buka WhatsApp di HP operasional &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
							</p>
							<button
								type="button"
								onClick={loadQrCode}
								disabled={loadingQr}
								className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D5FA7] hover:underline"
							>
								<RefreshCw className={`h-3 w-3 ${loadingQr ? "animate-spin" : ""}`} />
								<span>Muat Ulang QR</span>
							</button>
						</div>
					) : (
						<div className="p-6 text-center space-y-3">
							<p className="text-xs text-[#64748B]">
								{session?.status === "SCAN_QR"
									? "QR Code sedang dimuat..."
									: "Mulai sesi (Start) untuk memunculkan QR pairing WhatsApp."}
							</p>
							{session?.status === "SCAN_QR" && (
								<button
									type="button"
									onClick={loadQrCode}
									disabled={loadingQr}
									className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1D5FA7]"
								>
									<RefreshCw className={`h-3.5 w-3.5 ${loadingQr ? "animate-spin" : ""}`} />
									<span>Tampilkan QR</span>
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Test Message Form */}
			<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
				<div className="flex items-center gap-3 border-b border-slate-100 pb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1D5FA7]">
						<Send className="h-5 w-5" />
					</div>
					<div>
						<h3 className="text-sm font-bold text-[#102A46]">
							Uji Coba Pengiriman Pesan (Test Message)
						</h3>
						<p className="text-[11px] text-[#64748B]">
							Kirim pesan uji coba ke salah satu grup terdaftar untuk memastikan bot dapat mengirim pesan.
						</p>
					</div>
				</div>

				{testResult && (
					<div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-700">
						<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
						<div className="flex-1">{testResult}</div>
					</div>
				)}

				<form onSubmit={handleSendTest} className="mt-5 space-y-4 max-w-2xl">
					<div>
						<label
							htmlFor="target-select"
							className="block text-xs font-bold text-[#102A46] mb-1.5"
						>
							Pilih Grup Tujuan:
						</label>
						{targets.length === 0 ? (
							<div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-[#64748B]">
								Belum ada grup di database. Silakan sinkronkan grup di halaman{" "}
								<a href="/admin/targets" className="font-bold text-[#1D5FA7] underline">
									Grup & Target
								</a>
								.
							</div>
						) : (
							<select
								id="target-select"
								value={selectedTargetId ?? ""}
								onChange={(e) => setSelectedTargetId(Number(e.target.value))}
								className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#172B43] shadow-2xs focus:border-[#1D5FA7] focus:outline-none"
							>
								{targets.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name} {t.isActive ? "(Aktif)" : "(Nonaktif)"}
									</option>
								))}
							</select>
						)}
					</div>

					<div>
						<label
							htmlFor="test-text"
							className="block text-xs font-bold text-[#102A46] mb-1.5"
						>
							Teks Pesan (Opsional):
						</label>
						<textarea
							id="test-text"
							rows={3}
							value={customText}
							onChange={(e) => setCustomText(e.target.value)}
							placeholder="Kosongkan untuk menggunakan template pesan uji default..."
							className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-[#172B43] shadow-2xs focus:border-[#1D5FA7] focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={sendingTest || targets.length === 0 || session?.status !== "WORKING"}
						className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1D5FA7] disabled:opacity-50"
					>
						<Send className={`h-3.5 w-3.5 ${sendingTest ? "animate-pulse" : ""}`} />
						<span>{sendingTest ? "Mengirim Pesan..." : "Kirim Pesan Uji"}</span>
					</button>

					{session?.status !== "WORKING" && (
						<p className="text-[11px] text-amber-600">
							* Sesi WhatsApp harus berstatus WORKING untuk dapat mengirim pesan uji.
						</p>
					)}
				</form>
			</div>

			{/* Modal Konfirmasi Aksi Berisiko */}
			{confirmAction && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
					<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-red-600">
							<AlertCircle className="h-6 w-6" />
							<h3 className="text-base font-bold text-[#102A46]">
								Konfirmasi Aksi: {confirmAction}
							</h3>
						</div>

						<p className="text-xs text-[#64748B]">
							{confirmAction === "LOGOUT"
								? "Aksi ini akan menghapus pairing sesi WhatsApp operasional. Anda harus melakukan scan QR ulang untuk menghubungkan kembali."
								: confirmAction === "STOP"
									? "Aksi ini akan menghentikan sesi WhatsApp. Pengiriman pengingat jadwal shalat tidak akan berjalan sampai sesi dinyalakan kembali."
									: "Aksi ini akan merestart sesi WhatsApp."}
						</p>

						<div className="flex items-center justify-end gap-3 pt-3">
							<button
								type="button"
								onClick={() => setConfirmAction(null)}
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#172B43] hover:bg-slate-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={() => handleSessionAction(confirmAction)}
								disabled={actionLoading}
								className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
							>
								{actionLoading ? "Memproses..." : "Ya, Lanjutkan"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
