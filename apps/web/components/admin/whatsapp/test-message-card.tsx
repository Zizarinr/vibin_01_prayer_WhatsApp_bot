import { Send } from "lucide-react";

export interface MessageTargetOption {
	id: number;
	name: string;
	targetId: string;
	isActive: boolean;
}

interface TestMessageCardProps {
	targets: MessageTargetOption[];
	selectedTargetId: number | null;
	customText: string;
	sendingTest: boolean;
	testResult: string | null;
	onSelectTarget: (id: number) => void;
	onChangeText: (text: string) => void;
	onSendTest: (e: React.FormEvent) => void;
}

export function TestMessageCard({
	targets,
	selectedTargetId,
	customText,
	sendingTest,
	testResult,
	onSelectTarget,
	onChangeText,
	onSendTest,
}: TestMessageCardProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Send className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Kirim Pesan Uji Coba (Test Message)
				</h2>
			</div>

			<p className="text-xs text-[#64748B]">
				Uji konektivitas gateway WAHA dengan mengirimkan pesan uji coba ke grup pilihan.
			</p>

			<form onSubmit={onSendTest} className="space-y-4">
				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Pilih Target Penerima:
					</label>
					{targets.length > 0 ? (
						<select
							value={selectedTargetId ?? ""}
							onChange={(e) => onSelectTarget(Number(e.target.value))}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none font-medium"
						>
							{targets.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name} {t.isActive ? "(Aktif)" : "(Nonaktif)"}
								</option>
							))}
						</select>
					) : (
						<div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">
							Belum ada target tersinkronisasi. Silakan sinkronisasi grup di menu Target.
						</div>
					)}
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Pesan Kustom (Opsional):
					</label>
					<textarea
						rows={2}
						value={customText}
						onChange={(e) => onChangeText(e.target.value)}
						placeholder="Biarkan kosong untuk menggunakan teks pengujian standar UNIDA Prayer..."
						className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				{testResult && (
					<div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
						{testResult}
					</div>
				)}

				<div className="flex justify-end">
					<button
						type="submit"
						disabled={sendingTest || !selectedTargetId}
						className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition disabled:opacity-50"
					>
						<Send className="h-4 w-4" />
						<span>{sendingTest ? "Mengirim Pesan..." : "Kirim Pesan Uji Coba"}</span>
					</button>
				</div>
			</form>
		</div>
	);
}
