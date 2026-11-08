import { MessageSquare, Radio, Server, Users } from "lucide-react";
import Link from "next/link";
import { adminRoute } from "../../../lib/admin-path";
import { WahaStatusBadge, WorkerStatusBadge } from "../shared/status-badges";

export interface SystemStatusData {
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

interface MetricsGridProps {
	statusData: SystemStatusData | null;
}

export function MetricsGrid({ statusData }: MetricsGridProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{/* Card 1: WAHA Status */}
			<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-[#64748B]">WhatsApp Gateway</span>
					<Radio className="h-4 w-4 text-[#1D5FA7]" />
				</div>
				<div className="mt-3 flex items-baseline justify-between">
					<WahaStatusBadge status={statusData?.waha.status || "Memuat..."} />
					<Link
						href={adminRoute("/whatsapp")}
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
					<WorkerStatusBadge state={statusData?.worker.state || "OFFLINE"} />
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
	);
}
