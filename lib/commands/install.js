import { spawn } from "child_process";
import yesno from "yesno";
import fetch from "node-fetch";
import pkg from "node-apk";
import * as fs from "fs";
import https from "https";
import crypto from "crypto";
import pkg1 from "progress";
var ProgressBar = pkg1;

import formatBytes from "../util/formatBytes.js";
import log from "../util/log.js";

const { Apk } = pkg;

function install(str, opt) {
  (async () => {
    // Handle package name with version
    const pkg = JSON.parse(
      str.replace(
        /([\w\.\-]+)#?([0-9]*)/gm,
        '{"package": "$1", "version": "$2"}'
      )
    );

    const cmd = ["install"];

    const res = await (
      await fetch(`https://f-droid.org/api/v1/packages/${pkg.package}`)
    ).json();

    if (pkg.version === "") {
      // Add latest version when no version is given
      pkg.version = res.packages[0].versionCode.toString();
    }
    const path = `/data/local/tmp/${pkg.package}#${pkg.version}.apk`;
    const file = fs.createWriteStream(path);

    var req = https.request("https://f-droid.org/repo/com.termux_118.apk");

    req.on("response", function (res) {
      const len = parseInt(res.headers["content-length"], 10);
      
      const bar = new ProgressBar(`${pkg.package} [:bar] :rate/bps :percent :etas`, {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: len,
      });
    
      res.pipe(file);
    
      res.on("data", function (chunk) {
        bar.tick(chunk.length);
      });
    
      res.on("end", function () {
        file.close();
      });

      file.on("finish", () => {
        file.close();
        console.log(`${pkg.package} download completed`);
        console.log(`Ready to install ${pkg.package}`);
        try {
          // Add the package installer to the app settings page
          cmd.push(...["-i", "com.google.android.packageinstaller"]);

          // Allow donwgrading
          if (opt.downgrade) {
            cmd.push("-d");
          }

          // Allow re-install
          if (opt.reinstall) {
            cmd.push("-r");
          }

          // Add to-install package
          cmd.push(`/data/local/tmp/${pkg.package}#${pkg.version}.apk`);

          (async () => {
            const apk = new Apk(
              `/data/local/tmp/${pkg.package}#${pkg.version}.apk`
            );

            const manifest = await apk.getManifestInfo();

            const structDatas = [
              {
                Query: "Package",
                Detail: manifest.package,
              },
              {
                Query: "V. Name",
                Detail: manifest.versionName,
              },
              {
                Query: "V. Code",
                Detail: manifest.versionCode,
              },
              {
                Query: "Label",
                Detail: manifest.applicationLabel,
              },
              {
                Query: "Size",
                Detail: formatBytes(
                  await (async () => {
                    return await new Promise((resolve, reject) => {
                      fs.stat(path, (err, oStats) => {
                        if (err == null) {
                          resolve(oStats.size);
                        } else {
                          reject(err);
                        }
                      });
                    });
                  })()
                ),
              },
              {
                Query: "Checksum",
                Detail: await (async () => {
                  return await new Promise((resolve) => {
                    let rs = fs.createReadStream(path);
                    let hash = crypto.createHash("md5");
                    hash.setEncoding("hex");
                    rs.on("end", () => {
                      hash.end();
                      resolve(hash.read());
                    });
                    rs.pipe(hash);
                  });
                })(),
              },
            ];

            log.table(structDatas);

            const ok = await yesno({
              question: "Do you want install?",
              yesValues: ["yes", "ja", "y", "j"],
              noValues: ["no", "nein", "n"],
            });

            if (ok) {
              const install = spawn("pm", cmd, {
                cwd: process.cwd(),
                detached: true,
                stdio: "inherit",
              });
              install.on("error", (err) => {
                opt.open = false;
                console.error(
                  `Something went wrong installing ${pkg.package}`,
                  err.message
                );
                apk.close();
                process.exit(0);
              });
              install.on("exit", () => {
                if (opt.open) {
                  spawn("am", ["start", pkg.package], {
                    cwd: process.cwd(),
                    detached: true,
                    stdio: "inherit",
                  });
                  open.on("error", (err) => {
                    console.error(
                      `Something went wrong while opening ${pkg.package}`,
                      err.message
                    );
                    apk.close();
                    process.exit(0);
                  });
                  apk.close();
                }
              });
            } else {
              console.log("abort");
              apk.close();
            }
          })();
        } catch (e) {
          console.error(e.message);
        }
      });

      file.on("close", function () {
        // the file is done downloading
      });
    });
    
    req.end();

    https.get(
      `https://f-droid.org/repo/${pkg.package}_${pkg.version}.apk`,
      function (response) {
      
      }
    );
  })();
}

export default install;
