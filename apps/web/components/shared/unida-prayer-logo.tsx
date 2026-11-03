"use client";

import Link from "next/link";

interface UnidaPrayerLogoProps {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	variant?: "full" | "icon" | "minimal";
	theme?: "light" | "dark";
	showBadge?: boolean;
	href?: string;
	className?: string;
}

export function UnidaPrayerIcon({
	size = "md",
	className = "",
}: {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
}) {
	const sizeClasses = {
		xs: "h-7 w-7 rounded-lg",
		sm: "h-9 w-9 rounded-xl",
		md: "h-11 w-11 rounded-2xl",
		lg: "h-14 w-14 rounded-3xl",
		xl: "h-20 w-20 rounded-4xl",
	};

	return (
		<div
			className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-[#1A4C88] via-[#123B6D] to-[#0A1B2E] shadow-sm ring-1 ring-blue-400/25 ${sizeClasses[size]} ${className}`}
		>
			{/* Ambient lighting */}
			<div className="pointer-events-none absolute -top-2 -right-2 h-6 w-6 rounded-full bg-cyan-400/30 blur-xs" />
			<div className="pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-blue-600/40 blur-xs" />

			<svg
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="relative z-10 h-full w-full p-1.5"
			>
				<defs>
					<linearGradient id="iconGlow" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#BAE6FD" />
						<stop offset="50%" stopColor="#38BDF8" />
						<stop offset="100%" stopColor="#0284C7" />
					</linearGradient>
					<linearGradient id="iconGold" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#FDE68A" />
						<stop offset="100%" stopColor="#F59E0B" />
					</linearGradient>
				</defs>

				{/* 8-pointed star subtle motif */}
				<g opacity="0.22" stroke="url(#iconGold)" strokeWidth="1.2">
					<rect x="25" y="25" width="50" height="50" rx="4" />
					<rect
						x="25"
						y="25"
						width="50"
						height="50"
						rx="4"
						transform="rotate(45 50 50)"
					/>
				</g>

				{/* Mosque Arch */}
				<path
					d="M 33 76 L 33 52 C 33 40, 50 32, 50 32 C 50 32, 67 40, 67 52 L 67 76 Z"
					fill="#38BDF8"
					fillOpacity="0.25"
				/>

				{/* Minaret Needle & Spire */}
				<path d="M 48.5 24 L 51.5 24 L 50 17 Z" fill="url(#iconGlow)" />
				<circle cx="50" cy="15.5" r="1.5" fill="url(#iconGold)" />
				<rect
					x="48"
					y="26"
					width="4"
					height="16"
					rx="1"
					fill="#38BDF8"
					opacity="0.9"
				/>

				{/* Crescent Moon */}
				<path
					d="M 57 32 C 46 34 38 43 38 56 C 38 70 48 80 62 80 C 66 80 70 79 73 77 C 60 79 48 69 48 56 C 48 45 53 36 57 32 Z"
					fill="url(#iconGlow)"
				/>

				{/* Star at the crescent */}
				<g transform="translate(66, 39)">
					<path
						d="M 0 -3.5 L 1 -1 L 3.5 0 L 1 1 L 0 3.5 L -1 1 L -3.5 0 L -1 -1 Z"
						fill="url(#iconGold)"
					/>
				</g>

				{/* Mihrab Base Line */}
				<line
					x1="30"
					y1="76"
					x2="70"
					y2="76"
					stroke="url(#iconGold)"
					strokeWidth="1.8"
					strokeLinecap="round"
					opacity="0.85"
				/>
			</svg>
		</div>
	);
}

export function UnidaPrayerLogo({
	size = "md",
	variant = "full",
	theme = "light",
	showBadge = true,
	href,
	className = "",
}: UnidaPrayerLogoProps) {
	const content = (
		<div className={`flex items-center gap-3 ${className}`}>
			<UnidaPrayerIcon size={size} />

			{variant !== "icon" && (
				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<span
							className={`font-black tracking-tight ${
								size === "xs"
									? "text-sm"
									: size === "sm"
										? "text-base"
										: size === "md"
											? "text-lg"
											: size === "lg"
												? "text-xl"
												: "text-2xl"
							} ${theme === "dark" ? "text-white" : "text-[#102A46]"}`}
						>
							UNIDA{" "}
							<span
								className={theme === "dark" ? "text-[#6BA9D8]" : "text-[#1D5FA7]"}
							>
								Prayer
							</span>
						</span>

						{showBadge && (
							<span
								className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
									theme === "dark"
										? "bg-white/10 text-[#6BA9D8] ring-1 ring-white/15"
										: "bg-blue-50 text-[#1D5FA7] ring-1 ring-blue-700/10"
								}`}
							>
								V2.0
							</span>
						)}
					</div>

					{variant === "full" && (
						<p
							className={`text-xs font-medium tracking-tight ${
								theme === "dark" ? "text-slate-300" : "text-[#64748B]"
							}`}
						>
							Universitas Darussalam Gontor • Siman
						</p>
					)}
				</div>
			)}
		</div>
	);

	if (href) {
		return (
			<Link
				href={href}
				className="group inline-flex items-center transition-opacity hover:opacity-95"
			>
				{content}
			</Link>
		);
	}

	return content;
}
