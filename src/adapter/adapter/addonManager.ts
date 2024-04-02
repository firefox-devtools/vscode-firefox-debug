import * as path from 'path';
import { ParsedAddonConfiguration } from '../configuration';
import { RootActorProxy } from '../firefox/actorProxy/root';
import { AddonsActorProxy } from '../firefox/actorProxy/addons';
import { PreferenceActorProxy } from '../firefox/actorProxy/preference';
import { ConsoleActorProxy } from '../firefox/actorProxy/console';
import { WebExtensionActorProxy } from '../firefox/actorProxy/webExtension';
import { TabActorProxy } from '../firefox/actorProxy/tab';
import { FirefoxDebugSession } from '../firefoxDebugSession';
import { PopupAutohideEventBody } from '../../common/customEvents';
import { isWindowsPlatform } from '../../common/util';

export const popupAutohidePreferenceKey = 'ui.popup.disable_autohide';

/**
 * When debugging a WebExtension, this class installs the WebExtension, attaches to it, reloads it
 * when desired and tells the [`PopupAutohideManager`](../../extension/popupAutohideManager.ts) the
 * initial state of the popup auto-hide flag by sending a custom event.
 */
export class AddonManager {

	private readonly config: ParsedAddonConfiguration;

	private addonAttached = false;
	private addonActor: TabActorProxy | undefined = undefined;
	private webExtensionActor: WebExtensionActorProxy | undefined = undefined;

	constructor(
		private readonly enableCRAWorkaround: boolean,
		private readonly debugSession: FirefoxDebugSession
	) {
		this.config = debugSession.config.addon!;
	}

	public async sessionStarted(
		rootActor: RootActorProxy,
		addonsActor: AddonsActorProxy,
		preferenceActor: PreferenceActorProxy,
		useConnect: boolean
	): Promise<void> {

		const addonPath = isWindowsPlatform() ? path.normalize(this.config.path) : this.config.path;
		let result = await addonsActor.installAddon(addonPath);
		if (!this.config.id) {
			this.config.id = result.addon.id;
		}

		this.fetchAddonsAndAttach(rootActor, useConnect);

		if (this.config.popupAutohideButton) {
			const popupAutohide = !(await preferenceActor.getBoolPref(popupAutohidePreferenceKey));
			this.debugSession.sendCustomEvent('popupAutohide', <PopupAutohideEventBody>{ popupAutohide });
		}
	}

	public async reloadAddon(): Promise<void> {
		if (!this.webExtensionActor) {
			throw 'Addon isn\'t attached';
		}

		await this.webExtensionActor.reload();
	}

	private async fetchAddonsAndAttach(rootActor: RootActorProxy, useConnect: boolean): Promise<void> {

		if (this.addonAttached) return;

		let addons = await rootActor.fetchAddons();

		if (this.addonAttached) return;

		addons.forEach((addon) => {
			if (addon.id === this.config.id) {
				(async () => {

					let consoleActor: ConsoleActorProxy;
					this.webExtensionActor = new WebExtensionActorProxy(
						addon, this.enableCRAWorkaround, this.debugSession.pathMapper,
						this.debugSession.firefoxDebugConnection);

					if (useConnect) {
						[this.addonActor, consoleActor] = await this.webExtensionActor.connect();
					} else {
						[this.addonActor, consoleActor] = await this.webExtensionActor.getTarget();
					}

					let threadAdapter = await this.debugSession.attachTabOrAddon(
						this.addonActor, consoleActor, 'Addon');
					if (threadAdapter !== undefined) {
						this.debugSession.attachConsole(consoleActor, threadAdapter);
					}
					this.addonAttached = true;
				})();
			}
		});
	}
}
