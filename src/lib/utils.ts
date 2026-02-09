/// <reference path="../../worker-configuration.d.ts" />

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
	return crypto.randomUUID();
}

/**
 * Generate a random token of specified length
 */
export function generateToken(length: number = 32): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const randomValues = new Uint8Array(length);
	crypto.getRandomValues(randomValues);
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length];
	}
	return result;
}

/**
 * Compute a simple hash for data (for MVP - not cryptographically secure)
 */
export function computeHash(data: string): string {
	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		const char = data.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(16, "0");
}

/**
 * Check if the request wants HTML (for HTMX or browser requests)
 */
export function wantsHTML(c: { req: { header: (name: string) => string | undefined } }): boolean {
	const accept = c.req.header("Accept") || "";
	const hxRequest = c.req.header("HX-Request") === "true";
	return accept.includes("text/html") || hxRequest;
}

/**
 * Parse request body (handles JSON and form-urlencoded)
 */
export async function parseBody(c: { req: { header: (name: string) => string | undefined; formData: () => Promise<FormData>; json: () => Promise<any>; raw: { clone: () => Request } } }): Promise<Record<string, any>> {
	const contentType = (c.req.header("Content-Type") || "").toLowerCase();

	// Try form data first if content-type suggests it
	if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
		try {
			const formData = await c.req.formData();
			const body: Record<string, any> = {};
			formData.forEach((value: any, key: string) => {
				body[key] = value;
			});
			return body;
		} catch (e) {
			// Fall through to try other methods
		}
	}

	if (contentType.includes("application/json")) {
		try {
			return await c.req.json();
		} catch (e) {
			return {};
		}
	}

	// If content-type is not set, try to detect based on body format
	try {
		const clonedReq = c.req.raw.clone();
		const text = await clonedReq.text();

		// Try to parse as JSON first
		try {
			return JSON.parse(text);
		} catch {
			// If not JSON, try to parse as form data
			const params = new URLSearchParams(text);
			const body: Record<string, any> = {};
			params.forEach((value, key) => {
				body[key] = value;
			});
			return body;
		}
	} catch {
		return {};
	}
}
