import { Activity, Database, Info, Radio, Server } from "lucide-react";
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
}

interface SystemDiagnosticsCardProps {
	systemStatus: SystemStatusData | null;
}

export function SystemDiagnosticsCard({ systemStatus }: SystemDiagnosticsCardProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Activity className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Diagnostik & Kesehatan Sistem
				</h2>
			</div>

			{systemStatus ? (
				<div className="space-y-3 text-xs">
					<div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-[#64748B] flex items-center gap-1.5">
								<Server className="h-3.5 w-3.5 text-[#1D5FA7]" />
								Worker Scheduler:
							</span>
							<WorkerStatusBadge state={systemStatus.worker.state} />
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

					<div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-[#64748B] flex items-center gap-1.5">
								<Radio className="h-3.5 w-3.5 text-[#1D5FA7]" />
								WAHA WhatsApp:
							</span>
							<WahaStatusBadge status={systemStatus.waha.status} />
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
	);
}
