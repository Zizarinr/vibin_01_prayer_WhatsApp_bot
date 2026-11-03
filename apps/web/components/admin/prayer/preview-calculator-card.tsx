import { Eye, HelpCircle } from "lucide-react";

export interface PreviewResult {
	input: {
		dateLocal: string;
		latitude: number;
		longitude: number;
	};
	times: Record<
		string,
		{
			displayName: string;
			time24: string;
			timeLabel: string;
		}
	>;
	isFriday: boolean;
}

interface PreviewCalculatorCardProps {
	previewDate: string;
	previewResult: PreviewResult | null;
	loadingPreview: boolean;
	onChangePreviewDate: (val: string) => void;
	onRunPreview: () => void;
}

export function PreviewCalculatorCard({
	previewDate,
	previewResult,
	loadingPreview,
	onChangePreviewDate,
	onRunPreview,
}: PreviewCalculatorCardProps) {
	return (
		<div className="rounded-3xl border border-blue-200/80 bg-white p-5 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Eye className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Preview Kalkulasi Hisab
				</h2>
			</div>

			<p className="text-xs text-[#64748B]">
				Simulasikan hasil jadwal shalat secara langsung tanpa harus menyimpan perubahan ke database.
			</p>

			<div>
				<label className="block text-xs font-semibold text-[#102A46] mb-1">
					Pilih Tanggal Uji Coba:
				</label>
				<div className="flex gap-2">
					<input
						type="date"
						value={previewDate}
						onChange={(e) => onChangePreviewDate(e.target.value)}
						className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
					<button
						type="button"
						onClick={onRunPreview}
						disabled={loadingPreview || !previewDate}
						className="rounded-xl bg-[#1D5FA7] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#123B6D] transition disabled:opacity-50"
					>
						{loadingPreview ? "..." : "Hitung"}
					</button>
				</div>
			</div>

			{previewResult && (
				<div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 space-y-3">
					<div className="flex items-center justify-between text-xs font-bold text-[#123B6D]">
						<span>Hasil Jadwal ({previewDate})</span>
						{previewResult.isFriday && (
							<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
								Hari Jumat
							</span>
						)}
					</div>

					<div className="space-y-1.5">
						{Object.entries(previewResult.times).map(([key, item]) => (
							<div
								key={key}
								className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs shadow-2xs"
							>
								<span className="font-medium text-[#102A46]">
									{item.displayName}
								</span>
								<span className="font-bold text-[#123B6D]">
									{item.timeLabel}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="rounded-xl bg-slate-50 p-3 text-[11px] text-[#64748B] flex items-start gap-2">
				<HelpCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
				<span>
					Waktu adzan dan pre-reminder yang dikirim ke WhatsApp bersumber dari parameter hisab ini.
				</span>
			</div>
		</div>
	);
}
