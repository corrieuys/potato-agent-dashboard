import type { Config } from "drizzle-kit";

export default {
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	driver: "d1-http",
	dbCredentials: {
		wranglerConfigPath: "./wrangler.drizzle.json",
		dbName: "DB",
	},
} satisfies Config;
