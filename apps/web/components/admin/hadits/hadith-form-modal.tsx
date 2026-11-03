import { BookOpen, X } from "lucide-react";
import type { HadithItem } from "./hadits-table";

interface HadithFormModalProps {
	isOpen: boolean;
	editingHadith: HadithItem | null;
	formText: string;
	formSource: string;
	formIsActive: boolean;
	actionLoading: boolean;
	onChangeText: (val: string) => void;
	onChangeSource: (val: string) => void;
	onChangeIsActive: (val: boolean) => void;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function HadithFormModal({
	isOpen,
	editingHadith,
	formText,
	formSource,
	formIsActive,
	actionLoading,
	onChangeText,
	onChangeSource,
	onChangeIsActive,
	onClose,
	onSubmit,
}: HadithFormModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<BookOpen className="h-5 w-5 text-[#1D5FA7]" />
						<h3 className="text-sm font-bold text-[#102A46]">
							{editingHadith ? "Edit Kutipan Hadits / Ayat" : "Tambah Hadits / Ayat Baru"}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={onSubmit} className="space-y-4 text-xs">
					<div>
						<label className="block text-xs font-bold text-[#102A46] mb-1">
							Teks Terjemahan (Bahasa Indonesia):
						</label>
						<textarea
							required
							rows={4}
							value={formText}
							onChange={(e) => onChangeText(e.target.value)}
							placeholder="Tuliskan terjemahan hadits atau ayat secara lengkap dan terverifikasi..."
							className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						/>
						<span className="text-[10px] text-[#64748B]">Minimal 10 karakter.</span>
					</div>

					<div>
						<label className="block text-xs font-bold text-[#102A46] mb-1">
							Sumber Periwayatan / Rujukan:
						</label>
						<input
							type="text"
							required
							value={formSource}
							onChange={(e) => onChangeSource(e.target.value)}
							placeholder="Contoh: HR. Bukhari & Muslim / QS. Al-Baqarah: 238"
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						/>
						<span className="text-[10px] text-[#64748B]">
							Bila rujukan diawali <code>QS.</code>, sistem otomatis mencantumkan judul &ldquo;Ayat Hari Ini&rdquo;.
						</span>
					</div>

					<div className="flex items-center gap-2 pt-1">
						<input
							type="checkbox"
							id="hadith-active-check"
							checked={formIsActive}
							onChange={(e) => onChangeIsActive(e.target.checked)}
							className="h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
						/>
						<label
							htmlFor="hadith-active-check"
							className="text-xs font-bold text-[#102A46] cursor-pointer"
						>
							Aktifkan hadits ini untuk pengiriman pesan shalat
						</label>
					</div>

					<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={actionLoading}
							className="rounded-xl bg-[#123B6D] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D5FA7] disabled:opacity-50 transition"
						>
							{actionLoading ? "Menyimpan..." : "Simpan Hadits"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
