#!/system/bin/env node

import { spawn } from "child_process";
import fetch from "node-fetch";
import * as fs from "fs";
import https from "https";

const { argv } = process;
const args = argv.slice(2);

function suexec(command, args) {
  return spawn(command, args, {
    cwd: process.cwd(),
    detached: true,
    stdio: "inherit",
  });
}

async function uninstall() {
  const uninstallargs = args.slice(1);
  suexec("pm", ["uninstall", `${uninstallargs[0]}`]);
}

async function install() {
  const installargs = args.slice(1);
  const pkg = JSON.parse(
    installargs[0].replace(
      /([\w\.\-]+)#?([0-9]*)/gm,
      '{"package": "$1", "version": "$2"}'
    )
  );

  fetch(`https://f-droid.org/api/v1/packages/${pkg.package}`)
    .then((res) => res.json())
    .then((res) => {
      if (pkg.version === "") {
        pkg.version = res.packages[0].versionCode.toString();
      }

      const file = fs.createWriteStream(
        `/data/local/tmp/${pkg.package}#${pkg.version}.apk`
      );
      https.get(
        `https://f-droid.org/repo/${pkg.package}_${pkg.version}.apk`,
        function (response) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`${pkg.package} download completed`);
            console.log(`Ready to install ${pkg.package}`);
            try {
              const install = suexec("pm", [
                "install",
                `/data/local/tmp/${pkg.package}#${pkg.version}.apk`,
              ]);
              install.on("exit", () => {
                console.log();
              });
            } catch (e) {
              console.error(e.message);
            }
          });
        }
      );

      console.log(pkg);
    });

  //   try {
  //     const download = suexec("xh", [
  //       "--download",
  //       `https://f-droid.org/repo/${pkg.package}_${pkg.version}.apk`,
  //       "--output",
  //       `/data/local/tmp/${pkg.package}#${pkg.version}.apk`,
  //     ]);

  //     download.on("exit", () => {
  //       try {
  //         const install = suexec("pm", [
  //           "install",
  //           `/data/local/tmp/${pkg.package}#${pkg.version}.apk`,
  //         ]);
  //         install.on("exit", () => {
  //           console.log();
  //         });
  //       } catch (e) {
  //         console.error(e.message);
  //       }
  //     });
  //   } catch (e) {
  //     console.error(e.message);
  //   }
}

switch (args[0]) {
  case "install":
    install();
    break;
  case "i":
    install();
    break;
  case "add":
    install();
    break;
  case "uninstall":
    uninstall();
    break;
  case "remove":
    uninstall();
    break;
  default:
    console.log("Please provides a argument");
    process.exit(1);
}
