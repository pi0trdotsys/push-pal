import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const windows = process.platform === "win32";
const environment = { ...process.env };
const properties = new URL("../android/local.properties", import.meta.url);
if (existsSync(properties)) {
  const javaHome = readFileSync(properties, "utf8")
    .split(/\r?\n/)
    .find((line) => line.startsWith("java.home="))
    ?.slice("java.home=".length)
    .trim();
  if (javaHome && existsSync(javaHome)) environment.JAVA_HOME = javaHome;
}
const result = spawnSync(
  windows ? "gradlew.bat" : "sh",
  windows ? ["assembleDebug"] : ["./gradlew", "assembleDebug"],
  {
    cwd: fileURLToPath(new URL("../android", import.meta.url)),
    stdio: "inherit",
    shell: windows,
    env: environment,
  },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
