#!/usr/bin/env node
import { existsSync } from "fs";
import { resolve } from "path";
import { crash, logRaw, startSection } from "helpers/cli";
import { dim, minecraftColor } from "helpers/colors";
import { selectInput, textInput } from "helpers/interactive";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { version } from "../package.json";
import { runVanillaGenerator } from "./generators/vanilla";
import type { Option } from "helpers/interactive";
import type { MinecraftServerArgs } from "types";

export const main = async (argv: string[]) => {
	printBanner();

	const args = await parseArgs(argv);

	const validatedArgs: MinecraftServerArgs = {
		...args,
		serverName: await validateName(args.serverName),
		type: await validateType(args.type),
	};

	const { handler } = templateMap[validatedArgs.type];
	await handler(validatedArgs);
}

const printBanner = () => {
	logRaw(dim(`\nusing create-minecraft version ${version}\n`));
	startSection(`Create a Minecraft server`, "Step 1 of 3");
};

const parseArgs = async (argv: string[]) => {
	const args = await yargs(hideBin(argv))
		.version(false)
		.scriptName("create-minecraft")
		.usage("$0 [args]")
		.positional("name", { type: "string" })
		.option("type", { type: "string" })
		.option("version", { type: "string" })
		.help().argv;

	return {
		serverName: args._[0] as string | undefined,
		...args,
	};
};

const validateName = async (name: string | undefined): Promise<string> => {
	return await textInput({
		initialValue: name,
		question: `Where do you want to create your server?`,
		renderSubmitted: (value: string) => {
			return `${minecraftColor("dir")} ${dim(value)}`;
		},
		defaultValue: "minecraft-server",
		validate: (value: string) => {
			if (value && existsSync(resolve(value))) {
				return `\`${value}\` already exists. Please choose a new folder. `;
			}
		},
	});
};

const validateType = async (type: string | undefined) => {
	const templateOptions = Object.entries(templateMap)
		.filter(([_, { hidden }]) => !hidden)
		.map(([value, { label }]) => ({ value, label }));

	type = await selectInput({
		question: "What type of server do you want to create?",
		options: templateOptions,
		renderSubmitted: (option: Option) => {
			return `${minecraftColor("type")} ${dim(option.label)}`;
		},
		initialValue: type,
	});

	if (!type || !Object.keys(templateMap).includes(type)) {
		crash("A server type must be specified to continue.");
	}
	return type;
};

type TemplateConfig = {
	label: string;
	handler: (args: MinecraftServerArgs) => Promise<void>;
	hidden?: boolean;
};

const templateMap: Record<string, TemplateConfig> = {
	vanilla: {
		label: "Vanilla",
		handler: runVanillaGenerator,
	},
};

main(process.argv).catch((e) => crash(e));