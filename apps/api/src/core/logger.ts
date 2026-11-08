/**
 * Logger JSON terstruktur ke stdout (lihat docs/09-security-logging-monitoring.md).
 * Jangan log secret, token, password, QR payload, atau connection string.
 */

type LogLevel = "info" | "warn" | "error";

interface LogFields {
	[key: string]: unknown;
}

function write(
	level: LogLevel,
	service: string,
	msg: string,
	fields?: LogFields,
): void {
	const record = {
		ts: new Date().toISOString(),
		level,
		service,
		msg,
		...fields,
	};
	const line = JSON.stringify(record);
	if (level === "error") {
		console.error(line);
	} else {
		console.log(line);
	}
}

export interface Logger {
	info(msg: string, fields?: LogFields): void;
	warn(msg: string, fields?: LogFields): void;
	error(msg: string, fields?: LogFields): void;
}

export function createLogger(service: string): Logger {
	return {
		info: (msg, fields) => write("info", service, msg, fields),
		warn: (msg, fields) => write("warn", service, msg, fields),
		error: (msg, fields) => write("error", service, msg, fields),
	};
}
