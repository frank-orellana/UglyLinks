/* Copyright 2017  Franklin Orellana

This file is part of UglyLinks.

UglyLinks is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

UglyLinks is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>.

*/

import {UglyLinks, LinkProps} from './uglylinks_classes.js'



console.log('Background!');

function onCreated() {
	if (browser.runtime.lastError) {
		console.error(`Error: ${browser.runtime.lastError}`);
	} else {
		console.debug("Menu item created successfully");
	}
}

browser.contextMenus.create({
	id: "uglify",
	title: browser.i18n.getMessage("menuItemUglifyRemove"),
	contexts: ["link"]
}, onCreated);

async function uglifyOneLink(tabs: any, pUrl: any) {
	const isUglified : boolean = await ulApp.links.hasURL(pUrl);
	if(isUglified)
		ulApp.links.removeURL(pUrl);
	else
		ulApp.links.addURL(pUrl);
	
	browser.tabs.sendMessage(tabs[0].id, {
		type: "uglify",
		alreadyUglified: isUglified,
		url: pUrl,
	});
	return true;
}

async function menuHandler(info: any, _tab: any): Promise<boolean> {
	switch (info.menuItemId) {
		case "uglify":
			let tabs = await browser.tabs.query({ active: true, currentWindow: true });
			return uglifyOneLink(tabs, info.linkUrl);
	}
	return false;
}

browser.contextMenus.onClicked.addListener(menuHandler);




const ulApp = new UglyLinks();
ulApp.init().then(()=>{
	browser.runtime.onMessage.addListener(async (msg: any): Promise<any> => {
		console.debug('Message received in background:', msg);
		switch (msg.type) {
			case "get-links":
				let links:Array<LinkProps> = await ulApp.links.getLinksArray() || [];
				const links2 : string[] = links.map((v:LinkProps) => v.url);
				return new Promise((resolve) => {
					resolve({type:"links",links:links2});
				});
			case "get-disabled-webs":
				let disabledWebs:Array<LinkProps> = await ulApp.disabledWebsites.getLinksArray() || [];
				const dwebs : string[] = disabledWebs.map((v:LinkProps) => v.url);

				return new Promise((resolve) => {
					resolve({type:"disabledWebsites",disabledWebs: dwebs});
				});
			case "is-this-url-disabled":
				let disabled:boolean= await ulApp.disabledWebsites.isUrlDisabled(msg.url);
				return new Promise((resolve) => {
					resolve({type:"disabledWebsites",disabled: disabled});
				});

			default:
				console.warn('Uknown message received');
				return new Promise((r)=>{
					r('Sorry I didn\'t understand')
				});
	
		}
	});
});



