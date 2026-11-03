import {
	AlertTriangle,
	Check,
	Clock,
	RefreshCw,
	X,
} from "lucide-react";

export function MessageStatusBadge({ status }: { status: string }) {
	switch (status) {
		case "SENT":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/30">
					<Check className="h-3 w-3" /> Terkirim
				</span>
			);
		case "PENDING":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-600/30">
					<Clock className="h-3 w-3" /> Antrean
				</span>
			);
		case "PROCESSING":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-600/30">
					<RefreshCw className="h-3 w-3 animate-spin" /> Proses
				</span>
			);
		case "FAILED":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-600/30">
					<X className="h-3 w-3" /> Gagal
				</span>
			);
		case "UNKNOWN":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-800 ring-1 ring-orange-600/40">
					<AlertTriangle className="h-3 w-3" /> Ambigu
				</span>
			);
		case "EXPIRED":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-400/30">
					Kedaluwarsa
				</span>
			);
		case "CANCELLED":
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-300">
					Dibatalkan
				</span>
			);
		default:
			return (
				<span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
					{status}
				</span>
			);
	}
}

export function WahaStatusBadge({ status }: { status: string }) {
	const isWorking = status === "WORKING";
	const isQr = status === "SCAN_QR";
	const isStarting = status === "STARTING";

	let colorClass = "bg-rose-50 text-rose-700 ring-rose-600/30";
	if (isWorking) {
		colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-600/30";
	} else if (isQr || isStarting) {
		colorClass = "bg-amber-50 text-amber-700 ring-amber-600/30";
	}

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colorClass}`}
		>
			<span
				className={`h-1.5 w-1.5 rounded-full ${
					isWorking
						? "bg-emerald-500 animate-pulse"
						: isQr || isStarting
							? "bg-amber-500 animate-ping"
							: "bg-rose-500"
				}`}
			/>
			{status}
		</span>
	);
}

export function WorkerStatusBadge({ state }: { state: "HEALTHY" | "WARNING" | "OFFLINE" }) {
	let colorClass = "bg-rose-50 text-rose-700 ring-rose-600/30";
	if (state === "HEALTHY") {
		colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-600/30";
	} else if (state === "WARNING") {
		colorClass = "bg-amber-50 text-amber-700 ring-amber-600/30";
	}

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colorClass}`}
		>
			<span
				className={`h-1.5 w-1.5 rounded-full ${
					state === "HEALTHY"
						? "bg-emerald-500"
						: state === "WARNING"
							? "bg-amber-500 animate-pulse"
							: "bg-rose-500"
				}`}
			/>
			{state}
		</span>
	);
}
