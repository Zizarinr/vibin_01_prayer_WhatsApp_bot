"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import {
	MessageCancelModal,
	MessageRetryModal,
} from "../../../components/admin/messages/message-action-modals";
import { MessageDetailModal } from "../../../components/admin/messages/message-detail-modal";
import { MessagesFilters } from "../../../components/admin/messages/messages-filters";
import {
	MessagesTable,
	type ScheduledMessageItem,
} from "../../../components/admin/messages/messages-table";
import { AdminPageHeader } from "../../../components/admin/shared/admin-page-header";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";

interface MessagesResponse {
	items: ScheduledMessageItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export default function AdminMessagesPage() {
	const [messages, setMessages] = useState<ScheduledMessageItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [prayerFilter, setPrayerFilter] = useState<string>("ALL");
	const [typeFilter, setTypeFilter] = useState<string>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	const [selectedMessage, setSelectedMessage] = useState<ScheduledMessageItem | null>(null);
	const [confirmRetryId, setConfirmRetryId] = useState<number | null>(null);
	const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	const loadMessages = useCallback(async () => {
		setLoading(true);
		setError(null);

		const queryParams = new URLSearchParams();
		queryParams.set("page", String(page));
		queryParams.set("limit", "15");

		if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
		if (prayerFilter !== "ALL") queryParams.set("prayerName", prayerFilter);
		if (typeFilter !== "ALL") queryParams.set("messageType", typeFilter);
		if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

		const res = await fetchApi<MessagesResponse>(`/api/admin/messages?${queryParams.toString()}`);

		if (res.data) {
			setMessages(res.data.items);
			setTotalPages(res.data.totalPages);
			setTotalCount(res.data.total);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	}, [page, statusFilter, prayerFilter, typeFilter, searchQuery]);

	useEffect(() => {
		loadMessages();
	}, [loadMessages]);

	const handleRetry = async () => {
		if (!confirmRetryId) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<ScheduledMessageItem>(
			`/api/admin/messages/${confirmRetryId}/retry`,
			{ method: "POST" },
		);

		if (res.data) {
			setSuccessMsg(`Pesan ID #${confirmRetryId} berhasil dijadwalkan ulang untuk dikirim.`);
			setConfirmRetryId(null);
			loadMessages();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	const handleCancel = async () => {
		if (!confirmCancelId) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<ScheduledMessageItem>(
			`/api/admin/messages/${confirmCancelId}/cancel`,
			{ method: "POST" },
		);

		if (res.data) {
			setSuccessMsg(`Pesan ID #${confirmCancelId} berhasil dibatalkan.`);
			setConfirmCancelId(null);
			loadMessages();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Riwayat & Antrean Pesan"
				description="Pantau jadwal pengiriman pengingat shalat, status pesan terkirim, dan penanganan kegagalan."
			>
				<button
					type="button"
					onClick={() => loadMessages()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan</span>
				</button>
			</AdminPageHeader>

			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			<MessagesFilters
				searchQuery={searchQuery}
				statusFilter={statusFilter}
				prayerFilter={prayerFilter}
				typeFilter={typeFilter}
				onSearchChange={(q) => {
					setSearchQuery(q);
					setPage(1);
				}}
				onStatusChange={(s) => {
					setStatusFilter(s);
					setPage(1);
				}}
				onPrayerChange={(p) => {
					setPrayerFilter(p);
					setPage(1);
				}}
				onTypeChange={(t) => {
					setTypeFilter(t);
					setPage(1);
				}}
			/>

			<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
				<MessagesTable
					messages={messages}
					loading={loading}
					page={page}
					totalPages={totalPages}
					totalCount={totalCount}
					onPageChange={setPage}
					onViewDetail={setSelectedMessage}
					onRequestRetry={setConfirmRetryId}
					onRequestCancel={setConfirmCancelId}
				/>
			</div>

			<MessageDetailModal
				message={selectedMessage}
				onClose={() => setSelectedMessage(null)}
			/>

			<MessageRetryModal
				confirmRetryId={confirmRetryId}
				actionLoading={actionLoading}
				onClose={() => setConfirmRetryId(null)}
				onConfirm={handleRetry}
			/>

			<MessageCancelModal
				confirmCancelId={confirmCancelId}
				actionLoading={actionLoading}
				onClose={() => setConfirmCancelId(null)}
				onConfirm={handleCancel}
			/>
		</div>
	);
}
