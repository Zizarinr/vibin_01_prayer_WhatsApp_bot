"use client";

import { Clock, Lock, Moon } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
	liveTimeString: string;
}

export function Header({ liveTimeString }: HeaderProps) {
	return (
		<header className="border-b border-blue-100/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-sm ring-2 ring-[#1D5FA7]/20">
						<Moon className="h-5 w-5 text-[#6BA9D8]" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-base font-bold tracking-tight text-[#102A46] sm:text-lg">
								UNIDA Prayer
							</h1>
							<span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#1D5FA7] ring-1 ring-blue-700/10 sm:inline-block">
								V2.0
							</span>
						</div>
						<p className="text-xs font-medium text-[#64748B]">
							Universitas Darussalam Gontor • Kampus Siman
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-4">
					{/* Real-time Clock Pill */}
					<div className="flex items-center gap-1.5 rounded-lg bg-[#EAF2FB] px-3 py-1.5 text-xs font-semibold text-[#123B6D]">
						<Clock className="h-3.5 w-3.5 text-[#1D5FA7]" />
						<span className="tabular-nums font-mono text-sm tracking-wide">
							{liveTimeString}
						</span>
						<span className="text-[10px] text-[#64748B]">WIB</span>
					</div>

					{/* Admin Portal Link */}
					<Link
						href="/login"
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#172B43] shadow-2xs transition-all hover:border-[#1D5FA7]/30 hover:bg-slate-50 hover:text-[#123B6D]"
						title="Masuk ke Dashboard Admin"
					>
						<Lock className="h-3.5 w-3.5 text-[#64748B]" />
						<span className="hidden sm:inline">Admin</span>
					</Link>
				</div>
			</div>
		</header>
	);
}
