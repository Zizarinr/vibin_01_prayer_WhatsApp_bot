import { createLogger } from "../../core/logger";

const logger = createLogger("waha-webhooks");

export interface WahaWebhookEvent {
	event: string;
	session: string;
	payload: Record<string, unknown>;
	engine?: string;
}

export function handleWebhookEvent(event: WahaWebhookEvent): void {
	logger.info("Menerima webhook event dari WAHA:", {
		event: event.event,
		session: event.session,
	});

	// Penanganan event spesifik (misal status sesi berubah atau delivery ack)
	if (event.event === "session.status") {
		logger.info("Perubahan status sesi WAHA:", {
			session: event.session,
			status: event.payload?.status,
		});
	}
}
