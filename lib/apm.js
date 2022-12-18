#!/system/bin/env node

import * as fs from "fs";
import * as path from "path";
import shell from "shelljs";
import { fileURLToPath } from "url";
import { program } from "commander";

// Commands
import install from "./commands/install.js";
import uninstall from "./commands/uninstall.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")
);

// Check if pm is installed on Android
if (!shell.which("pm")) {
  console.error("Sorry, this script requires pm");
  shell.exit(1);
}

program.name("apm").description(pkg.description).version(pkg.version);

program
  .command("install")
  .description("Installs an package from F-Droid")
  .argument("<package>", "Package to install")
  .option("-d, --downgrade", "Allow version code downgrade")
  .option("-r, --reinstall", "Reinstall an existing app, keeping its data")
  .option("--open", "Opens the App after installation")
  .action(install)
  .aliases(["add", "i"]);

program
  .command("uninstall")
  .description("uninstall an package from device")
  .argument("<package>", "Package to uninstall")
  .action(uninstall)
  .aliases(["remove"]);

program.parse();
