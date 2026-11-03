import { Clock } from "lucide-react";

interface ReminderSettingsCardProps {
	reminderEnabled: boolean;
	adhanEnabled: boolean;
	preReminderEnabled: boolean;
	preReminderMinutes: number;
	lateGraceMinutes: number;
	onChangeReminderEnabled: (val: boolean) => void;
	onChangeAdhanEnabled: (val: boolean) => void;
	onChangePreReminderEnabled: (val: boolean) => void;
	onChangePreMinutes: (val: number) => void;
	onChangeLateGrace: (val: number) => void;
}

export function ReminderSettingsCard({
	reminderEnabled,
	adhanEnabled,
	preReminderEnabled,
	preReminderMinutes,
	lateGraceMinutes,
	onChangeReminderEnabled,
	onChangeAdhanEnabled,
	onChangePreReminderEnabled,
	onChangePreMinutes,
	onChangeLateGrace,
}: ReminderSettingsCardProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Clock className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Kebijakan Pengingat Shalat
				</h2>
			</div>

			<div className="space-y-4 text-xs">
				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						id="reminder-enabled-check"
						checked={reminderEnabled}
						onChange={(e) => onChangeReminderEnabled(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
					/>
					<label htmlFor="reminder-enabled-check" className="cursor-pointer">
						<span className="font-bold text-[#102A46]">
							Aktifkan Seluruh Jadwal Pengingat Shalat
						</span>
						<p className="text-[#64748B] text-[11px] mt-0.5">
							Bila dinonaktifkan, generator tidak akan membuat jadwal pesan baru.
						</p>
					</label>
				</div>

				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						id="adhan-enabled-check"
						checked={adhanEnabled}
						onChange={(e) => onChangeAdhanEnabled(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
					/>
					<label htmlFor="adhan-enabled-check" className="cursor-pointer">
						<span className="font-bold text-[#102A46]">
							Pesan Saat Masuk Waktu Shalat (Adzan)
						</span>
						<p className="text-[#64748B] text-[11px] mt-0.5">
							Mengirim pesan tepat saat waktu shalat tiba (Subuh, Dzuhur/Jumat, Ashar, Maghrib, Isya).
						</p>
					</label>
				</div>

				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						id="pre-reminder-enabled-check"
						checked={preReminderEnabled}
						onChange={(e) => onChangePreReminderEnabled(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
					/>
					<label htmlFor="pre-reminder-enabled-check" className="cursor-pointer">
						<span className="font-bold text-[#102A46]">
							Pesan Pengingat Persiapan (Pre-Reminder)
						</span>
						<p className="text-[#64748B] text-[11px] mt-0.5">
							Mengirim pengingat beberapa menit sebelum waktu shalat masuk agar jamaah dapat bersiap-siap.
						</p>
					</label>
				</div>

				<div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
					<div>
						<label className="block font-bold text-[#102A46] mb-1">
							Menit Pre-Reminder:
						</label>
						<input
							type="number"
							min={1}
							max={30}
							value={preReminderMinutes}
							onChange={(e) =>
								onChangePreMinutes(Number.parseInt(e.target.value, 10) || 3)
							}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						/>
						<span className="text-[10px] text-[#64748B]">Rentang: 1 - 30 menit sebelum adzan.</span>
					</div>

					<div>
						<label className="block font-bold text-[#102A46] mb-1">
							Toleransi Keterlambatan (Late Grace):
						</label>
						<input
							type="number"
							min={1}
							max={60}
							value={lateGraceMinutes}
							onChange={(e) =>
								onChangeLateGrace(Number.parseInt(e.target.value, 10) || 5)
							}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						/>
						<span className="text-[10px] text-[#64748B]">
							Pesan yang tertunda melebihi menit ini otomatis ditandai <code>EXPIRED</code> (tidak dikirim).
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
