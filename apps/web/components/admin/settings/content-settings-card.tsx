import { Sliders } from "lucide-react";

interface ContentSettingsCardProps {
	includeHadith: boolean;
	onChangeIncludeHadith: (val: boolean) => void;
}

export function ContentSettingsCard({
	includeHadith,
	onChangeIncludeHadith,
}: ContentSettingsCardProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Sliders className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Pengaturan Konten & Hadits
				</h2>
			</div>

			<div className="space-y-3 text-xs">
				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						id="include-hadith-check"
						checked={includeHadith}
						onChange={(e) => onChangeIncludeHadith(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
					/>
					<label htmlFor="include-hadith-check" className="cursor-pointer">
						<span className="font-bold text-[#102A46]">
							Sertakan Kutipan Hadits / Ayat Harian pada Pesan Adzan
						</span>
						<p className="text-[#64748B] text-[11px] mt-0.5">
							Bila diaktifkan, bot akan memilih hadits aktif secara acak dan bergiliran untuk disisipkan ke dalam pesan adzan.
						</p>
					</label>
				</div>
			</div>
		</div>
	);
}
