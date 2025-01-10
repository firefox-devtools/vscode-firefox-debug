import { Log } from '../../util/log';
import { DebugConnection } from '../connection';
import { BaseActorProxy } from './base';
import { WatcherActorProxy } from './watcher';

let log = Log.create('DescriptorActorProxy');

/**
 * Proxy class for a TabDescriptor or WebExtensionDescriptor actor
 */
export class DescriptorActorProxy extends BaseActorProxy {

	constructor(name: string, connection: DebugConnection) {
		super(name, connection, log);
	}

	public async getWatcher(): Promise<WatcherActorProxy> {
		return await this.sendCachedRequest(
			'getWatcher',
			{ type: 'getWatcher', isServerTargetSwitchingEnabled: true, isPopupDebuggingEnabled: false },
			(response: FirefoxDebugProtocol.GetWatcherResponse) =>
				new WatcherActorProxy(response.actor, !!response.traits.content_script, this.connection)
		);
	}

	public async reload() {
		await this.sendRequest({ type: 'reloadDescriptor' });
	}

	public onDestroyed(cb: () => void) {
		this.on('destroyed', cb);
	}

	handleEvent(event: FirefoxDebugProtocol.DescriptorDestroyedEvent): void {
		if (event.type === 'descriptor-destroyed') {
			log.debug(`Descriptor ${this.name} destroyed`);
			this.emit('destroyed');
		} else {
			log.warn(`Unknown message: ${JSON.stringify(event)}`);
		}
	}
}