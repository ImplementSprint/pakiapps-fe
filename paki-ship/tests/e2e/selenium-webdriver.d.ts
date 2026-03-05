declare module 'selenium-webdriver';
declare module 'selenium-webdriver/chrome.js';
declare module 'selenium-webdriver/firefox.js';

declare const process: {
	argv: string[];
	env: Record<string, string | undefined>;
	exit(code?: number): never;
};

declare module 'node:child_process' {
	export function spawn(
		command: string,
		options?: {
			shell?: boolean;
			stdio?: 'inherit' | 'pipe' | 'ignore';
			env?: Record<string, string | undefined>;
		}
	): {
		kill(signal?: string): boolean;
	};
}

declare module 'node:net' {
	class Socket {
		setTimeout(timeout: number): this;
		once(event: string, listener: (...args: unknown[]) => void): this;
		connect(port: number, host: string): this;
		destroy(): this;
	}

	const net: {
		Socket: typeof Socket;
	};

	export default net;
}