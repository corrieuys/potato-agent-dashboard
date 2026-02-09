/// <reference path="../../worker-configuration.d.ts" />
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createClient(d1Database: D1Database) {
	return drizzle(d1Database, { schema });
}

export type Database = ReturnType<typeof createClient>;
export { schema };
