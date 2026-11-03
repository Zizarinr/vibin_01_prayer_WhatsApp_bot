import * as groups from "./groups";
import * as messages from "./messages";
import * as sessions from "./sessions";

export * from "./client";
export * from "./groups";
export * from "./messages";
export * from "./sessions";
export * from "./types";
export * from "./webhooks";

export const waha = {
	sessions: {
		...sessions,
		getStatus: sessions.getSessionStatus,
		start: sessions.startSession,
		stop: sessions.stopSession,
		restart: sessions.restartSession,
		logout: sessions.logoutSession,
		getQr: sessions.getSessionQr,
	},
	groups: {
		...groups,
		list: groups.listGroups,
	},
	messages: {
		...messages,
		sendText: messages.sendTextMessage,
	},
};
