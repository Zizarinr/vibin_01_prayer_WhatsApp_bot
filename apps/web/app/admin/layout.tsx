"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	LayoutDashboard,
	LogOut,
	Menu,
	MessageSquare,
	Radio,
	Settings,
	User,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DynamicPrayerBackground } from "../../components/landing/dynamic-prayer-background";
import { UnidaPrayerLogo } from "../../components/shared/unida-prayer-logo";
import { fetchApi } from "../../lib/api-client";
import { adminRoute, LOGIN_ROUTE } from "../../lib/admin-path";

interface AdminProfile {
	id: number;
	name: string;
	email: string;
}

interface AdminLayoutProps {
	children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [admin, setAdmin] = useState<AdminProfile | null>(null);
	const [authChecked, setAuthChecked] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	useEffect(() => {
		let cancelled = false;
		async function checkAuth() {
			const res = await fetchApi<AdminProfile>("/api/auth/me");
			if (cancelled) return;
			if (res.data) {
				setAdmin(res.data);
			} else {
				router.push(LOGIN_ROUTE);
				return;
			}
			setAuthChecked(true);
		}
		checkAuth();
		return () => {
			cancelled = true;
		};
	}, [router]);

	const handleLogout = async () => {
		await fetchApi("/api/auth/logout", { method: "POST" });
		router.push(LOGIN_ROUTE);
	};

	const navItems = [
		{
			label: "Dashboard Utama",
			href: adminRoute("/"),
			icon: <LayoutDashboard className="h-4 w-4" />,
		},
		{
			label: "WhatsApp Sesi",
			href: adminRoute("/whatsapp"),
			icon: <Radio className="h-4 w-4" />,
		},
		{
			label: "Grup & Target",
			href: adminRoute("/targets"),
			icon: <Users className="h-4 w-4" />,
		},
		{
			label: "Jadwal & Hisab",
			href: adminRoute("/prayer"),
			icon: <Calendar className="h-4 w-4" />,
		},
		{
			label: "Riwayat Kirim",
			href: adminRoute("/messages"),
			icon: <MessageSquare className="h-4 w-4" />,
		},
		{
			label: "Konten Hadits",
			href: adminRoute("/hadits"),
			icon: <BookOpen className="h-4 w-4" />,
		},
		{
			label: "Pengaturan Sistem",
			href: adminRoute("/settings"),
			icon: <Settings className="h-4 w-4" />,
		},
	];

	if (!authChecked) {
		return (
			<div className="relative flex min-h-screen items-center justify-center bg-transparent">
				<DynamicPrayerBackground />
				<div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur-md">
					<p className="text-sm font-medium text-[#102A46]">Memeriksa sesi login…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-screen flex-col bg-transparent lg:flex-row">
			<DynamicPrayerBackground
				overlayClassName="bg-linear-to-b from-[#0A1B2E]/35 via-[#102A46]/15 to-[#F5F8FC]/92 backdrop-blur-[3px]"
			/>

			<header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs lg:hidden">
				<UnidaPrayerLogo href={adminRoute("/")} size="xs" showBadge={false} />

				<button
					type="button"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none"
					aria-label="Toggle navigation menu"
				>
					{mobileMenuOpen ? (
						<X className="h-5 w-5" />
					) : (
						<Menu className="h-5 w-5" />
					)}
				</button>
			</header>

			{mobileMenuOpen && (
				<div
					className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
					onClick={() => setMobileMenuOpen(false)}
				>
					<div
						className="relative flex h-full w-4/5 max-w-xs flex-col justify-between bg-white p-5 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div>
							<div className="flex items-center justify-between border-b border-slate-100 pb-4">
								<UnidaPrayerLogo href={adminRoute("/")} size="xs" showBadge />
								<button
									type="button"
									onClick={() => setMobileMenuOpen(false)}
									className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<nav className="mt-5 space-y-1">
								{navItems.map((item) => {
									const active = pathname === item.href;
									return (
										<Link
											key={item.href}
											href={item.href}
											className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
												active
													? "bg-[#123B6D] text-white shadow-xs"
													: "text-slate-700 hover:bg-slate-100/80 hover:text-[#123B6D]"
											}`}
										>
											{item.icon}
											<span>{item.label}</span>
										</Link>
									);
								})}
							</nav>
						</div>

						<div className="border-t border-slate-100 pt-4 space-y-3">
							{admin && (
								<div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
									<div className="flex items-center gap-2 overflow-hidden">
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#123B6D] text-white">
											<User className="h-3.5 w-3.5" />
										</div>
										<div className="overflow-hidden">
											<p className="truncate text-xs font-bold text-[#102A46]">
												{admin.name}
											</p>
											<p className="truncate text-[10px] font-medium text-slate-600">
												{admin.email}
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={handleLogout}
										title="Keluar dari akun"
										className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
									>
										<LogOut className="h-4 w-4" />
									</button>
								</div>
							)}

							<Link
								href="/"
								className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 hover:text-[#123B6D]"
							>
								<ArrowLeft className="h-4 w-4" />
								<span>Kembali ke Beranda</span>
							</Link>
						</div>
					</div>
				</div>
			)}

			<aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-md lg:flex lg:flex-col lg:justify-between lg:p-6 h-screen sticky top-0 shadow-sm">
				<div>
					<UnidaPrayerLogo href={adminRoute("/")} size="sm" showBadge />

					<nav className="mt-8 space-y-1.5">
						{navItems.map((item) => {
							const active = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
										active
											? "bg-[#123B6D] text-white shadow-xs"
											: "text-slate-700 hover:bg-slate-100/80 hover:text-[#123B6D]"
									}`}
								>
									{item.icon}
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="border-t border-slate-100 pt-4 space-y-3">
					{admin && (
						<div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
							<div className="flex items-center gap-2 overflow-hidden">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#123B6D] text-white shadow-2xs">
									<User className="h-4 w-4" />
								</div>
								<div className="overflow-hidden">
									<p className="truncate text-xs font-bold text-[#102A46]">
										{admin.name}
									</p>
									<p className="truncate text-[10px] font-medium text-slate-600">
										{admin.email}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleLogout}
								title="Keluar dari akun"
								className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
							>
								<LogOut className="h-4 w-4" />
							</button>
						</div>
					)}

					<Link
						href="/"
						className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 hover:text-[#123B6D]"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Kembali ke Beranda</span>
					</Link>
				</div>
			</aside>

			<div className="flex flex-1 flex-col">
				<main className="flex-1 p-4 sm:p-6 lg:p-8">
					<div className="mx-auto max-w-5xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
