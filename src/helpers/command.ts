import { spawn } from "cross-spawn";
import { logRaw, stripAnsi } from "./cli";
import { spinner } from "./interactive";

type RunOptions = {
	startText?: string;
	doneText?: string;
	silent?: boolean;
	captureOutput?: boolean;
	env?: NodeJS.ProcessEnv;
	cwd?: string;
};

export const runCommand = async (
	command: string,
	opts?: RunOptions
): Promise<string> => {
	const s = spinner();

	if (opts?.startText) {
		s.start(opts?.startText || command);
	}

	const [executable, ...args] = command.split(" ");

	const squelch = opts?.silent;

	const cmd = spawn(executable, [...args], {
		// TODO: ideally inherit stderr, but npm install uses this for warnings
		// stdio: [ioMode, ioMode, "inherit"],
		stdio: squelch ? "pipe" : "inherit",
		env: {
			...process.env,
			...opts?.env,
		},
		cwd: opts?.cwd,
	});

	let output = ``;

	if (opts?.silent) {
		cmd.stdout?.on("data", (data) => {
			output += data;
		});
		cmd.stderr?.on("data", (data) => {
			output += data;
		});
	}

	return await new Promise((resolve, reject) => {
		cmd.on("close", (code) => {
			if (code === 0) {
				if (opts?.doneText) {
					s.stop(opts?.doneText);
				}
				resolve(stripAnsi(output));
			} else {
				logRaw(output);
				reject(code);
			}
		});
	});
};