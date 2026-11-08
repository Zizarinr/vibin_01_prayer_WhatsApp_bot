import { Activity } from "lucide-react";
import Link from "next/link";
import { adminRoute } from "../../../lib/admin-path";
import { MessageStatusBadge } from "../shared/status-badges";
import type { SystemStatusData } from "./metrics-grid";

interface RecentActivityTableProps {
	recent: SystemStatusData["recent"];
}

export function RecentActivityTable({ recent }: RecentActivityTableProps) {
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

	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
			<div className="flex items-center justify-between border-b border-slate-100 pb-3">
				<div className="flex items-center gap-2">
					<Activity className="h-4 w-4 text-[#1D5FA7]" />
					<h2 className="text-sm font-bold text-[#102A46]">
						Aktivitas Pengiriman Terkini
					</h2>
				</div>
				<Link
					href={adminRoute("/messages")}
					className="text-xs font-semibold text-[#1D5FA7] hover:underline"
				>
					Lihat Seluruh Riwayat &rarr;
				</Link>
			</div>

			{recent && recent.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse text-xs">
						<thead>
							<tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold text-slate-700">
								<th className="py-2.5 px-3">Status</th>
								<th className="py-2.5 px-3">Shalat</th>
								<th className="py-2.5 px-3">Target Grup</th>
								<th className="py-2.5 px-3">Waktu Terjadwal</th>
								<th className="py-2.5 px-3">Keterangan / Error</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-[#172B43]">
							{recent.map((item) => (
								<tr key={item.id} className="hover:bg-slate-50/70 transition">
									<td className="py-2.5 px-3">
										<MessageStatusBadge status={item.status} />
									</td>
									<td className="py-2.5 px-3 font-semibold text-[#102A46]">
										{formatPrayerName(item.prayerName)}{" "}
										<span className="text-[10px] text-slate-500 font-medium">
											({item.messageType === "ADHAN" ? "Adzan" : "Pre"})
										</span>
									</td>
									<td className="py-2.5 px-3 font-medium text-[#102A46]">
										{item.targetName}
									</td>
									<td className="py-2.5 px-3 font-medium text-slate-600">
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
	);
}
