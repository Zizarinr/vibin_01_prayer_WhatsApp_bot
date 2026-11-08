import type { ReactNode } from "react";

interface AdminPageHeaderProps {
	title: string;
	description: ReactNode;
	children?: ReactNode;
}

export function AdminPageHeader({
	title,
	description,
	children,
}: AdminPageHeaderProps) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 sm:p-5 shadow-xs backdrop-blur-md ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
					{title}
				</h1>
				<p className="text-xs text-[#64748B]">
					{description}
				</p>
			</div>
			{children && (
				<div className="flex items-center gap-2 shrink-0">
					{children}
				</div>
			)}
		</div>
	);
}
