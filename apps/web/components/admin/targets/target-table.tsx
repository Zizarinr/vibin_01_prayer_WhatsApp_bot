import {
	Check,
	Edit2,
	MessageSquare,
	RefreshCw,
	Users,
	X,
} from "lucide-react";

export interface MessageTarget {
	id: number;
	targetType: string;
	targetId: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface TargetTableProps {
	targets: MessageTarget[];
	loading: boolean;
	editingId: number | null;
	editName: string;
	onStartEdit: (target: MessageTarget) => void;
	onCancelEdit: () => void;
	onChangeEditName: (name: string) => void;
	onSaveEdit: (id: number) => void;
	onToggleActive: (target: MessageTarget) => void;
}

export function TargetTable({
	targets,
	loading,
	editingId,
	editName,
	onStartEdit,
	onCancelEdit,
	onChangeEditName,
	onSaveEdit,
	onToggleActive,
}: TargetTableProps) {
	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
				<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
				<span className="text-xs">Memuat daftar target...</span>
			</div>
		);
	}

	if (targets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center text-[#64748B] space-y-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7]">
					<Users className="h-6 w-6" />
				</div>
				<h3 className="text-sm font-bold text-[#102A46]">
					Belum Ada Target Grup Ditemukan
				</h3>
				<p className="max-w-sm text-xs">
					Grup belum tersinkronisasi atau tidak ada yang sesuai filter pencarian. Klik tombol <strong>Sinkronisasi Grup</strong> di atas untuk mengambil grup terbaru dari WAHA.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-left border-collapse text-xs">
				<thead>
					<tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-[#64748B]">
						<th className="py-3 px-4 w-12 text-center">#</th>
						<th className="py-3 px-4">Nama Grup / Target</th>
						<th className="py-3 px-4">WhatsApp Chat ID</th>
						<th className="py-3 px-4 w-32 text-center">Status Penerima</th>
						<th className="py-3 px-4 w-28 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100 text-[#172B43]">
					{targets.map((target, idx) => (
						<tr key={target.id} className="hover:bg-slate-50/80 transition">
							<td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
								{idx + 1}
							</td>

							<td className="py-3 px-4">
								{editingId === target.id ? (
									<div className="flex items-center gap-1.5">
										<input
											type="text"
											value={editName}
											onChange={(e) => onChangeEditName(e.target.value)}
											className="rounded-lg border border-[#1D5FA7] bg-white px-2.5 py-1 text-xs text-[#172B43] focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => onSaveEdit(target.id)}
											className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50"
										>
											<Check className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={onCancelEdit}
											className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<span className="font-bold text-[#102A46]">{target.name}</span>
										<button
											type="button"
											onClick={() => onStartEdit(target)}
											title="Ubah nama tampilan lokal"
											className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#1D5FA7] transition"
										>
											<Edit2 className="h-3.5 w-3.5" />
										</button>
									</div>
								)}
								<span className="text-[10px] text-slate-400">
									Ditambahkan: {new Date(target.createdAt).toLocaleDateString("id-ID")}
								</span>
							</td>

							<td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
								{target.targetId}
							</td>

							<td className="py-3 px-4 text-center">
								<button
									type="button"
									onClick={() => onToggleActive(target)}
									className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
										target.isActive
											? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-100"
											: "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200"
									}`}
								>
									{target.isActive ? "Aktif" : "Nonaktif"}
								</button>
							</td>

							<td className="py-3 px-4 text-right">
								<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
									<MessageSquare className="h-3 w-3" /> Group
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
