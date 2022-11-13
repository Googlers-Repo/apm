import { spawn } from "child_process";
import fetch from "node-fetch";
import * as fs from "fs";
import https from "https";

function install(str, opt) {
  // Handle package name with version
  const pkg = JSON.parse(
    str.replace(/([\w\.\-]+)#?([0-9]*)/gm, '{"package": "$1", "version": "$2"}')
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
              const install = spawn(
                "pm",
                [
                  "install",
                  "-i",
                  "com.google.android.packageinstaller",
                  `/data/local/tmp/${pkg.package}#${pkg.version}.apk`,
                ],
                {
                  cwd: process.cwd(),
                  detached: true,
                  stdio: "inherit",
                }
              );
              install.on("error", (err) => {
                opt.open = false;
                console.error(
                  `Something went wrong installing ${pkg.package}`,
                  err.message
                );
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
                    process.exit(0);
                  });
                }
              });
            } catch (e) {
              console.error(e.message);
            }
          });
        }
      );
    });
}

export default install;
