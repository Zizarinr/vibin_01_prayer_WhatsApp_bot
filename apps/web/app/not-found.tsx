import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UnidaPrayerLogo } from "../components/shared/unida-prayer-logo";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F8FC] p-4 text-center">
			<div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
				<div className="flex justify-center">
					<UnidaPrayerLogo href="/" size="sm" showBadge={false} />
				</div>
				<div className="space-y-2">
					<span className="text-4xl font-black text-[#123B6D]">404</span>
					<h1 className="text-lg font-bold text-[#102A46]">Halaman Tidak Ditemukan</h1>
					<p className="text-xs text-[#64748B]">
						Halaman yang Anda tuju tidak tersedia atau tautan telah dipindahkan.
					</p>
				</div>
				<Link
					href="/"
					className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1D5FA7]"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>Kembali ke Halaman Utama</span>
				</Link>
			</div>
		</div>
	);
}
