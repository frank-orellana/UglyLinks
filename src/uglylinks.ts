// Copyright 2018  Franklin Orellana
// This file is part of UglyLinks.

// UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 

/// <references type='web-ext-types' />

console.debug('uglylinks Content Script Loading!');

class App {
	static ul_uglifyall_timeout: any;

	_self: this = this;
	observer = new MutationObserver(function (mutations) {
		let uglyLinks: Array<string>; // = (await App.getUpdatedLinks()).links;
		mutations.forEach(async (mutation) => {
			if (mutation.type == 'childList') {
				if (mutation.addedNodes.length > 0) {
					let lnks: HTMLAnchorElement[] = [];
					for (let i = 0; i < mutation.addedNodes.length; i++) {
						let e: Node = mutation.addedNodes[i];
						if (e.nodeType != Node.TEXT_NODE) {
							const e1: HTMLElement = e as HTMLElement;
							if (e1.tagName == 'A') {
								lnks = lnks.concat(e1 as HTMLAnchorElement);
							} else {
								lnks = lnks.concat(Array.from(e1.getElementsByTagName('A') as HTMLCollectionOf<HTMLAnchorElement>));
							}
						}
					}
					if (lnks.length > 0){
						if(!uglyLinks) uglyLinks = (await App.getUpdatedLinks()).links;
						App.onNodeInserted(lnks,uglyLinks);
					}
				}
			} else if (mutation.type == 'attributes') {
				//console.trace('attributes:', mutation.target, mutation.attributeName);
				if (mutation.attributeName && mutation.attributeName.toLocaleUpperCase() === 'HREF'){
					if(!uglyLinks) uglyLinks = (await App.getUpdatedLinks()).links;
					App.onNodeInserted([mutation.target as HTMLAnchorElement],uglyLinks);
				}
			}

		})
	});

	static async getUpdatedLinks(): Promise<{links:Array<string>}>{
		console.debug('sending message from content script: get-links');
		const response = await browser.runtime.sendMessage(
						{ type: "get-links", to:"background", msg: "message from content script" });
		console.debug("response:",response);
		return response;
	}

	static async isThisURLdisabled(url:string):Promise<boolean>{
		console.debug('sending message from content script: isURLDisabled');
		const response = await browser.runtime.sendMessage({ type: "is-this-url-disabled", to:"background", url: url });
		console.debug("response:",response);
		return response.disabled;
	}
	async initUglyLinks(): Promise<boolean> {
		console.log('Initializing UglyLinks');

		/// @ts-ignore
		browser.runtime.onMessage.addListener((message: any) => App.messageListener(message, this));
		console.debug('Listener added on Content Script');

		console.debug('UglyLinks Class initialized');

		const url: string = window.location.host;
		console.debug(`Checking if "${url}" is disabled`);

		if (await App.isThisURLdisabled(url)) {
			console.debug('Current URL is disabled for UglyLinks');
			return false;
		}

		await App.uglifyAll();

		this.enableObserver();
		return true;

	}

	disableObserver() {
		this.observer.disconnect();
	}

	enableObserver() {
		this.observer.observe(document, {
			childList: true,
			attributes: true,
			attributeFilter: ["href"],
			subtree: true
		});
	}

	static async messageListener(message: any, app: App) {
		console.debug('Receiving message:', message, app);
		switch (message.type) {
			case 'uglify':
				let url: string = message.url;
				const alreadyUglified: boolean = message.alreadyUglified;
				await App.uglifyOne(url, alreadyUglified);
				break;
			case 'uglify_all':
				await App.uglifyAll(Array.from(document.links));
				break;
			case 'deuglify_all':
				App.DeUglifyAll();
				break;
			case 'toggle_ul':
				app.toggleUglyLinks(message.otherParams.enabledOnThisWebsite, message.otherParams.links);
				break;
			default:
				console.warn('Message not recognized:', message);
		}

		return true;
	}


	async toggleUglyLinks(enabledOnThisWebsite: boolean, links:Array<string>) {
		
		if (enabledOnThisWebsite === undefined) {
			const url: string = window.location.host;
			enabledOnThisWebsite = !await App.isThisURLdisabled(url);
		}

		this.disableObserver();

		if (enabledOnThisWebsite) {
			await App.uglifyAll(Array.from(document.links),links);
			this.enableObserver();
		} else {
			App.DeUglifyAll();
		}
		return true;
	}

	static onNodeInserted(E: Array<HTMLAnchorElement | HTMLAreaElement>, uglyLinks: Array<string>) {
		const timeout_ms = 100;
		if (!App.ul_uglifyall_timeout) {
			console.debug(`dom changed... setting timeout to ${timeout_ms}ms`);
			App.ul_uglifyall_timeout = setTimeout(() => App.uglifyAll(E,uglyLinks), timeout_ms);
		}
	}

	//TODO: correct this! what's links default value? pass it always? yes!
	static async uglifyAll(l = Array.from(document.links), links?:string[]): Promise<boolean> {
		if(links == undefined) links = (await App.getUpdatedLinks()).links;
		console.debug(`Proceeding to uglify ${links.length} links in ${l.length} anchors`);

		if (links && links.length == 0) return false;
		let cnt = 0;

		for (let i = 0; i < l.length; i++) {
			let e: HTMLAnchorElement | HTMLAreaElement = l[i];

			const url = new URL(e.href, window.location.href); //TODO update storage in the end!
			if (!e.hasAttribute("data-UL_color") && links.includes(App.normalizeURL(url.href))) {
				this.uglifyElement(e);
				cnt++;
			}
		}

		console.debug(`Uglified ${cnt} anchors`);

		browser.tabs.query({ active: true, currentWindow: true })
			.then((tabs) => {
				if (tabs[0] != undefined && typeof tabs[0].id == 'number')
					browser.tabs.sendMessage(tabs[0].id || 0, {
						type: "uglified_count",
						count: cnt || 0
					});
				else
					console.warn('no active tab');
			}).then((val) => {
				console.log("Count message sent. answer received:", val);
			});


		return true;
	}

	static DeUglifyAll() {
		let l: HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement> = document.links;

		console.debug(`Proceeding to DeUglify all links in ${l.length} anchors`);

		for (let i = 0; i < l.length; i++) {
			let e: HTMLAnchorElement | HTMLAreaElement = l[i];
			if (e.hasAttribute("data-UL_color")) {
				App.deUglifyElement(e);
			}
		}
	}

	static normalizeURL(url: string, justHost: boolean = false): string {
		let newUrl: string = url.replace(/(?:^https?:\/\/(?:www\.)?)|(?:^www\.)/i, '');
		if (justHost)
			newUrl = newUrl.split('/', 1)[0]; 
		return newUrl;
	}
	static async uglifyOne(url: string, alreadyUglified: boolean, baseURL: string = window.location.href) {
		console.debug(`${alreadyUglified ? 'Removing' : 'Adding'} uglification for ${url}`);
		const nUrl: string = App.normalizeURL(new URL(url, baseURL).href);

		const l: HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement> = document.links;
		console.debug(`verifying ${l.length} elements`);
		for (let i = 0; i < l.length; i++) {
			let e = l[i];
			let element_url: string = App.normalizeURL(new URL(e.href, baseURL).href);
			if (element_url == nUrl)
				if (alreadyUglified) App.deUglifyElement(e);
				else App.uglifyElement(e);
		}
	}

	static uglifyElement(e: HTMLElement, child = false) {
		e.setAttribute("data-UL_color", getComputedStyle(e, null).color || '');
		e.setAttribute("data-UL_backgroundColor", getComputedStyle(e, null).backgroundColor || '');
		e.setAttribute("data-UL_opacity", getComputedStyle(e, null).opacity || '');
		e.setAttribute("data-UL_textDecoration", getComputedStyle(e, null).textDecoration || '');

		e.style.color = 'red';
		e.style.backgroundColor = 'yellow';
		e.style.opacity = '0.5';
		e.style.textDecoration = 'line-through';
		if (!child) console.debug(`uglified ${(<HTMLAnchorElement>e).href}`);

		for (let c of Array.from(e.children))
			this.uglifyElement(<HTMLElement>c, true);

		return true;
	}

	static deUglifyElement(e: HTMLElement) {
		e.style.color = e.getAttribute("data-UL_color");
		e.style.backgroundColor = e.getAttribute("data-UL_backgroundColor");
		e.style.opacity = e.getAttribute("data-UL_opacity");
		e.style.textDecoration = e.getAttribute("data-UL_textDecoration");

		for (let c of Array.from(e.children))
			this.deUglifyElement(c as HTMLElement);

		e.removeAttribute("data-UL_color");
		e.removeAttribute("data-UL_backgroundColor");
		e.removeAttribute("data-UL_opacity");
		e.removeAttribute("data-UL_textDecoration");
	}
}

(async () => {
	await new App().initUglyLinks();
	console.log('initialized!!!!!!!');
})();