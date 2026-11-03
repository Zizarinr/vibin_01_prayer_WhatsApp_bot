import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
	message: string;
	refreshing: boolean;
	onRetry: () => void;
}

export function ErrorState({
	message,
	refreshing,
	onRetry,
}: ErrorStateProps) {
	return (
		<div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
			<div className="flex flex-col items-center text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
					<AlertCircle className="h-7 w-7" />
				</div>
				<h2 className="mt-4 text-lg font-bold text-[#102A46] sm:text-xl">
					Jadwal Belum Dapat Dimuat
				</h2>
				<p className="mt-2 max-w-md text-sm text-[#64748B]">
					{message}
				</p>
				<div className="mt-3 rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20">
					Sesuai standar keandalan UNIDA Prayer, sistem tidak akan menampilkan perkiraan atau jadwal palsu saat backend tidak terjangkau.
				</div>
				<button
					type="button"
					onClick={onRetry}
					disabled={refreshing}
					className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D5FA7] disabled:opacity-50"
				>
					<RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
					{refreshing ? "Menghubungi Server..." : "Coba Muat Ulang"}
				</button>
			</div>
		</div>
	);
}
