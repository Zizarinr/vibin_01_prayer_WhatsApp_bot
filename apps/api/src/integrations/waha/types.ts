export type WahaSessionStatus =
	| "STOPPED"
	| "STARTING"
	| "SCAN_QR"
	| "WORKING"
	| "FAILED";

export interface WahaAccountInfo {
	id: string;
	pushName?: string;
}

export interface WahaSessionInfo {
	name: string;
	status: WahaSessionStatus;
	me?: WahaAccountInfo;
	engine?: string;
}

export interface WahaGroup {
	id: string;
	name: string;
}

export interface WahaSendMessagePayload {
	session: string;
	chatId: string;
	text: string;
}

export interface WahaSendMessageResult {
	id: string;
	timestamp?: number;
}

export interface WahaQrResponse {
	format: "image" | "raw";
	data: string;
}

export class WahaError extends Error {
	constructor(
		message: string,
		public statusCode: number = 502,
		public code: string = "WAHA_UPSTREAM_ERROR",
	) {
		super(message);
		this.name = "WahaError";
	}
}
