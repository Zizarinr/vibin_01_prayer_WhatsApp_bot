"use client";

import Image from "next/image";
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
	const pixelSizes = {
		xs: 32,
		sm: 40,
		md: 48,
		lg: 64,
		xl: 96,
	};

	const sizeClasses = {
		xs: "h-7 w-7 rounded-lg",
		sm: "h-9 w-9 rounded-xl",
		md: "h-11 w-11 rounded-2xl",
		lg: "h-14 w-14 rounded-3xl",
		xl: "h-20 w-20 rounded-4xl",
	};

	const px = pixelSizes[size];

	return (
		<div
			className={`relative flex shrink-0 items-center justify-center overflow-hidden shadow-sm ring-1 ring-blue-300/30 transition-transform ${sizeClasses[size]} ${className}`}
		>
			<Image
				src="/app-icon-512.png"
				alt="UNIDA Prayer Icon"
				width={px}
				height={px}
				unoptimized
				priority={size === "xs" || size === "sm" || size === "md"}
				className="h-full w-full object-cover select-none"
			/>
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
