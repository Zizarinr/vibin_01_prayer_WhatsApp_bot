"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { AdminPageHeader } from "../../../components/admin/shared/admin-page-header";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";
import { QrPairingModal } from "../../../components/admin/whatsapp/qr-pairing-modal";
import { SessionActionModal } from "../../../components/admin/whatsapp/session-action-modal";
import {
	SessionStatusCard,
	type WahaSessionInfo,
} from "../../../components/admin/whatsapp/session-status-card";
import {
	TestMessageCard,
	type MessageTargetOption,
	type TestTargetMode,
} from "../../../components/admin/whatsapp/test-message-card";
import { DayTestCard } from "../../../components/admin/whatsapp/day-test-card";

export default function WhatsappSessionPage() {
	const [session, setSession] = useState<WahaSessionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const [qrData, setQrData] = useState<string | null>(null);
	const [showQrModal, setShowQrModal] = useState(false);
	const [loadingQr, setLoadingQr] = useState(false);

	const [targets, setTargets] = useState<MessageTargetOption[]>([]);
	const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
	const [testMode, setTestMode] = useState<TestTargetMode>("GROUP");
	const [phone, setPhone] = useState("");
	const [customText, setCustomText] = useState("");
	const [sendingTest, setSendingTest] = useState(false);
	const [testResult, setTestResult] = useState<string | null>(null);

	const [confirmAction, setConfirmAction] = useState<"STOP" | "RESTART" | "LOGOUT" | null>(null);

	const loadSession = useCallback(async () => {
		const res = await fetchApi<WahaSessionInfo>("/api/admin/whatsapp/session");
		if (res.error || !res.data) {
			setError(res.error?.message || "Gagal memuat status sesi WAHA.");
		} else {
			setSession(res.data);
			setError(null);
			if (res.data.status === "WORKING") {
				setQrData(null);
				setShowQrModal(false);
			}
		}
		setLoading(false);
	}, []);

	const loadTargets = useCallback(async () => {
		const res = await fetchApi<MessageTargetOption[]>("/api/admin/targets");
		if (res.data && Array.isArray(res.data)) {
			setTargets(res.data);
			if (res.data.length > 0 && selectedTargetId === null) {
				const activeFirst = res.data.find((t) => t.isActive) || res.data[0];
				if (activeFirst) {
					setSelectedTargetId(activeFirst.id);
				}
			}
		}
	}, [selectedTargetId]);

	const loadQrCode = useCallback(async () => {
		setLoadingQr(true);
		const res = await fetchApi<{ format: string; data: string }>(
			"/api/admin/whatsapp/session/qr",
		);
		if (res.data?.data) {
			setQrData(res.data.data);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoadingQr(false);
	}, []);

	useEffect(() => {
		loadSession();
		loadTargets();
	}, [loadSession, loadTargets]);

	useEffect(() => {
		if (session?.status !== "SCAN_QR") return;

		if (!qrData) {
			loadQrCode();
		}

		const interval = setInterval(() => {
			loadSession();
		}, 4000);

		return () => clearInterval(interval);
	}, [session?.status, qrData, loadQrCode, loadSession]);

	const handleSessionAction = async (action: "START" | "STOP" | "RESTART" | "LOGOUT") => {
		setActionLoading(true);
		setError(null);
		setSuccessMsg(null);

		const endpoint =
			action === "START"
				? "/api/admin/whatsapp/session/start"
				: action === "STOP"
					? "/api/admin/whatsapp/session/stop"
					: action === "RESTART"
						? "/api/admin/whatsapp/session/restart"
						: "/api/admin/whatsapp/session/logout";

		const res = await fetchApi<WahaSessionInfo>(endpoint, { method: "POST" });

		if (res.error) {
			setError(res.error.message);
		} else {
			setSuccessMsg(
				action === "START"
					? "Sesi WhatsApp berhasil dijalankan."
					: action === "STOP"
						? "Sesi WhatsApp berhasil dihentikan."
						: action === "RESTART"
							? "Sesi WhatsApp berhasil direstart."
							: "Sesi WhatsApp berhasil logout (pairing dibersihkan).",
			);
			await loadSession();

			if (action === "START") {
				setShowQrModal(true);
				loadQrCode();
			}
		}

		setActionLoading(false);
		setConfirmAction(null);
	};

	const handleSendTestMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (testMode === "GROUP" && selectedTargetId === null) return;
		if (testMode === "PERSONAL" && phone.trim().length === 0) return;

		setSendingTest(true);
		setTestResult(null);
		setError(null);

		const res = await fetchApi<{ success: boolean; messageId: string; target: string }>(
			"/api/admin/whatsapp/test-message",
			{
				method: "POST",
				body: JSON.stringify({
					...(testMode === "GROUP"
						? { targetId: selectedTargetId }
						: { phone: phone.trim() }),
					text: customText.trim() || undefined,
				}),
			},
		);

		if (res.data) {
			setTestResult(
				`Pesan berhasil dikirim ke '${res.data.target}' (ID: ${res.data.messageId}).`,
			);
			setCustomText("");
		} else if (res.error) {
			setError(res.error.message);
		}

		setSendingTest(false);
	};

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Manajemen Sesi WhatsApp"
				description="Kontrol sesi gateway WAHA GoWS dan pantau status koneksi perangkat bot."
			>
				<button
					type="button"
					onClick={() => loadSession()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan Status</span>
				</button>
			</AdminPageHeader>

			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			{loading ? (
				<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
					<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
					<span className="text-xs">Memeriksa status sesi WhatsApp...</span>
				</div>
			) : (
				<div className="space-y-6">
					<SessionStatusCard
						session={session}
						actionLoading={actionLoading}
						onStart={() => handleSessionAction("START")}
						onOpenQr={() => {
							setShowQrModal(true);
							loadQrCode();
						}}
						onRequestAction={(action) => setConfirmAction(action)}
					/>

					<TestMessageCard
						targets={targets}
						selectedTargetId={selectedTargetId}
						mode={testMode}
						phone={phone}
						customText={customText}
						sendingTest={sendingTest}
						testResult={testResult}
						onSelectTarget={(id) => setSelectedTargetId(id)}
						onModeChange={(m) => setTestMode(m)}
						onPhoneChange={(p) => setPhone(p)}
						onChangeText={(txt) => setCustomText(txt)}
						onSendTest={handleSendTestMessage}
					/>

					<DayTestCard
						mode={testMode}
						targetId={selectedTargetId}
						phone={phone}
						hasTargets={targets.length > 0}
					/>
				</div>
			)}

			<QrPairingModal
				isOpen={showQrModal}
				qrData={qrData}
				loadingQr={loadingQr}
				onClose={() => setShowQrModal(false)}
				onReloadQr={loadQrCode}
			/>

			<SessionActionModal
				confirmAction={confirmAction}
				actionLoading={actionLoading}
				onClose={() => setConfirmAction(null)}
				onConfirm={() => confirmAction && handleSessionAction(confirmAction)}
			/>
		</div>
	);
}
