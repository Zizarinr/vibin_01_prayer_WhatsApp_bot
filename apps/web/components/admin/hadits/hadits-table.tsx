import {
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Edit2,
	RefreshCw,
	Trash2,
} from "lucide-react";

export interface HadithItem {
	id: number;
	seedKey: string | null;
	text: string;
	source: string;
	topic: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface HaditsTableProps {
	hadiths: HadithItem[];
	loading: boolean;
	page: number;
	totalPages: number;
	totalCount: number;
	onPageChange: (newPage: number) => void;
	onToggleActive: (h: HadithItem) => void;
	onOpenEdit: (h: HadithItem) => void;
	onRequestDelete: (id: number) => void;
}

export function HaditsTable({
	hadiths,
	loading,
	page,
	totalPages,
	totalCount,
	onPageChange,
	onToggleActive,
	onOpenEdit,
	onRequestDelete,
}: HaditsTableProps) {
	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
				<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
				<span className="text-xs">Memuat daftar hadits...</span>
			</div>
		);
	}

	if (hadiths.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center text-[#64748B] space-y-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7]">
					<BookOpen className="h-6 w-6" />
				</div>
				<h3 className="text-sm font-bold text-[#102A46]">
					Belum Ada Hadits Ditemukan
				</h3>
				<p className="max-w-sm text-xs">
					Tidak ada data hadits yang sesuai dengan filter. Tambahkan hadits baru atau ubah kriteria pencarian.
				</p>
			</div>
		);
	}

	return (
		<div>
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-xs">
					<thead>
						<tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-[#64748B]">
							<th className="py-3 px-4 w-12 text-center">#</th>
							<th className="py-3 px-4">Teks Terjemahan</th>
							<th className="py-3 px-4 w-52">Sumber Periwayatan</th>
							<th className="py-3 px-4 w-28 text-center">Status</th>
							<th className="py-3 px-4 w-28 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-[#172B43]">
						{hadiths.map((h, idx) => (
							<tr key={h.id} className="hover:bg-slate-50/80 transition">
								<td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
									{(page - 1) * 15 + idx + 1}
								</td>
								<td className="py-3 px-4">
									<p className="font-medium text-[#102A46] leading-relaxed line-clamp-2">
										&ldquo;{h.text}&rdquo;
									</p>
									{h.seedKey && (
										<span className="inline-block mt-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
											Seed: {h.seedKey}
										</span>
									)}
								</td>
								<td className="py-3 px-4">
									<span className="inline-flex items-center gap-1 font-semibold text-[#123B6D] bg-blue-50/80 px-2.5 py-1 rounded-lg text-[11px]">
										{h.source}
									</span>
								</td>
								<td className="py-3 px-4 text-center">
									<button
										type="button"
										onClick={() => onToggleActive(h)}
										className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
											h.isActive
												? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-100"
												: "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200"
										}`}
									>
										{h.isActive ? "Aktif" : "Nonaktif"}
									</button>
								</td>
								<td className="py-3 px-4 text-right space-x-1">
									<button
										type="button"
										onClick={() => onOpenEdit(h)}
										title="Edit Hadits"
										className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#1D5FA7] transition"
									>
										<Edit2 className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => onRequestDelete(h.id)}
										title="Hapus / Nonaktifkan Hadits"
										className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-[#64748B]">
					<span>
						Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalCount} hadits)
					</span>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => onPageChange(Math.max(1, page - 1))}
							className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => onPageChange(Math.min(totalPages, page + 1))}
							className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
