import { Log } from '../../util/log';
import { EventEmitter } from 'events';
import { PendingRequests } from './pendingRequests';
import { ActorProxy } from './interface';
import { TabActorProxy } from './tab';

let log = Log.create('RootActorProxy');

export class RootActorProxy extends EventEmitter implements ActorProxy {

	private tabs = new Map<string, TabActorProxy>();
	private pendingTabsRequests = new PendingRequests<Map<string, TabActorProxy>>();
	
	constructor(private connection: any) {
		super();
		this.connection.register(this);
	}

	public get name() {
		return 'root';
	}

	public fetchTabs(): Promise<Map<string, TabActorProxy>> {
		
		log.debug('Fetching tabs');
		
		return new Promise<Map<string, TabActorProxy>>((resolve, reject) => {
			this.pendingTabsRequests.enqueue({ resolve, reject });
			this.connection.sendRequest({ to: this.name, type: 'listTabs' });
		})
	}

	public receiveResponse(response: FirefoxDebugProtocol.Response): void {

		if (response['applicationType']) {

			this.emit('init', response);

		} else if (response['tabs']) {

			let tabsResponse = <FirefoxDebugProtocol.TabsResponse>response;
			let currentTabs = new Map<string, TabActorProxy>();

			// sometimes Firefox returns 0 tabs if the listTabs request was sent 
			// shortly after launching it
			if (tabsResponse.tabs.length === 0) {
				log.info('Received 0 tabs - will retry in 100ms');
				
				setTimeout(() => {
					this.connection.sendRequest({ to: this.name, type: 'listTabs' });
				}, 100);
				
				return;
			}
			
			log.debug(`Received ${tabsResponse.tabs.length} tabs`);

			// convert the Tab array into a map of TabActorProxies, re-using already 
			// existing proxies and emitting tabOpened events for new ones
			tabsResponse.tabs.forEach((tab) => {

				let tabActor: TabActorProxy;
				if (this.tabs.has(tab.actor)) {

					tabActor = this.tabs.get(tab.actor);

				} else {

					log.debug(`Tab ${tab.actor} opened`);

					tabActor = new TabActorProxy(tab.actor, tab.title, tab.url, this.connection);
					this.emit('tabOpened', tabActor);

				}
				currentTabs.set(tab.actor, tabActor);
			});

			// emit tabClosed events for tabs that have disappeared
			this.tabs.forEach((tabActor) => {
				if (!currentTabs.has(tabActor.name)) {
					log.debug(`Tab ${tabActor.name} closed`);
					this.emit('tabClosed', tabActor);
				}
			});					

			this.tabs = currentTabs;
			this.pendingTabsRequests.resolveOne(currentTabs);
			
		} else if (response['type'] === 'tabListChanged') {

			log.debug('Received tabListChanged event');
			
			this.emit('tabListChanged');

		} else {
			
			log.warn("Unknown message from RootActor: " + JSON.stringify(response));
			
		}
	}

	public onInit(cb: (response: FirefoxDebugProtocol.InitialResponse) => void) {
		this.on('init', cb);
	}

	public onTabOpened(cb: (tabActor: TabActorProxy) => void) {
		this.on('tabOpened', cb);
	}

	public onTabClosed(cb: (tabActor: TabActorProxy) => void) {
		this.on('tabClosed', cb);
	}

	public onTabListChanged(cb: () => void) {
		this.on('tabListChanged', cb);
	}
}
