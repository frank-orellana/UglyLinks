// Copyright 2018  Franklin Orellana
//This file is part of UglyLinks.
//UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
//You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 
import { UpgradeDB, DB, ObjectStore, Transaction } from "./lib/idb";

//console.log('ulc idb', idb);

export class LinkProps {
	url: string = '';
	added: Date = new Date();
	last_seen: Date = new Date();
	uglified_count: number = 0;
}

export interface AppMsg {
	type: string,
	url?: string,
	count?: number
}

export class AppMessaging {
	private listeners: Array<{ type: string, callback: Function }> = [];

	registerListener(type: AppMsg["type"], callback: Function) {
		this.listeners.push({
			type: type,
			callback: callback
		});
		callback();
	};
}

export class Logger {
	static caller_ln(): string { //thanks to https://stackoverflow.com/a/27074218/1583422
		const e: Error = new Error();
		if (!e.stack) try {
			throw e;
		} catch (e) { if (!e.stack) return '0'; }// IE < 10, likely
		const stack: string[] = e.stack ? e.stack.toString().split(/\r\n|\n/) : [];
		// We want our caller's frame. It's index into |stack| depends on the
		// browser and browser version, so we need to search for the second frame:
		const frameRE: RegExp = /:(\d+):(?:\d+)[^\d]*$/;
		do {
			var frame: string = stack.shift() || '';
		} while (!frameRE.exec(frame) && stack.length);
		frameRE.exec(stack.shift() || ''); //added so this can be called from inside logger
		const m: RegExpMatchArray | null = (stack.shift() || '').match(/\/([^\/\)]+)\)?$/);
		if (m) return m[1];
		return '';
	}

	static trace(...msg: any[]) {
		const line: string = Logger.caller_ln();
		console.log('UL_TRACE', line, ...msg);
	}
	static debug(...msg: any[]) {
		const line: string = Logger.caller_ln();
		console.log('UL_DBG', line, ...msg);
	}
	static warning(...msg: any[]) {
		const line: string = Logger.caller_ln();
		console.warn('UL_WRN', line, ...msg);
	}
	static error(...msg: any[]) {
		const line: string = Logger.caller_ln();
		console.error('UL_DBG', line, ...msg);
	}
}

export class UL_links {
	storage: UL_Storage;
	storeName: string;
	constructor(storage: UL_Storage) {
		this.storeName = "uglyfied_links";
		this.storage = storage;
	}

	normalizeURL(url: string, justHost: boolean = false): string {
		let newUrl: string = url.replace(UL_links.regexInitURL(), '');
		if (justHost)
			newUrl = newUrl.split('/', 1)[0];
		return newUrl;
	}

	static regexInitURL(): RegExp {
		return /(?:^https?:\/\/(?:www\.)?)|(?:^www\.)/i;
	}

	async init(): Promise<void> {
		/*try {
			this.linksArray = await this.storage.getAllFromStore(this.storeName);
		} catch (e) {
			Logger.error('Error getting links from storage, setting new map', e);
			this.linksArray = [];
		}*/
	}

	async getLinksIterable(): Promise<IterableIterator<[string, LinkProps]>> {
		this.checkInitialization();

		const a: LinkProps[] = await this.getLinksArray() || [];
		return a.reduce(
			(map, currentURL) => map.set(currentURL.url, currentURL), new Map()).entries();
	}

	checkInitialization() {
		//if (!this.linksArray) throw 'Links are not yet initialized!';
	}

	async getLinksArray(start: number = -1, end?: number): Promise<Array<LinkProps> | undefined> {
		this.checkInitialization();

		let bound: IDBKeyRange | undefined;
		if (start >= 0)
			if (end == undefined)
				bound = IDBKeyRange.lowerBound(start);
			else if (end >= 0)
				bound = IDBKeyRange.bound(start, end);

		if (bound)
			return await this.storage.getAllFromStore(this.storeName, bound);
		else
			return await this.storage.getAllFromStore(this.storeName)
	}
	async removeURL(url: string, persist = true) {
		console.debug('removeURL', url, persist);

		let nUrl: string = this.normalizeURL(url);
		this.storage.deleteFromStore(this.storeName, nUrl);
	}
	async addURL(url: string, props: LinkProps = new LinkProps(), persist = true): Promise<boolean> {
		console.debug('addURL', url, props, persist);

		let nUrl: string = this.normalizeURL(url); // url.replace(this.regexInitURL, '');
		props.url = nUrl;
		props.added = new Date();
		props.last_seen = props.added;
		props.uglified_count = 1;

		this.storage.putInStore(this.storeName, props);

		return true;
	}
	async removeAllURLs() {
		this.storage.deleteAllFromStore(this.storeName);
	}

	async hasURL(url: string, touch: boolean = false): Promise<boolean> {
		this.checkInitialization()
		const nUrl: string = this.normalizeURL(url);

		let u: LinkProps = await this.storage.getFromStore(this.storeName, nUrl);

		if (u && touch) {
			u.last_seen = new Date();
			if (!u.uglified_count) u.uglified_count = 0;
			u.uglified_count++;
			this.storage.putInStore(nUrl, u);
			return true
		}

		return u ? true : false;
	}

	get size(): Promise<number> {
		return this.storage.getStoreSize(this.storeName);
	}
}

export class UL_DisabledURLs extends UL_links {
	constructor(storage: UL_Storage) {
		super(storage);
		this.storeName = "disabled_webs";
	}

	async isUrlDisabled(url: string): Promise<boolean> {
		console.debug('isUrlDisabled', url);
		const newUrl: string = this.normalizeURL(url, true);
		return await this.hasURL(newUrl);
	}

	async disableURL(url: string) {
		console.debug('disableURL', url);
		const newUrl: string = this.normalizeURL(url, true);
		await this.addURL(newUrl);
	}

	async enableURL(url: string) {
		console.debug('enableURL', url);
		const newUrl: string = this.normalizeURL(url, true);
		await this.removeURL(newUrl);
	}

}

interface ulInitParams {
	dbName?: string
}

//******************* MAIN APP CLASS
export class UglyLinks {
	links: UL_links;
	disabledWebsites: UL_DisabledURLs;
	storage: UL_Storage;

	constructor() {
		this.storage = new UL_Storage();
		this.links = new UL_links(this.storage);
		this.disabledWebsites = new UL_DisabledURLs(this.storage);
	}

	async init(params?: ulInitParams): Promise<void> {
		await this.storage.init(params);
		await this.links.init();
		await this.disabledWebsites.init();
	}

	async importFile(_e: Event, fileElem: HTMLInputElement, callback?: Function): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			Logger.debug('File has changed, proceeding to import');
			let file:File;
			if (fileElem.files)
				file = fileElem.files[0];
			else{
				reject('65425: invalid file');
				return;
			}

			const reader: FileReader = new FileReader();
			if (reader.result instanceof ArrayBuffer){
				reject('09232: invalid result');
				return;
			}

			if (!file){
				reject('invalid file element');
				return;
			}

			let x: UglyLinks = this;
			reader.addEventListener("loadend", async function () {
				const textResult: string = <string>reader.result;
				if (!textResult) { 
					alert(i18n.msgs({ id: "file_empty", def: "The file could not be read or is empty" }));
					resolve(false);
					return;
				}

				const array_to_import: Array<LinkProps> = JSON.parse(textResult).uglyLinks;

				Logger.debug(`Importing ${array_to_import.length} entries to current links. Current size: ${await x.links.size}`);

				array_to_import.forEach((e) => {
					console.debug('adding url to map', e);
					const props: LinkProps = e;
					if (!props.added) props.added = new Date();
					x.links.addURL(e.url, props);
				});

				const resp: any = await x.sendMsgToAll("uglify_all", { origin: "imported" });
				console.debug('Message to update all sent. Response:', resp);

				if (callback) {
					Logger.trace('calling callback function from importFile');
					await callback();
				}

				alert(browser.i18n.getMessage('SuccessImportMsg'));

				Logger.debug(`Importing finalized. Current size: ${await x.links.size}`);
				resolve(true);
			});
			reader.readAsText(file);
		});
	}

	async export_links() {
		const strLnks: string = JSON.stringify({ uglyLinks: await this.links.getLinksArray() });
		Logger.trace('Exporting links str:', strLnks);

		const nUrl: string = URL.createObjectURL(new Blob([strLnks], { type: 'application/json' }));
		browser.downloads.download({ url: nUrl, filename: 'uglylinks.json' });
		return true;
	}

	sendMsgToAll(pType: string, otherParams?: object): Promise<any> {
		return browser.runtime.sendMessage({
			type: pType,
			otherParams: otherParams
		});
	}

	async sendMsgToActiveTab(pType: string, otherParams?: object) {
		let tabs: any[] = await browser.tabs.query({ active: true, currentWindow: true });

		try {
			if (tabs[0].id)
				await browser.tabs.sendMessage(tabs[0].id || 0, {
					type: pType,
					otherParams: otherParams
				});
			else console.warn('No active tab');
			return true;
		} catch (e) {
			Logger.warning('Error sending message to active tab', e);
			return false;
		}
	}

	async removeAllLinks() {
		Logger.trace('Removing All links');
		await this.links.removeAllURLs();

		Logger.debug('All links removed');
		return await this.sendMsgToActiveTab("deuglify_all");
	}

	/*async getCurrentURL(): Promise<string>{
		const tabs = await browser.tabs.query({active: true,currentWindow: true});
		console.debug('Current URL:',tabs[0],tabs[0]?tabs[0].url:undefined)
		return tabs[0]?tabs[0].url:undefined;
	}*/

	async toggleUglyLinksOnWebsite(websiteURL: string): Promise<boolean> {

		const disabled: boolean = await this.disabledWebsites.isUrlDisabled(websiteURL);
		if (disabled) {
			console.debug(`removing ${websiteURL} from disabled list`);
			await this.disabledWebsites.enableURL(websiteURL); console.debug('...enabled');
		} else {
			console.debug(`adding ${websiteURL} to disabled list`);
			await this.disabledWebsites.disableURL(websiteURL); console.debug('...disabled');
		}

		Logger.trace('UglyLinks.disabledLinks:', this.disabledWebsites);
		return disabled; // !enabled
	}
	/**
	 * Adds or removes a url and returns the new state (true: added, false: removed)
	 * @param url string representing the url to add or remove
	 */
	async toggleURL(url: string): Promise<boolean> {
		const links: UL_links = this.links;

		const uglified: boolean = await links.hasURL(url);
		if (uglified) {
			await links.removeURL(url);
		} else {
			await links.addURL(url);
		}
		return !uglified;
	}
}

export interface i18n_msg {
	id: string,
	def?: string,
	default?: string
}

export class i18n {
	static msgs(msg: string | i18n_msg, ...args: Array<any>): string {
		try {
			if (typeof msg === 'string') {
				const translatedMsg: string = browser.i18n.getMessage(msg, ...args);
				return translatedMsg ? translatedMsg : msg;
			} else {
				const translatedMsg: string = browser.i18n.getMessage(msg.id, ...args);
				return translatedMsg ? translatedMsg : (msg.default ? msg.default : (msg.def ? msg.def : ''));
			}
		} catch (e) {
			console.error("Error getting i18n message", msg, e);
			if (typeof msg === 'string')
				return msg;
			return msg.id;
		}
	}

	static formatDate(myDate: any): string {
		if (typeof myDate == 'string')
			return new Date(myDate).toLocaleDateString();
		else if (myDate instanceof Date)
			return myDate.toLocaleDateString();
		else
			throw 'invalid date: ' + myDate.toString();
	}

	static formatDateTime(date: Date | string): string {
		if (typeof date == 'string')
			return new Date(date).toLocaleString();
		else if (date instanceof Date)
			return date.toLocaleString();
		else
			throw 'invalid date: ' + date;
	}
}


export class UL_Storage {
	private dbName: string;
	db: DB | undefined;
	constructor() {
		this.dbName = 'uglylinks-db';
	}

	async init(params?: ulInitParams) {
		console.debug('Initializing storage');

		if (params)
			if (params.dbName) this.dbName = params.dbName;

		if (!('indexedDB' in window)) return console.error('This browser doesn\'t support IndexedDB');

		function checkStore(_db: UpgradeDB, storeName: string, optionalParameters?: IDBObjectStoreParameters) {
			if (!_db.objectStoreNames.contains(storeName)) {
				_db.createObjectStore(storeName, optionalParameters);
			}
		}

		try {
			this.db = await idb.open(this.dbName, 2, function (upgradeDb) {
				console.debug("upgrade needed, creating objects");

				checkStore(upgradeDb, 'uglyfied_links', { keyPath: 'url' });
				checkStore(upgradeDb, 'disabled_webs', { keyPath: 'url' });
				checkStore(upgradeDb, 'options', { keyPath: 'id' });
			});
			console.debug('Storage initialized', this.db);
		} catch (e) {
			console.error('Error opening store:', e, this.db);
		}
	}

	async getFromStore(storeName: string, key: any): Promise<any> {
		console.debug('getFromStore', storeName, key);
		if (!this.db) throw 'DB is undefined';
		try {
			const store: ObjectStore<any, any> = this.db.transaction(storeName, 'readonly').objectStore(storeName);
			return await store.get(key);
		} catch (e) {
			console.error('Error getting from store', e);
			return undefined;
		}
	}

	async getStoreSize(storeName: string): Promise<number> {
		console.debug('getStoreSize', storeName);
		if (!this.db) throw 'DB is undefined';
		try {
			const store: ObjectStore<any, any> = this.db.transaction(storeName, 'readonly').objectStore(storeName);
			return await store.count();
		} catch (e) {
			console.error('Error getting store size', e);
			return -1;
		}
	}

	async getAllFromStore(storeName: string, query?: IDBKeyRange | IDBValidKey, count?: number)
		: Promise<any[] | undefined> {
		console.log('getAllFromStore', storeName, query, count);
		if (!this.db) throw 'DB is undefined';
		try {
			const tx: Transaction = this.db.transaction(storeName, 'readonly');
			const store: ObjectStore<any, any> = tx.objectStore(storeName);
			return await store.getAll();
		} catch (e) {
			console.error('Error getting all from the store', e);
			return undefined;
		}
	}

	async putInStore(storeName: string, object: any): Promise<IDBValidKey | undefined> {
		console.debug('putInStore', storeName, object);
		let k: IDBValidKey | undefined;
		if (!this.db) throw 'DB is undefined';
		try {
			const tx: Transaction = this.db.transaction(storeName, 'readwrite');
			const store: ObjectStore<any, any> = tx.objectStore(storeName);
			k = await store.put(object);
			await tx.complete;
		} catch (e) {
			console.log('Error putting in store', e);
		}
		return k;
	}

	async deleteFromStore(storeName: string, key: string): Promise<void> {
		console.debug('deleteFromStore', storeName);
		if (!this.db) throw 'DB is undefined';
		const tx: Transaction = this.db.transaction(storeName, 'readwrite');
		const store: ObjectStore<any, any> = tx.objectStore(storeName);
		await store.delete(key);
		return await tx.complete;
	}

	async deleteAllFromStore(storeName: string) {
		console.debug('deleteAllFromStore', storeName);
		if (!this.db) throw 'DB is undefined';
		const tx: Transaction = this.db.transaction(storeName, 'readwrite');
		const store: ObjectStore<any, any> = tx.objectStore(storeName);
		await store.delete(IDBKeyRange.lowerBound(0));
		return await tx.complete;
	}
}

