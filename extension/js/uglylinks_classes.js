export class LinkProps {
    constructor() {
        this.url = '';
        this.added = new Date();
        this.last_seen = new Date();
        this.uglified_count = 0;
    }
}
export class AppMessaging {
    constructor() {
        this.listeners = [];
    }
    registerListener(type, callback) {
        this.listeners.push({
            type: type,
            callback: callback
        });
        callback();
    }
    ;
}
export class Logger {
    static caller_ln() {
        const e = new Error();
        if (!e.stack)
            try {
                throw e;
            }
            catch (e) {
                if (!e.stack)
                    return '0';
            } // IE < 10, likely
        const stack = e.stack ? e.stack.toString().split(/\r\n|\n/) : [];
        // We want our caller's frame. It's index into |stack| depends on the
        // browser and browser version, so we need to search for the second frame:
        const frameRE = /:(\d+):(?:\d+)[^\d]*$/;
        do {
            var frame = stack.shift() || '';
        } while (!frameRE.exec(frame) && stack.length);
        frameRE.exec(stack.shift() || ''); //added so this can be called from inside logger
        const m = (stack.shift() || '').match(/\/([^\/\)]+)\)?$/);
        if (m)
            return m[1];
        return '';
    }
    static trace(...msg) {
        const line = Logger.caller_ln();
        console.log('UL_TRACE', line, ...msg);
    }
    static debug(...msg) {
        const line = Logger.caller_ln();
        console.log('UL_DBG', line, ...msg);
    }
    static warning(...msg) {
        const line = Logger.caller_ln();
        console.warn('UL_WRN', line, ...msg);
    }
    static error(...msg) {
        const line = Logger.caller_ln();
        console.error('UL_DBG', line, ...msg);
    }
}
export class UL_links {
    constructor(storage) {
        this.storeName = "uglyfied_links";
        this.storage = storage;
    }
    normalizeURL(url, justHost = false) {
        let newUrl = url.replace(UL_links.regexInitURL(), '');
        if (justHost)
            newUrl = newUrl.split('/', 1)[0];
        return newUrl;
    }
    static regexInitURL() {
        return /(?:^https?:\/\/(?:www\.)?)|(?:^www\.)/i;
    }
    async init() {
        /*try {
            this.linksArray = await this.storage.getAllFromStore(this.storeName);
        } catch (e) {
            Logger.error('Error getting links from storage, setting new map', e);
            this.linksArray = [];
        }*/
    }
    async getLinksIterable() {
        this.checkInitialization();
        const a = await this.getLinksArray() || [];
        return a.reduce((map, currentURL) => map.set(currentURL.url, currentURL), new Map()).entries();
    }
    checkInitialization() {
        //if (!this.linksArray) throw 'Links are not yet initialized!';
    }
    async getLinksArray(start = -1, end) {
        this.checkInitialization();
        let bound;
        if (start >= 0)
            if (end == undefined)
                bound = IDBKeyRange.lowerBound(start);
            else if (end >= 0)
                bound = IDBKeyRange.bound(start, end);
        if (bound)
            return await this.storage.getAllFromStore(this.storeName, bound);
        else
            return await this.storage.getAllFromStore(this.storeName);
    }
    async removeURL(url, persist = true) {
        console.debug('removeURL', url, persist);
        let nUrl = this.normalizeURL(url);
        return this.storage.deleteFromStore(this.storeName, nUrl);
    }
    async addURL(url, props = new LinkProps(), persist = true) {
        console.debug('addURL', url, props, persist);
        let nUrl = this.normalizeURL(url); // url.replace(this.regexInitURL, '');
        props.url = nUrl;
        props.added = new Date();
        props.last_seen = props.added;
        props.uglified_count = 1;
        await this.storage.putInStore(this.storeName, props);
        return true;
    }
    async removeAllURLs() {
        return this.storage.deleteAllFromStore(this.storeName);
    }
    async hasURL(url, touch = false) {
        this.checkInitialization();
        const nUrl = this.normalizeURL(url);
        let u = await this.storage.getFromStore(this.storeName, nUrl);
        if (u && touch) {
            u.last_seen = new Date();
            if (!u.uglified_count)
                u.uglified_count = 0;
            u.uglified_count++;
            await this.storage.putInStore(nUrl, u);
            return true;
        }
        return u ? true : false;
    }
    get size() {
        return this.storage.getStoreSize(this.storeName);
    }
}
export class UL_DisabledURLs extends UL_links {
    constructor(storage) {
        super(storage);
        this.storeName = "disabled_webs";
    }
    async isUrlDisabled(url) {
        console.debug('isUrlDisabled', url);
        const newUrl = this.normalizeURL(url, true);
        return await this.hasURL(newUrl);
    }
    async disableURL(url) {
        console.debug('disableURL', url);
        const newUrl = this.normalizeURL(url, true);
        await this.addURL(newUrl);
    }
    async enableURL(url) {
        console.debug('enableURL', url);
        const newUrl = this.normalizeURL(url, true);
        await this.removeURL(newUrl);
    }
}
//******************* MAIN APP CLASS
export class UglyLinks {
    constructor() {
        this.storage = new UL_Storage();
        this.links = new UL_links(this.storage);
        this.disabledWebsites = new UL_DisabledURLs(this.storage);
    }
    async init(params) {
        await this.storage.init(params);
        await this.links.init();
        await this.disabledWebsites.init();
    }
    async importFile(_e, fileElem, callback) {
        return new Promise((resolve, reject) => {
            Logger.debug('File has changed, proceeding to import');
            let file;
            if (fileElem.files)
                file = fileElem.files[0];
            else {
                reject('65425: invalid file');
                return;
            }
            const reader = new FileReader();
            if (reader.result instanceof ArrayBuffer) {
                reject('09232: invalid result');
                return;
            }
            if (!file) {
                reject('invalid file element');
                return;
            }
            let x = this;
            reader.addEventListener("loadend", async function () {
                const textResult = reader.result;
                if (!textResult) {
                    alert(i18n.msgs({ id: "file_empty", def: "The file could not be read or is empty" }));
                    resolve(false);
                    return;
                }
                const array_to_import = JSON.parse(textResult).uglyLinks;
                Logger.debug(`Importing ${array_to_import.length} entries to current links. Current size: ${await x.links.size}`);
                array_to_import.forEach((e) => {
                    console.debug('adding url to map', e);
                    const props = e;
                    if (!props.added)
                        props.added = new Date();
                    x.links.addURL(e.url, props)
                        .catch(reason => console.error('Error adding URL', reason));
                });
                const resp = await x.sendMsgToAll("uglify_all", { origin: "imported" });
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
        const strLnks = JSON.stringify({ uglyLinks: await this.links.getLinksArray() });
        Logger.trace('Exporting links str:', strLnks);
        const nUrl = URL.createObjectURL(new Blob([strLnks], { type: 'application/json' }));
        await browser.downloads.download({ url: nUrl, filename: 'uglylinks.json' });
        return true;
    }
    async sendMsgToAll(pType, otherParams) {
        return browser.runtime.sendMessage({
            type: pType,
            otherParams: otherParams
        });
    }
    async sendMsgToActiveTab(pType, otherParams) {
        let tabs = await browser.tabs.query({ active: true, currentWindow: true });
        try {
            if (tabs[0].id)
                await browser.tabs.sendMessage(tabs[0].id || 0, {
                    type: pType,
                    otherParams: otherParams
                });
            else
                console.warn('No active tab');
            return true;
        }
        catch (e) {
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
    async toggleUglyLinksOnWebsite(websiteURL) {
        const disabled = await this.disabledWebsites.isUrlDisabled(websiteURL);
        if (disabled) {
            console.debug(`removing ${websiteURL} from disabled list`);
            await this.disabledWebsites.enableURL(websiteURL);
            console.debug('...enabled');
        }
        else {
            console.debug(`adding ${websiteURL} to disabled list`);
            await this.disabledWebsites.disableURL(websiteURL);
            console.debug('...disabled');
        }
        Logger.trace('UglyLinks.disabledLinks:', this.disabledWebsites);
        return disabled; // !enabled
    }
    /**
     * Adds or removes a url and returns the new state (true: added, false: removed)
     * @param url string representing the url to add or remove
     */
    async toggleURL(url) {
        const links = this.links;
        const uglified = await links.hasURL(url);
        if (uglified) {
            await links.removeURL(url);
        }
        else {
            await links.addURL(url);
        }
        return !uglified;
    }
}
export class i18n {
    static msgs(msg, ...args) {
        try {
            if (typeof msg === 'string') {
                const translatedMsg = browser.i18n.getMessage(msg, ...args);
                return translatedMsg ? translatedMsg : msg;
            }
            else {
                const translatedMsg = browser.i18n.getMessage(msg.id, ...args);
                return translatedMsg ? translatedMsg : (msg.default ? msg.default : (msg.def ? msg.def : ''));
            }
        }
        catch (e) {
            console.error("Error getting i18n message", msg, e);
            if (typeof msg === 'string')
                return msg;
            return msg.id;
        }
    }
    static formatDate(myDate) {
        if (typeof myDate == 'string')
            return new Date(myDate).toLocaleDateString();
        else if (myDate instanceof Date)
            return myDate.toLocaleDateString();
        else
            throw 'invalid date: ' + myDate.toString();
    }
    static formatDateTime(date) {
        if (typeof date == 'string')
            return new Date(date).toLocaleString();
        else if (date instanceof Date)
            return date.toLocaleString();
        else
            throw 'invalid date: ' + date;
    }
}
export class UL_Storage {
    constructor() {
        this.dbName = 'uglylinks-db';
    }
    async init(params) {
        console.debug('Initializing storage');
        if (params)
            if (params.dbName)
                this.dbName = params.dbName;
        if (!('indexedDB' in window))
            return console.error('This browser doesn\'t support IndexedDB');
        function checkStore(_db, storeName, optionalParameters) {
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
        }
        catch (e) {
            console.error('Error opening store:', e, this.db);
        }
    }
    async getFromStore(storeName, key) {
        console.debug('getFromStore', storeName, key);
        if (!this.db)
            throw 'DB is undefined';
        try {
            const store = this.db.transaction(storeName, 'readonly').objectStore(storeName);
            return await store.get(key);
        }
        catch (e) {
            console.error('Error getting from store', e);
            return undefined;
        }
    }
    async getStoreSize(storeName) {
        console.debug('getStoreSize', storeName);
        if (!this.db)
            throw 'DB is undefined';
        try {
            const store = this.db.transaction(storeName, 'readonly').objectStore(storeName);
            return await store.count();
        }
        catch (e) {
            console.error('Error getting store size', e);
            return -1;
        }
    }
    async getAllFromStore(storeName, query, count) {
        console.log('getAllFromStore', storeName, query, count);
        if (!this.db)
            throw 'DB is undefined';
        try {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            return await store.getAll();
        }
        catch (e) {
            console.error('Error getting all from the store', e);
            return undefined;
        }
    }
    async putInStore(storeName, object) {
        console.debug('putInStore', storeName, object);
        let k;
        if (!this.db)
            throw 'DB is undefined';
        try {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            k = await store.put(object);
            await tx.complete;
        }
        catch (e) {
            console.log('Error putting in store', e);
        }
        return k;
    }
    async deleteFromStore(storeName, key) {
        console.debug('deleteFromStore', storeName);
        if (!this.db)
            throw 'DB is undefined';
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.delete(key);
        return await tx.complete;
    }
    async deleteAllFromStore(storeName) {
        console.debug('deleteAllFromStore', storeName);
        if (!this.db)
            throw 'DB is undefined';
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.delete(IDBKeyRange.lowerBound(0));
        return await tx.complete;
    }
}
