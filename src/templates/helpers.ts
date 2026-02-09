// Shared helpers for template rendering

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function getStatusChipClass(status: string | undefined): string {
    switch (status) {
        case "running":
            return "badge-green";
        case "building":
            return "badge-yellow";
        case "error":
        case "crashed":
            return "badge-red";
        case "stopped":
        case "unknown":
        default:
            return "chip-muted";
    }
}

export function getHealthChipClass(healthStatus: string): string {
    switch (healthStatus) {
        case "healthy":
            return "badge-green";
        case "unhealthy":
            return "badge-red";
        default:
            return "chip-muted";
    }
}
