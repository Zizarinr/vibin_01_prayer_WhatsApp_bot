import {
	LogOut,
	Play,
	Power,
	QrCode,
	Radio,
	RotateCw,
	Smartphone,
} from "lucide-react";
import { WahaStatusBadge } from "../shared/status-badges";

export interface WahaSessionInfo {
	name: string;
	status: "STOPPED" | "STARTING" | "SCAN_QR" | "WORKING" | "FAILED";
	me?: {
		id: string;
		pushName?: string;
	};
	engine?: string;
}

interface SessionStatusCardProps {
	session: WahaSessionInfo | null;
	actionLoading: boolean;
	onStart: () => void;
	onOpenQr: () => void;
	onRequestAction: (action: "STOP" | "RESTART" | "LOGOUT") => void;
}

export function SessionStatusCard({
	session,
	actionLoading,
	onStart,
	onOpenQr,
	onRequestAction,
}: SessionStatusCardProps) {
	const isWorking = session?.status === "WORKING";
	const isQr = session?.status === "SCAN_QR";
	const isStopped = session?.status === "STOPPED" || !session?.status;

	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7]">
						<Radio className="h-6 w-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-base font-bold text-[#102A46]">
								Sesi: {session?.name || "unida-prayer"}
							</h2>
							<WahaStatusBadge status={session?.status || "STOPPED"} />
						</div>
						<p className="text-xs text-[#64748B] mt-0.5">
							Engine: <span className="font-semibold text-[#102A46]">{session?.engine || "GOWS"}</span> • Single Session MVP
						</p>
					</div>
				</div>

				{/* Tombol Aksi Sesi */}
				<div className="flex flex-wrap items-center gap-2">
					{isStopped && (
						<button
							type="button"
							onClick={onStart}
							disabled={actionLoading}
							className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
						>
							<Play className="h-4 w-4" />
							<span>Mulai Sesi</span>
						</button>
					)}

					{isQr && (
						<button
							type="button"
							onClick={onOpenQr}
							disabled={actionLoading}
							className="inline-flex items-center gap-2 rounded-xl bg-[#1D5FA7] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#123B6D] transition disabled:opacity-50"
						>
							<QrCode className="h-4 w-4" />
							<span>Tampilkan QR Code</span>
						</button>
					)}

					{!isStopped && (
						<>
							<button
								type="button"
								onClick={() => onRequestAction("RESTART")}
								disabled={actionLoading}
								className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
							>
								<RotateCw className="h-4 w-4" />
								<span>Restart</span>
							</button>

							<button
								type="button"
								onClick={() => onRequestAction("STOP")}
								disabled={actionLoading}
								className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 transition disabled:opacity-50"
							>
								<Power className="h-4 w-4" />
								<span>Stop</span>
							</button>
						</>
					)}

					{isWorking && (
						<button
							type="button"
							onClick={() => onRequestAction("LOGOUT")}
							disabled={actionLoading}
							className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition disabled:opacity-50"
						>
							<LogOut className="h-4 w-4" />
							<span>Logout</span>
						</button>
					)}
				</div>
			</div>

			{/* Info Akun WhatsApp Terhubung */}
			{isWorking && session?.me && (
				<div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-4">
					<Smartphone className="h-5 w-5 text-emerald-700" />
					<div className="text-xs">
						<span className="font-semibold text-emerald-950">
							Terhubung sebagai: {session.me.pushName || "Akun Bot UNIDA"}
						</span>
						<span className="text-emerald-700 block font-mono text-[11px]">
							Nomor / ID: {session.me.id}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
