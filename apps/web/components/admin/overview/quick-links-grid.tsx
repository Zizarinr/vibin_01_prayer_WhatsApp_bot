import {
	ArrowRight,
	BookOpen,
	Calendar,
	MessageSquare,
	Radio,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";

export function QuickLinksGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Link
				href="/admin/whatsapp"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7] group-hover:bg-[#123B6D] group-hover:text-white transition">
						<Radio className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#1D5FA7] transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Koneksi WhatsApp</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Pantau status sesi WAHA, scan QR code pairing, dan kirim pesan uji coba.
				</p>
			</Link>

			<Link
				href="/admin/targets"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
						<Users className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Target & Grup</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Sinkronisasi grup dari WhatsApp dan aktifkan grup penerima jadwal shalat.
				</p>
			</Link>

			<Link
				href="/admin/prayer"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
						<Calendar className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Jadwal & Hisab</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Sesuaikan koordinat kampus, sudut hisab Kemenag, koreksi menit, dan hitung ulang jadwal.
				</p>
			</Link>

			<Link
				href="/admin/messages"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition">
						<MessageSquare className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Riwayat Pesan</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Lihat daftar pesan yang telah terkirim, tinjau snapshot teks, dan lakukan retry manual.
				</p>
			</Link>

			<Link
				href="/admin/hadits"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
						<BookOpen className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Konten Hadits</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Kelola hadits dan ayat shalat terverifikasi yang dirotasikan pada pesan adzan harian.
				</p>
			</Link>

			<Link
				href="/admin/settings"
				className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-xs hover:border-[#1D5FA7] hover:shadow-md transition"
			>
				<div className="flex items-center justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-[#123B6D] group-hover:text-white transition">
						<Settings className="h-5 w-5" />
					</div>
					<ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#123B6D] transition" />
				</div>
				<h3 className="mt-3 text-sm font-bold text-[#102A46]">Pengaturan Sistem</h3>
				<p className="mt-1 text-xs text-[#64748B]">
					Kontrol kill-switch darurat, durasi pre-reminder, batas late grace, dan status server.
				</p>
			</Link>
		</div>
	);
}
