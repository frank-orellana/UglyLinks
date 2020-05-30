// Copyright 2018  Franklin Orellana
// This file is part of UglyLinks.
// UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 
import { UglyLinks, i18n } from "./uglylinks_classes.js";

console.debug('popup.js');
let currentURL = '';
browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
    currentURL = tabs[0].url || '';
    console.debug('Current url:', currentURL);
}, reason => console.error('Could not get the current tab or url!, reason:', reason));
let popupApp;
Object.defineProperty(window, 'popupApp', {
    get: () => popupApp
});
const ulApp = new UglyLinks();
ulApp.init().then(() => {
    popupApp = new Vue({
        el: "#main",
        data: {
            ulApp: ulApp,
            i18n: i18n,
            disabledOnThisWebsite: true,
            uglified_count: 0,
            msgTogglePageURL: 'Cheking URL'
        },
        computed: {
            msgToggleUL: function () {
                console.debug(`Checking if "${currentURL}" is disabled`);
                console.debug(`"${currentURL}" is ${this.disabledOnThisWebsite ? 'disabled' : 'enabled'}`);
                return browser.i18n.getMessage(this.disabledOnThisWebsite ? "enableOnThisPage" : "disableOnThisPage");
            }
        },
        methods: {
            msgs: browser.i18n.getMessage,
            toggleUL: async function (event) {
                const enabledOnThisWebsite = await ulApp.toggleUglyLinksOnWebsite(currentURL);
                event.srcElement.value = browser.i18n.getMessage(enabledOnThisWebsite ? "disableOnThisPage" : "enableOnThisPage");
                const links = enabledOnThisWebsite ?
                    (await ulApp.links.getLinksArray() || []).map((v) => v.url)
                    : [];
                await ulApp.sendMsgToActiveTab("toggle_ul", { enabledOnThisWebsite: enabledOnThisWebsite, links: links });
                this.disabledOnThisWebsite = !enabledOnThisWebsite;
            },
            setMsgTogglePageURL: async function () {
                this.msgTogglePageURL = i18n.msgs((await ulApp.links.hasURL(currentURL)) ?
                    'DeuglifyThisPageURLButton' : 'UglifyThisPageURLButton');
            },
            toggleThisPageURL: async function () {
                const uglified = await ulApp.toggleURL(currentURL);
                /// @ts-ignore
                await this.setMsgTogglePageURL();
                console.debug(`The URL '${currentURL.substr(0, 25)}...' has been ${uglified ? "uglified" : "deuglified"}`);
            },
            importConfig: function (_ev) {
                const fileElem = document.getElementById("fileElem");
                if (fileElem)
                    fileElem.click();
            },
            updateLinks: async () => ulApp.sendMsgToActiveTab("uglify_all", { origin: "popup" }),
            closeWindow: () => window.close(),
            openOptions: async () => browser.runtime.openOptionsPage(),
            messageListener: async function (message) {
                console.debug('Receiving message:', message);
                if (message.to && message.to != 'popup') {
                    console.debug('ignoring');
                    return;
                }
                switch (message.type) {
                    case 'uglified_count':
                        let cnt = message.count;
                        this.uglified_count = cnt ? cnt : 0;
                        break;
                    default:
                        console.warn('Message not recognized:', message);
                }
            }
        },
        created: async function () {
            console.debug('Popup vue app created');
            let x = this;
            browser.runtime.onMessage.addListener((message) => x.messageListener(message));
            this.disabledOnThisWebsite = await ulApp.disabledWebsites.isUrlDisabled(currentURL);
            this.uglified_count = await ulApp.links.size;
            /// @ts-ignore
            await this.setMsgTogglePageURL();
        }
    });
})
    .catch(reason => console.error("Error loading popup", reason));
