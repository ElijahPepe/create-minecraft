export type MinecraftServerArgs = {
	serverName: string;
	type: string;
	version?: string;
	eula?: boolean;
}

export type MinecraftServerContext = {
	args: MinecraftServerArgs;
	server: {
		name: string;
		path: string;
		relativePath: string;
	};
	version: {
		name: string;
		url: string;
	};
}