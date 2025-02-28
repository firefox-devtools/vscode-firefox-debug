import * as vscode from 'vscode';
import { ThreadStartedEventBody, NewSourceEventBody } from '../../common/customEvents';
import { TreeNode } from './treeNode';
import { RootNode } from './rootNode';

export class LoadedScriptsProvider implements vscode.TreeDataProvider<TreeNode> {

	private readonly root = new RootNode();

	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode | void>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode | void>;

	public constructor() {
		this.onDidChangeTreeData = this.treeDataChanged.event;
	}

	public getTreeItem(node: TreeNode): vscode.TreeItem {
		return node.treeItem;
	}

	public getChildren(node?: TreeNode): vscode.ProviderResult<TreeNode[]> {
		let parent = (node || this.root);
		return parent.getChildren();
	}

	public hasSession(sessionId: string) {
		return this.root.hasSession(sessionId);
	}

	public addSession(session: vscode.DebugSession) {
		let changedItem = this.root.addSession(session);
		this.sendTreeDataChangedEvent(changedItem);
	}

	public removeSession(sessionId: string) {
		let changedItem = this.root.removeSession(sessionId);
		this.sendTreeDataChangedEvent(changedItem);
	}

	public async addThread(threadInfo: ThreadStartedEventBody, sessionId: string) {
		let changedItem = await this.root.addThread(threadInfo, sessionId);
		this.sendTreeDataChangedEvent(changedItem);
	}

	public async removeThread(threadId: number, sessionId: string) {
		let changedItem = await this.root.removeThread(threadId, sessionId);
		this.sendTreeDataChangedEvent(changedItem);
	}

	public async addSource(sourceInfo: NewSourceEventBody, sessionId: string) {
		let changedItem = await this.root.addSource(sourceInfo, sessionId);
		this.sendTreeDataChangedEvent(changedItem);
	}

	public async removeSources(threadId: number, sessionId: string) {
		let changedItem = await this.root.removeSources(threadId, sessionId);		
		this.sendTreeDataChangedEvent(changedItem);
	}

	public async getSourceUrls(sessionId: string): Promise<string[] | undefined> {
		return this.root.getSourceUrls(sessionId);
	}

	private sendTreeDataChangedEvent(changedItem: TreeNode | undefined) {
		if (changedItem) {
			if (changedItem === this.root) {
				this.treeDataChanged.fire();
			} else {
				this.treeDataChanged.fire(changedItem);
			}
		}
	}
}
