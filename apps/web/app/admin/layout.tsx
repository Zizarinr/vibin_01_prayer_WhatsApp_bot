"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Moon,
	Radio,
	Settings,
	User,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fetchApi } from "../../lib/api-client";

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

	useEffect(() => {
		async function checkAuth() {
			const res = await fetchApi<AdminProfile>("/api/auth/me");
			if (res.data) {
				setAdmin(res.data);
			}
		}
		checkAuth();
	}, []);

	const handleLogout = async () => {
		await fetchApi("/api/auth/logout", { method: "POST" });
		router.push("/login");
	};

	const navItems = [
		{
			label: "Dashboard Utama",
			href: "/admin",
			icon: <LayoutDashboard className="h-4 w-4" />,
		},
		{
			label: "WhatsApp Sesi",
			href: "/admin/whatsapp",
			icon: <Radio className="h-4 w-4" />,
		},
		{
			label: "Grup & Target",
			href: "/admin/targets",
			icon: <Users className="h-4 w-4" />,
		},
		{
			label: "Jadwal & Hisab",
			href: "/admin/prayer",
			icon: <Calendar className="h-4 w-4" />,
		},
		{
			label: "Riwayat Kirim",
			href: "/admin/messages",
			icon: <MessageSquare className="h-4 w-4" />,
		},
		{
			label: "Konten Hadits",
			href: "/admin/hadits",
			icon: <BookOpen className="h-4 w-4" />,
		},
		{
			label: "Pengaturan Sistem",
			href: "/admin/settings",
			icon: <Settings className="h-4 w-4" />,
		},
	];

	return (
		<div className="flex min-h-screen flex-col bg-[#F5F8FC] lg:flex-row">
			{/* Admin Sidebar */}
			<aside className="w-full shrink-0 border-b border-blue-100/80 bg-white lg:w-64 lg:border-b-0 lg:border-r">
				<div className="flex h-full flex-col justify-between p-4 sm:p-6">
					<div>
						{/* Logo / Header */}
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-xs">
								<Moon className="h-5 w-5 text-[#6BA9D8]" />
							</div>
							<div>
								<h2 className="text-sm font-bold text-[#102A46]">
									UNIDA Prayer
								</h2>
								<p className="text-[11px] font-medium text-[#64748B]">
									Dashboard Administrator
								</p>
							</div>
						</div>

						{/* Navigation Links */}
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
												: "text-[#64748B] hover:bg-slate-50 hover:text-[#123B6D]"
										}`}
									>
										{item.icon}
										<span>{item.label}</span>
									</Link>
								);
							})}
						</nav>
					</div>

					{/* Bottom Actions */}
					<div className="mt-8 border-t border-slate-100 pt-4 space-y-3">
						{admin && (
							<div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
								<div className="flex items-center gap-2 overflow-hidden">
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#123B6D] text-white">
										<User className="h-3.5 w-3.5" />
									</div>
									<div className="overflow-hidden">
										<p className="truncate text-xs font-bold text-[#102A46]">
											{admin.name}
										</p>
										<p className="truncate text-[10px] text-[#64748B]">
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
							className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-slate-50 hover:text-[#123B6D]"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Kembali ke Landing</span>
						</Link>
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col">
				<main className="flex-1 p-4 sm:p-6 lg:p-8">
					<div className="mx-auto max-w-5xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
