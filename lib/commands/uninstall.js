const { spawn } = require("child_process");
const { cwd, exit } = require("process")

function uninstall(str, opt) {
  const uninstall = spawn("pm", ["uninstall", `${str}`], {
    cwd: cwd(),
    detached: true,
    stdio: "inherit",
  });

  uninstall.on("error", (err) => {
    console.log(`Somthing went wrong: ${err}`);
    exit(0);
  });
}

module.exports = uninstall;
