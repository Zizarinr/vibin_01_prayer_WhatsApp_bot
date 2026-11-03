import { Search } from "lucide-react";

interface TargetFiltersProps {
	searchQuery: string;
	filterActive: "ALL" | "ACTIVE" | "INACTIVE";
	onSearchChange: (query: string) => void;
	onFilterChange: (filter: "ALL" | "ACTIVE" | "INACTIVE") => void;
}

export function TargetFilters({
	searchQuery,
	filterActive,
	onSearchChange,
	onFilterChange,
}: TargetFiltersProps) {
	return (
		<div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
			<div className="relative flex-1">
				<Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
				<input
					type="text"
					placeholder="Cari nama grup atau ID WhatsApp..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
				/>
			</div>

			<div className="flex items-center gap-1.5 text-xs">
				{(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => (
					<button
						key={filter}
						type="button"
						onClick={() => onFilterChange(filter)}
						className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
							filterActive === filter
								? "bg-[#123B6D] text-white shadow-2xs"
								: "bg-slate-100 text-[#64748B] hover:bg-slate-200/70 hover:text-[#102A46]"
						}`}
					>
						{filter === "ALL" ? "Semua" : filter === "ACTIVE" ? "Hanya Aktif" : "Nonaktif"}
					</button>
				))}
			</div>
		</div>
	);
}
