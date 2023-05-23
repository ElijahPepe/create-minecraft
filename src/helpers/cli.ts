import { exit } from "process";
import { minecraftColor, dim, gray, white, red, hidden, bgRed } from "./colors";

export const shapes = {
	diamond: "◇",
	dash: "─",
	radioInactive: "○",
	radioActive: "●",

	bar: "│",
	leftT: "├",
	rigthT: "┤",

	arrows: {
		left: "‹",
		right: "›",
	},

	corners: {
		tl: "╭",
		bl: "╰",
		tr: "╮",
		br: "╯",
	},
};

export const status = {
	error: bgRed(` ERROR `),
	warning: bgRed(` WARNING `),
	info: bgRed(` INFO `),
	success: bgRed(` SUCCESS `),
};

export const space = (n = 1) => {
	return [...Array(n)].map(() => hidden("-")).join("");
};

export const logRaw = (msg: string) => {
	process.stdout.write(`${msg}\n`);
};

export const log = (msg: string) => {
	const lines = msg.split("\n").map((ln) => `${gray(shapes.bar)} ${white(ln)}`);

	logRaw(lines.join("\n"));
};

export const newline = () => {
	log("");
};

export const updateStatus = (msg: string) => {
	logRaw(`${gray(shapes.leftT)} ${msg}`);
	newline();
};

export const startSection = (heading: string, subheading?: string) => {
	logRaw(
		`${gray(shapes.corners.tl)} ${minecraftColor(heading)} ${
			subheading ? dim(subheading) : ""
		}`
	);
	newline();
};

export const endSection = (heading: string, subheading?: string) => {
	logRaw(
		`${gray(shapes.corners.bl)} ${minecraftColor(heading)} ${
			subheading ? dim(subheading) : ""
		}\n`
	);
};

export const cancel = (msg: string) => {
	newline();
	logRaw(`${gray(shapes.corners.bl)} ${white.bgRed(` X `)} ${dim(msg)}`);
};

export const warn = (msg: string) => {
	newline();
	logRaw(`${gray(shapes.corners.bl)} ${status.warning} ${dim(msg)}`);
};

export const stripAnsi = (str: string) => {
	const pattern = [
		"[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
		"(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
	].join("|");
	const regex = RegExp(pattern, "g");

	return str.replace(regex, "");
};

export const crash = (msg?: string): never => {
	if (msg) {
		process.stderr.write(red(msg));
		process.stderr.write("\n");
	}
	exit(1);
};