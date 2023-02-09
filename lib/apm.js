#!/system/bin/env node

const fs = require("fs")
const path = require("path")
const { userInfo } = require("os")
const { which, exit } = require("shelljs")
const { program } = require("commander")

// Commands
const install = require("./commands/install.js")
const uninstall = require("./commands/uninstall.js")

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")
);

if (userInfo().username != "root") {
  console.log("Try with '\x1b[33msudo apm [...ARGS]\x1b[0m' again")
  exit(0)
}

// Check if pm is installed on Android
if (!which("pm")) {
  console.log("Sorry, this script requires pm");
  exit(1);
}

program.name("apm").description(pkg.description).version(pkg.version);

program
  .command("install")
  .description("Installs an package from F-Droid")
  .argument("<package>", "Package to install")
  .option("-d, --downgrade", "Allow version code downgrade")
  .option("-r, --reinstall", "Reinstall an existing app, keeping its data")
  .option("--open", "Opens the App after installation")
  // .option("--repo", "Takes the apk from the choosen")
  .action(install)
  .aliases(["add", "i"]);

program
  .command("uninstall")
  .description("uninstall an package from device")
  .argument("<package>", "Package to uninstall")
  .action(uninstall)
  .aliases(["remove"]);

program.parse();
