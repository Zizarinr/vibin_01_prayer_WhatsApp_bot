import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { adminRoute } from "../../../lib/admin-path";

interface AttentionBannerProps {
	failedCount: number;
	unknownCount: number;
}

export function AttentionBanner({ failedCount, unknownCount }: AttentionBannerProps) {
	if (failedCount === 0 && unknownCount === 0) return null;

	return (
		<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900 shadow-2xs">
			<div className="flex items-center gap-3">
				<AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
				<div>
					<span className="font-bold">Perlu Perhatian Operator:</span> Terdapat{" "}
					<strong>{failedCount} pesan gagal</strong> dan{" "}
					<strong>{unknownCount} pesan berstatus ambigu</strong> yang memerlukan verifikasi manual.
				</div>
			</div>
			<Link
				href={adminRoute("/messages?status=FAILED")}
				className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
			>
				Tinjau Antrean
			</Link>
		</div>
	);
}
