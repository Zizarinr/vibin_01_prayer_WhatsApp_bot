"use client";

import { CalendarClock, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import type { TestTargetMode } from "./test-message-card";

interface PreviewMessage {
	seq: number;
	prayerName: string;
	messageType: "PRE_REMINDER" | "ADHAN";
	label: string;
	body: string;
	contentRef: string;
}

interface PreviewData {
	target: { chatId: string; displayName: string };
	dateLocal: string;
	messages: PreviewMessage[];
	estimatedSeconds: number;
}

interface RunStatus {
	runId: string;
	status: "RUNNING" | "DONE" | "CANCELLED";
	total: number;
	sent: number;
	failed: number;
	target: string;
	results: { seq: number; ok: boolean; messageId?: string; error?: string }[];
}

interface DayTestCardProps {
	mode: TestTargetMode;
	targetId: number | null;
	phone: string;
	hasTargets: boolean;
}

function targetBody(
	mode: TestTargetMode,
	targetId: number | null,
	phone: string,
): Record<string, unknown> | null {
	if (mode === "GROUP") {
		if (targetId === null) return null;
		return { targetId };
	}
	if (phone.trim().length === 0) return null;
	return { phone: phone.trim() };
}

export function DayTestCard({ mode, targetId, phone, hasTargets }: DayTestCardProps) {
	const [preview, setPreview] = useState<PreviewData | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [run, setRun] = useState<RunStatus | null>(null);
	const [runError, setRunError] = useState<string | null>(null);
	const [cancelling, setCancelling] = useState(false);
	const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollTimer.current) {
			clearInterval(pollTimer.current);
			pollTimer.current = null;
		}
	}, []);

	useEffect(() => stopPolling, [stopPolling]);

	// Target berubah → pratinjau lama tidak berlaku lagi.
	useEffect(() => {
		setPreview(null);
		setPreviewError(null);
	}, [mode, targetId, phone]);

	const handlePreview = async () => {
		const body = targetBody(mode, targetId, phone);
		if (!body) return;

		setPreviewLoading(true);
		setPreviewError(null);
		setPreview(null);

		const res = await fetchApi<PreviewData>("/api/admin/whatsapp/test-day/preview", {
			method: "POST",
			body: JSON.stringify(body),
		});

		if (res.data) {
			setPreview(res.data);
		} else if (res.error) {
			setPreviewError(res.error.message);
		}
		setPreviewLoading(false);
	};

	const pollStatus = useCallback(
		async (runId: string) => {
			const res = await fetchApi<RunStatus>(
				`/api/admin/whatsapp/test-day/status?runId=${encodeURIComponent(runId)}`,
			);
			if (res.data) {
				setRun(res.data);
				if (res.data.status !== "RUNNING") stopPolling();
			} else if (res.error) {
				setRunError(res.error.message);
				stopPolling();
			}
		},
		[stopPolling],
	);

	const handleStart = async (indexes?: number[]) => {
		const body = targetBody(mode, targetId, phone);
		if (!body) return;

		setRunError(null);
		setRun(null);

		const res = await fetchApi<{ runId: string; total: number; estimatedSeconds: number }>(
			"/api/admin/whatsapp/test-day/start",
			{
				method: "POST",
				body: JSON.stringify({ ...body, ...(indexes ? { indexes } : {}) }),
			},
		);

		if (res.data) {
			const runId = res.data.runId;
			setRun({
				runId,
				status: "RUNNING",
				total: res.data.total,
				sent: 0,
				failed: 0,
				target: "",
				results: [],
			});
			stopPolling();
			pollTimer.current = setInterval(() => pollStatus(runId), 2000);
			void pollStatus(runId);
		} else if (res.error) {
			setRunError(res.error.message);
		}
	};

	const handleCancel = async () => {
		if (!run || run.status !== "RUNNING") return;
		setCancelling(true);
		const res = await fetchApi<{ runId: string; status: string }>(
			"/api/admin/whatsapp/test-day/cancel",
			{ method: "POST", body: JSON.stringify({ runId: run.runId }) },
		);
		if (res.error) setRunError(res.error.message);
		setCancelling(false);
		void pollStatus(run.runId);
	};

	const canTarget =
		mode === "PERSONAL" ? phone.trim().length > 0 : targetId !== null && hasTargets;
	const running = run?.status === "RUNNING";
	const firstPre = preview?.messages.find((m) => m.messageType === "PRE_REMINDER");

	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-3">
				<CalendarClock className="h-4 w-4 text-[#1D5FA7]" />
				<h2 className="text-sm font-bold text-[#102A46]">Simulasi Sehari Penuh</h2>
			</div>

			<p className="text-xs text-[#64748B]">
				Kirim seluruh pesan jadwal hari ini (pre-reminder + adzan tiap waktu) persis seperti yang
				akan keluar, dengan jeda ±3 detik + acak 1–2 detik antar pesan agar tidak dianggap spam.
			</p>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={handlePreview}
					disabled={previewLoading || running || !canTarget}
					className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-[#102A46] hover:bg-slate-200 transition disabled:opacity-50"
				>
					{previewLoading ? "Memuat pratinjau..." : "Pratinjau Sehari Penuh"}
				</button>
				{preview && !running && (
					<>
						{firstPre && (
							<button
								type="button"
								onClick={() => handleStart([firstPre.seq])}
								className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#123B6D] ring-1 ring-[#123B6D]/30 hover:bg-[#F5F8FC] transition"
							>
								<Play className="h-4 w-4" />
								Kirim 1 Pre-Reminder
							</button>
						)}
						<button
							type="button"
							onClick={() => handleStart()}
							className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition"
						>
							<Play className="h-4 w-4" />
							Kirim Semua ({preview.messages.length} pesan ±{preview.estimatedSeconds}d)
						</button>
					</>
				)}
				{running && (
					<button
						type="button"
						onClick={handleCancel}
						disabled={cancelling}
						className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
					>
						<Square className="h-4 w-4" />
						{cancelling ? "Membatalkan..." : "Batalkan"}
					</button>
				)}
			</div>

			{!canTarget && (
				<div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">
					{mode === "GROUP"
						? "Pilih grup tersimpan dulu (atau sinkronisasi di menu Target)."
						: "Isi nomor HP pribadi dulu pada pilihan di atas."}
				</div>
			)}

			{previewError && (
				<div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 font-medium">{previewError}</div>
			)}

			{preview && (
				<div className="space-y-2">
					<p className="text-xs font-semibold text-[#102A46]">
						Pratinjau {preview.messages.length} pesan · {preview.dateLocal} · ke{" "}
						{preview.target.displayName}
					</p>
					<div className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
						{preview.messages.map((m) => (
							<details key={m.seq} className="rounded-lg bg-white ring-1 ring-slate-200/70">
								<summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[#172B43]">
									{m.seq + 1}. {m.label}
								</summary>
								<p className="whitespace-pre-wrap px-3 pb-3 text-[11px] leading-relaxed text-[#475569]">
									{m.body}
								</p>
							</details>
						))}
					</div>
				</div>
			)}

			{run && (
				<div className="space-y-2 rounded-xl bg-[#F5F8FC] p-3">
					<div className="flex items-center justify-between text-xs font-semibold text-[#102A46]">
						<span>
							{run.status === "RUNNING"
								? `Mengirim... ${run.sent + run.failed}/${run.total}`
								: run.status === "DONE"
									? `Selesai: ${run.sent} terkirim, ${run.failed} gagal`
									: `Dibatalkan: ${run.sent} terkirim, ${run.failed} gagal`}
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-slate-200">
						<div
							className="h-full rounded-full bg-[#1D5FA7] transition-all"
							style={{ width: `${run.total > 0 ? ((run.sent + run.failed) / run.total) * 100 : 0}%` }}
						/>
					</div>
					{run.results
						.filter((r) => !r.ok)
						.map((r) => (
							<p key={r.seq} className="text-[11px] text-red-700">
								Pesan #{r.seq + 1} gagal: {r.error}
							</p>
						))}
				</div>
			)}

			{runError && (
				<div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 font-medium">{runError}</div>
			)}
		</div>
	);
}
