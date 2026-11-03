"use client";

import {
	Activity,
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	BookOpen,
	Calendar,
	Check,
	Clock,
	MessageSquare,
	Radio,
	RefreshCw,
	Server,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../lib/api-client";

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
	counts: {
		todaySent: number;
		pending: number;
		failed: number;
		unknown: number;
		totalTargets: number;
		activeTargets: number;
	};
	recent: Array<{
		id: number;
		prayerName: string;
		messageType: string;
		targetName: string;
		status: string;
		scheduledAtUtc: string;
		sentAtUtc: string | null;
		lastError: string | null;
	}>;
	timestampUtc: string;
}

export default function AdminOverviewPage() {
	const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadStatus = useCallback(async () => {
		setLoading(true);
		setError(null);
		const res = await fetchApi<SystemStatusData>("/api/admin/system/status");
		if (res.data) {
			setStatusData(res.data);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const formatPrayerName = (name: string) => {
		switch (name) {
			case "FAJR":
				return "Subuh";
			case "DHUHR":
				return "Dzuhur/Jumat";
			case "ASR":
				return "Ashar";
			case "MAGHRIB":
				return "Maghrib";
			case "ISHA":
				return "Isya";
			default:
				return name;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "SENT":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/30">
						<Check className="h-3 w-3" /> Terkirim
					</span>
				);
			case "PENDING":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-600/30">
						<Clock className="h-3 w-3" /> Antrean
					</span>
				);
			case "PROCESSING":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/30">
						<RefreshCw className="h-3 w-3 animate-spin" /> Proses
					</span>
				);
			case "FAILED":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-600/30">
						Gagal
					</span>
				);
			case "UNKNOWN":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800 ring-1 ring-orange-600/40">
						<AlertTriangle className="h-3 w-3" /> Ambigu
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
						{status}
					</span>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Dashboard Administrator
					</h1>
					<p className="text-xs text-[#64748B]">
						Pantauan operasional bot pengingat waktu shalat WhatsApp UNIDA Gontor.
					</p>
				</div>
				<button
					type="button"
					onClick={() => loadStatus()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan</span>
				</button>
			</div>

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

			{/* Metric Cards Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Card 1: WAHA Status */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">WhatsApp Gateway</span>
						<Radio className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3 flex items-baseline justify-between">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
								statusData?.waha.status === "WORKING"
									? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
									: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
							}`}
						>
							{statusData?.waha.status || "Memuat..."}
						</span>
						<Link
							href="/admin/whatsapp"
							className="text-[11px] font-semibold text-[#1D5FA7] hover:underline"
						>
							Kelola Sesi &rarr;
						</Link>
					</div>
				</div>

				{/* Card 2: Worker Scheduler */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Worker Scheduler</span>
						<Server className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3 flex items-baseline justify-between">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
								statusData?.worker.state === "HEALTHY"
									? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
									: statusData?.worker.state === "WARNING"
										? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
										: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30"
							}`}
						>
							{statusData?.worker.state || "Memuat..."}
						</span>
						<span className="text-[10px] text-slate-400">
							{statusData?.database.ok ? `DB: ${statusData.database.latencyMs}ms` : "DB Offline"}
						</span>
					</div>
				</div>

				{/* Card 3: Pesan Terkirim Hari Ini */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Terkirim Hari Ini</span>
						<MessageSquare className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-extrabold text-[#102A46]">
							{statusData?.counts.todaySent ?? 0}
						</span>
						<span className="text-xs text-blue-700 font-semibold">
							({statusData?.counts.pending ?? 0} antrean)
						</span>
					</div>
				</div>

				{/* Card 4: Target Grup Aktif */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Grup WhatsApp</span>
						<Users className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-extrabold text-[#102A46]">
							{statusData?.counts.activeTargets ?? 0}
						</span>
						<span className="text-xs text-[#64748B]">
							aktif dari {statusData?.counts.totalTargets ?? 0} terdaftar
						</span>
					</div>
				</div>
			</div>

			{/* Attention Banner if any failed or unknown */}
			{statusData && (statusData.counts.failed > 0 || statusData.counts.unknown > 0) && (
				<div className="flex items-center justify-between rounded-3xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900">
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
						<div>
							<span className="font-bold">Perlu Perhatian Operator:</span> Terdapat{" "}
							<strong>{statusData.counts.failed} pesan gagal</strong> dan{" "}
							<strong>{statusData.counts.unknown} pesan berstatus ambigu</strong> yang memerlukan
							verifikasi manual.
						</div>
					</div>
					<Link
						href="/admin/messages?status=FAILED"
						className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
					>
						Tinjau Antrean
					</Link>
				</div>
			)}

			{/* Quick Action Navigation Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Link
					href="/admin/whatsapp"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7] group-hover:bg-[#123B6D] group-hover:text-white transition">
							<Radio className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#1D5FA7] transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Koneksi WhatsApp</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Pantau status sesi WAHA, scan QR code pairing, dan kirim pesan uji coba.
					</p>
				</Link>

				<Link
					href="/admin/targets"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
							<Users className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Target & Grup</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Sinkronisasi grup dari WhatsApp dan aktifkan grup penerima jadwal shalat.
					</p>
				</Link>

				<Link
					href="/admin/prayer"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
							<Calendar className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Jadwal & Hisab</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Sesuaikan koordinat kampus, sudut hisab Kemenag, koreksi menit, dan hitung ulang jadwal.
					</p>
				</Link>

				<Link
					href="/admin/messages"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition">
							<MessageSquare className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Riwayat Pesan</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Lihat daftar pesan yang telah terkirim, tinjau snapshot teks, dan lakukan retry manual.
					</p>
				</Link>

				<Link
					href="/admin/hadits"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
							<BookOpen className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Konten Hadits</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Kelola hadits dan ayat shalat terverifikasi yang dirotasikan pada pesan adzan harian.
					</p>
				</Link>

				<Link
					href="/admin/settings"
					className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-[#123B6D] group-hover:text-white transition">
							<Settings className="h-5 w-5" />
						</div>
						<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#123B6D] transition" />
					</div>
					<h3 className="mt-3 text-sm font-bold text-[#102A46]">Pengaturan Sistem</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Kontrol kill-switch darurat, durasi pre-reminder, batas late grace, dan status server.
					</p>
				</Link>
			</div>

			{/* Recent Messages Activity Table */}
			<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<Activity className="h-4 w-4 text-[#1D5FA7]" />
						<h2 className="text-sm font-bold text-[#102A46]">
							Aktivitas Pengiriman Terkini
						</h2>
					</div>
					<Link
						href="/admin/messages"
						className="text-xs font-semibold text-[#1D5FA7] hover:underline"
					>
						Lihat Seluruh Riwayat &rarr;
					</Link>
				</div>

				{statusData?.recent && statusData.recent.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-[#64748B]">
									<th className="py-2.5 px-3">Status</th>
									<th className="py-2.5 px-3">Shalat</th>
									<th className="py-2.5 px-3">Target Grup</th>
									<th className="py-2.5 px-3">Waktu Terjadwal</th>
									<th className="py-2.5 px-3">Keterangan / Error</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-[#172B43]">
								{statusData.recent.map((item) => (
									<tr key={item.id} className="hover:bg-slate-50/70 transition">
										<td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
										<td className="py-2.5 px-3 font-semibold text-[#102A46]">
											{formatPrayerName(item.prayerName)}{" "}
											<span className="text-[10px] text-[#64748B] font-normal">
												({item.messageType === "ADHAN" ? "Adzan" : "Pre"})
											</span>
										</td>
										<td className="py-2.5 px-3 font-medium text-[#102A46]">
											{item.targetName}
										</td>
										<td className="py-2.5 px-3 text-[#64748B]">
											{new Date(item.scheduledAtUtc).toLocaleString("id-ID", {
												dateStyle: "short",
												timeStyle: "short",
											})}
										</td>
										<td className="py-2.5 px-3">
											{item.lastError ? (
												<span className="text-rose-600 font-medium text-[11px] line-clamp-1">
													{item.lastError}
												</span>
											) : (
												<span className="text-slate-400 text-[11px]">-</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="py-6 text-center text-xs text-[#64748B]">
						Belum ada aktivitas pesan yang tercatat.
					</div>
				)}
			</div>
		</div>
	);
}
