"use client";

import { Clock } from "lucide-react";
import { UnidaPrayerLogo } from "../shared/unida-prayer-logo";

interface HeaderProps {
	liveTimeString: string;
}

export function Header({ liveTimeString }: HeaderProps) {
	return (
		<header className="border-b border-blue-100/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
				<UnidaPrayerLogo href="/" size="sm" showBadge />

				<div className="flex items-center gap-2 sm:gap-4">
					<div className="flex items-center gap-1.5 rounded-lg bg-[#EAF2FB] px-3 py-1.5 text-xs font-semibold text-[#123B6D] ring-1 ring-blue-700/10">
						<Clock className="h-3.5 w-3.5 text-[#1D5FA7]" />
						<span className="tabular-nums font-mono text-sm tracking-wide">
							{liveTimeString}
						</span>
						<span className="text-[10px] text-[#64748B]">WIB</span>
					</div>
				</div>
			</div>
		</header>
	);
}
