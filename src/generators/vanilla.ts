import { writeFileSync } from "fs";
import { startSection, endSection } from "helpers/cli";
import { runCommand } from "helpers/command";
import {
	setupProjectDirectory,
	getVersionSelection,
	getJarFile,
	offerEula,
	printSummary
} from "../common";
import type {	MinecraftServerArgs, MinecraftServerContext } from "types";

export const runVanillaGenerator = async (args: MinecraftServerArgs) => {
	const { name, path, relativePath } = setupProjectDirectory(args);
	const version = await getVersionSelection(args);
	const url = await getJarFile(version);
	
	const ctx: MinecraftServerContext = {
		server: {
			name,
			relativePath,
			path,
		},
		version: {
			name: version,
			url
		},
		args,
	};

	endSection(`Continue with ${ctx.version?.name}`);
	await runCommand(`curl --silent -o server.jar ${ctx.version?.url}`);

	startSection("Configuring your server", "Step 2 of 4");
	await runCommand("java -jar server.jar --nogui", {silent: true});
	endSection("Server configured");

	await offerEula(ctx);
	if (ctx.args.eula) {
		startSection("Creating batch file", "Step 4 of 4");
		writeFileSync("start.bat", 'java -jar server.jar --nogui');
	}

	await printSummary(ctx);
};