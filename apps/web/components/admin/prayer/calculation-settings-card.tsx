import { Compass } from "lucide-react";

interface CalculationSettingsCardProps {
	methodLabel: string;
	asrFactor: 1 | 2;
	fajrAngle: number;
	ishaAngle: number;
	onChangeMethodLabel: (val: string) => void;
	onChangeAsrFactor: (val: 1 | 2) => void;
	onChangeFajrAngle: (val: number) => void;
	onChangeIshaAngle: (val: number) => void;
}

export function CalculationSettingsCard({
	methodLabel,
	asrFactor,
	fajrAngle,
	ishaAngle,
	onChangeMethodLabel,
	onChangeAsrFactor,
	onChangeFajrAngle,
	onChangeIshaAngle,
}: CalculationSettingsCardProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<Compass className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">
					Metode & Parameter Hisab
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Standar Metode:
					</label>
					<input
						type="text"
						value={methodLabel}
						onChange={(e) => onChangeMethodLabel(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Madzhab Waktu Ashar:
					</label>
					<select
						value={asrFactor}
						onChange={(e) => onChangeAsrFactor(Number(e.target.value) as 1 | 2)}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					>
						<option value={1}>Syafi'i, Maliki, Hanbali (Bayangan 1x)</option>
						<option value={2}>Hanafi (Bayangan 2x)</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Sudut Fajar / Subuh (derajat):
					</label>
					<input
						type="number"
						step="0.1"
						value={fajrAngle}
						onChange={(e) => onChangeFajrAngle(Number.parseFloat(e.target.value))}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
					<p className="mt-1 text-[11px] text-[#64748B]">Kemenag RI: 20.0°</p>
				</div>

				<div>
					<label className="block text-xs font-semibold text-[#102A46] mb-1">
						Sudut Isya (derajat):
					</label>
					<input
						type="number"
						step="0.1"
						value={ishaAngle}
						onChange={(e) => onChangeIshaAngle(Number.parseFloat(e.target.value))}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
					<p className="mt-1 text-[11px] text-[#64748B]">Kemenag RI: 18.0°</p>
				</div>
			</div>
		</div>
	);
}
