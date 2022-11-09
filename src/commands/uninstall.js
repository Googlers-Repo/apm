import { spawn } from "child_process";

function uninstall(str, opt) {
  const uninstall = spawn("pm", ["uninstall", `${str}`], {
    cwd: process.cwd(),
    detached: true,
    stdio: "inherit",
  });

  uninstall.on("error", (err) => {
    console.error(`Somthing went wrong: ${err}`);
    process.exit(0);
  });
}

export default uninstall;
