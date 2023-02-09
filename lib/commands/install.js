const { spawn } = require("child_process");
const yesno = require("yesno")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Apk } = require("node-apk")
const fs = require("fs")
const https = require("https")
const crypto = require("crypto")
const { env, exit, cwd } = require("process");
const ProgressBar = require("progress");

const formatBytes = require("../util/formatBytes.js");
const log = require("../util/log.js");

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
    const tmp_apk = `${env.TMPDIR}/${pkg.package}#${pkg.version}.apk`;
    const file = fs.createWriteStream(tmp_apk);

    var req = https.request(
      `https://f-droid.org/repo/${pkg.package}_${pkg.version}.apk`
    );

    req.on("response", function (res) {
      const len = parseInt(res.headers["content-length"], 10);

      const bar = new ProgressBar(
        `${pkg.package} [:bar] :rate/bps :percent :etas`,
        {
          complete: "=",
          incomplete: " ",
          width: 20,
          total: len,
        }
      );

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
          cmd.push(tmp_apk);

          (async () => {
            const apk = new Apk(tmp_apk);

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
                      fs.stat(tmp_apk, (err, oStats) => {
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
                    let rs = fs.createReadStream(tmp_apk);
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
                cwd: cwd(),
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
                exit(0);
              });
              install.on("exit", () => {
                if (opt.open) {
                  spawn("am", ["start", pkg.package], {
                    cwd: cwd(),
                    detached: true,
                    stdio: "inherit",
                  });
                  open.on("error", (err) => {
                    console.error(
                      `Something went wrong while opening ${pkg.package}`,
                      err.message
                    );
                    apk.close();
                    exit(0);
                  });
                  apk.close();

                  // Clear $TMPDIR
                  fs.readdir(env.TMPDIR, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                      fs.unlink(path.join(directory, file), (err) => {
                        if (err) throw err;
                      });
                    }
                  });
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
      function (response) {}
    );
  })();
}

module.exports = install;
