"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../lib/api-client";
import { AttentionBanner } from "../../components/admin/overview/attention-banner";
import {
	MetricsGrid,
	type SystemStatusData,
} from "../../components/admin/overview/metrics-grid";
import { QuickLinksGrid } from "../../components/admin/overview/quick-links-grid";
import { RecentActivityTable } from "../../components/admin/overview/recent-activity-table";
import { ErrorBanner } from "../../components/admin/shared/alert-banners";

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

	return (
		<div className="space-y-6">
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

			<ErrorBanner message={error} onClose={() => setError(null)} />

			<MetricsGrid statusData={statusData} />

			{statusData && (
				<AttentionBanner
					failedCount={statusData.counts.failed}
					unknownCount={statusData.counts.unknown}
				/>
			)}

			<QuickLinksGrid />

			<RecentActivityTable recent={statusData?.recent ?? []} />
		</div>
	);
}
