"use client";

import {
	AlertCircle,
	ArrowLeft,
	Lock,
	Mail,
	Moon,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchApi } from "../../lib/api-client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const res = await fetchApi<{ id: number; name: string; email: string }>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});

		if (res.data) {
			router.push("/admin");
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F8FC] p-4 sm:p-6">
			<div className="w-full max-w-md space-y-6">
				{/* Top Return Link */}
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#123B6D] transition"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>Kembali ke Beranda Jadwal</span>
				</Link>

				{/* Card */}
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
					<div className="flex flex-col items-center text-center space-y-2">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123B6D] text-white shadow-xs">
							<Moon className="h-6 w-6 text-[#6BA9D8]" />
						</div>
						<h1 className="text-lg font-bold text-[#102A46] sm:text-xl">
							Portal Administrator UNIDA Prayer
						</h1>
						<p className="text-xs text-[#64748B]">
							Universitas Darussalam Gontor • Kampus Siman
						</p>
					</div>

					{error && (
						<div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
							<AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
							<span className="flex-1 font-medium">{error}</span>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label
								htmlFor="email-input"
								className="block text-xs font-bold text-[#102A46] mb-1.5"
							>
								Email Administrator:
							</label>
							<div className="relative">
								<Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
								<input
									id="email-input"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@unida.gontor.ac.id"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password-input"
								className="block text-xs font-bold text-[#102A46] mb-1.5"
							>
								Kata Sandi:
							</label>
							<div className="relative">
								<Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
								<input
									id="password-input"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••••••"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-xl bg-[#123B6D] py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#1D5FA7] transition disabled:opacity-50"
						>
							{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
						</button>
					</form>

					<div className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-[#1D5FA7] flex items-start gap-2">
						<ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
						<span>
							Akses terbatas khusus operator sistem UNIDA Prayer. Akun awal dibuat melalui perintah CLI server <code>bun run db:seed</code>.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
