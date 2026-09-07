import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, shell: false, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.error("Production build stopped: DATABASE_URL is not configured.");
    process.exit(1);
  }
  const migrationEnv = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  };
  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy"], migrationEnv);
}

run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
