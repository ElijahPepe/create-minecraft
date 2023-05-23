import { existsSync, mkdirSync, writeFileSync } from "fs";
import { basename, relative, resolve } from "path";
import { request } from "undici";
import { chdir } from "process";
import { crash, endSection, logRaw, newline, shapes, startSection } from "helpers/cli";
import { confirmInput, selectInput } from "helpers/interactive";
import { dim, blue, minecraftColor, bgGreen, gray } from "helpers/colors";
import type { Option } from "helpers/interactive";
import type { MinecraftServerArgs, MinecraftServerContext } from "types";

export const setupProjectDirectory = (args: MinecraftServerArgs) => {
	const path = resolve(args.serverName);

	if (existsSync(path)) {
		crash(
			`Directory \`${args.serverName}\` already exists. Please choose a new name.`
		);
	}

	const name = basename(path);

	const relativePath = relative(process.cwd(), path);

	mkdirSync(path, { recursive: true });

	chdir(path);

	return { name, relativePath, path };
};

type MojangManifest = {
	latest: MojangManifestLatest;
	versions: MojangManifestVersion[];
};

type MojangManifestLatest = {
	release: string;
	snapshot: string;
};

type MojangManifestVersion = {
	id: string;
	url: string;
};

const getVersionOptions = async () => {
	const manifest = await request("https://launchermeta.mojang.com/mc/game/version_manifest.json");
	const versions: MojangManifest = await manifest.body.json();
	// TODO: Remove slice once pagination is added
	// https://github.com/natemoo-re/clack/issues/118
	const versionOptions = Object.entries(versions.versions).filter(
		([_, { id }]) => (
			!id.includes('-') && id.includes('.') && !/[a-z]/i.test(id)
		)
	).map(
		([_, { id }]) => ({
			label: id,
			value: id,
		})
	).slice(0, 5);

	return {versions, versionOptions};
}

export const getVersionSelection = async (args: MinecraftServerArgs) => {
	const { versionOptions } = await getVersionOptions();

	const version = await selectInput({
		question: "Which version do you want to use?",
		options: versionOptions,
		renderSubmitted: (option: Option) => {
			return `${minecraftColor("version")} ${dim(option.label)}`;
		},
		initialValue: args.version,
	});
	version || crash("A version must be selected to continue.");
	if (!Object.values(versionOptions).map(version => version.label).includes(version)) {
		crash(`Unsupported version: ${version}`)
	}

	return version;
};

export const getJarFile = async (version: string) => {
	const { versions } = await getVersionOptions();

	const output = Object.entries(versions.versions).filter(
		([_, { id }]) => (
			id === version
		)
	)[0][1].url;

	const manifest = await request(output);
	const urls = await manifest.body.json();

	return urls.downloads.server.url;
};

export const offerEula = async (ctx: MinecraftServerContext) => {
	startSection(`Accepting the EULA`, `Step 3 of 3`);

	ctx.args.eula = await confirmInput({
		question: `Do you accept the Minecraft EULA at ${blue(`https://www.minecraft.net/en-us/eula`)}?`,
		renderSubmitted: (value: boolean) =>
			`${minecraftColor(value ? `yes` : `no`)} ${dim(
				"accepting the eula"
			)}`,
		initialValue: ctx.args.eula,
	});

	if (!ctx.args.eula) return;
	writeFileSync("eula.txt", 'eula=true');
};

export const printSummary = async (ctx: MinecraftServerContext) => {
	const msg = [
		`${gray(shapes.leftT)}`,
		`${bgGreen(" SERVER CREATED ")}`,
		`${dim(`Run your server with`)}`,
		`${blue(
			`cd ${ctx.args.serverName} && start.bat`
		)}`,
	].join(" ");
	logRaw(msg);

	newline();

	endSection("See you again soon!");
};