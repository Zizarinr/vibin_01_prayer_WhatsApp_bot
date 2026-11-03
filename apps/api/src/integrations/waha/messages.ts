import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { wahaFetch } from "./client";
import type { WahaSendMessagePayload, WahaSendMessageResult } from "./types";

const logger = createLogger("waha-messages");

interface RawSendMessageResponse {
	id?: string | { _serialized?: string; id?: string };
	timestamp?: number;
}

export async function sendTextMessage(
	payload: Partial<WahaSendMessagePayload> & { chatId: string; text: string },
): Promise<WahaSendMessageResult> {
	const session = payload.session || config.wahaSession;

	logger.info("Mengirim pesan WhatsApp via WAHA...", {
		session,
		chatId: payload.chatId,
		textLength: payload.text.length,
	});

	const res = await wahaFetch<RawSendMessageResponse>("/api/sendText", {
		method: "POST",
		body: JSON.stringify({
			session,
			chatId: payload.chatId,
			text: payload.text,
		}),
	});

	let messageId = "UNKNOWN";
	if (typeof res?.id === "string") {
		messageId = res.id;
	} else if (res?.id && typeof res.id === "object") {
		messageId = res.id._serialized || res.id.id || "UNKNOWN";
	}

	return {
		id: messageId,
		timestamp: res?.timestamp,
	};
}
