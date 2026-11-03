"use client";

import {
	ArrowRight,
	Clock,
	Radio,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api-client";

export default function AdminOverviewPage() {
	const [wahaStatus, setWahaStatus] = useState<string>("Memuat...");
	const [targetCount, setTargetCount] = useState<number>(0);
	const [activeCount, setActiveCount] = useState<number>(0);

	useEffect(() => {
		async function load() {
			const sRes = await fetchApi<{ status: string }>("/api/admin/whatsapp/session");
			if (sRes.data) {
				setWahaStatus(sRes.data.status);
			}

			const tRes = await fetchApi<Array<{ isActive: boolean }>>("/api/admin/targets");
			if (tRes.data && Array.isArray(tRes.data)) {
				setTargetCount(tRes.data.length);
				setActiveCount(tRes.data.filter((t) => t.isActive).length);
			}
		}
		load();
	}, []);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
					Dashboard Overview
				</h1>
				<p className="text-xs text-[#64748B]">
					Ringkasan operasional bot pengingat waktu shalat UNIDA Gontor.
				</p>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Status WhatsApp</span>
						<Radio className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
								wahaStatus === "WORKING"
									? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
									: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
							}`}
						>
							{wahaStatus}
						</span>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Grup Terdaftar</span>
						<Users className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-extrabold text-[#102A46]">{targetCount}</span>
						<span className="text-xs text-emerald-700 font-semibold">({activeCount} Aktif)</span>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#64748B]">Lokasi & Hisab</span>
						<Clock className="h-4 w-4 text-[#1D5FA7]" />
					</div>
					<div className="mt-3">
						<span className="text-sm font-bold text-[#102A46]">Siman, Ponorogo</span>
						<p className="text-[11px] text-[#64748B]">Kemenag Standar (WIB)</p>
					</div>
				</div>
			</div>

			{/* Quick Action Navigation Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Link
					href="/admin/whatsapp"
					className="group rounded-3xl border border-blue-100 bg-white p-6 shadow-sm hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7] group-hover:bg-[#123B6D] group-hover:text-white transition">
							<Radio className="h-6 w-6" />
						</div>
						<ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-[#1D5FA7] transition" />
					</div>
					<h3 className="mt-4 text-base font-bold text-[#102A46]">
						Kelola Sesi WhatsApp
					</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Pantau status koneksi WAHA, lakukan scan QR code pairing, dan kirim pesan uji coba.
					</p>
				</Link>

				<Link
					href="/admin/targets"
					className="group rounded-3xl border border-blue-100 bg-white p-6 shadow-sm hover:border-[#1D5FA7] hover:shadow-md transition"
				>
					<div className="flex items-center justify-between">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
							<Users className="h-6 w-6" />
						</div>
						<ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition" />
					</div>
					<h3 className="mt-4 text-base font-bold text-[#102A46]">
						Kelola Target & Grup
					</h3>
					<p className="mt-1 text-xs text-[#64748B]">
						Sinkronisasi daftar grup WhatsApp dari WAHA dan aktifkan grup penerima pengingat shalat.
					</p>
				</Link>
			</div>
		</div>
	);
}
