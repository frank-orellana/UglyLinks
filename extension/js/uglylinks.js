"use strict";
// Copyright 2018  Franklin Orellana
// This file is part of UglyLinks.
// UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 
/// <references type='web-ext-types' />
console.debug(`UglyLinks ${browser.runtime.getManifest().version} Content Script Loading!`);
let App = /** @class */ (() => {
    class App {
        constructor() {
            this._self = this;
            this.observer = new MutationObserver(async function (mutations) {
                let anchors = new Set();
                mutations.forEach((mutation) => {
                    if (mutation.type == 'childList') {
                        if (mutation.addedNodes.length > 0) {
                            for (let i = 0; i < mutation.addedNodes.length; i++) {
                                let e = mutation.addedNodes[i];
                                if (e.nodeType != Node.TEXT_NODE && e.nodeType != Node.COMMENT_NODE) {
                                    const e1 = e;
                                    if (e1.tagName == 'A') {
                                        if (e1.href)
                                            anchors = anchors.add(e1);
                                    }
                                    else if (e1.getElementsByTagName) {
                                        Array.from(e1.getElementsByTagName('A'))
                                            .filter(elem => elem.href)
                                            .forEach(anc => anchors.add(anc));
                                    }
                                }
                            }
                        }
                    }
                    else if (mutation.type == 'attributes') {
                        if (mutation.attributeName && mutation.attributeName.toLocaleUpperCase() === 'HREF') {
                            const target = mutation.target;
                            if (target.href != "") //TODO: deuglify element if href is empty?
                                anchors = anchors.add(target);
                        }
                    }
                });
                if (anchors.size > 0) {
                    await App.onNodeInserted(Array.from(anchors));
                }
            });
        }
        static async getUpdatedLinks() {
            console.debug('sending message from content script: get-links');
            const response = await browser.runtime.sendMessage({ type: "get-links", to: "background", msg: "message from content script" });
            console.debug("response:", response);
            return response;
        }
        static async isThisURLdisabled(url) {
            console.debug('sending message from content script: isURLDisabled');
            const response = await browser.runtime.sendMessage({ type: "is-this-url-disabled", to: "background", url: url });
            console.debug("response:", response);
            return response.disabled;
        }
        async initUglyLinks() {
            console.log('Initializing UglyLinks');
            /// @ts-ignore
            browser.runtime.onMessage.addListener(async (message) => App.messageListener(message, this));
            console.debug('Listener added on Content Script');
            const url = window.location.host;
            console.debug(`Checking if "${url}" is disabled`);
            if (await App.isThisURLdisabled(url)) {
                console.debug('Current URL is disabled for UglyLinks');
                return false;
            }
            await App.uglifyAll();
            this.enableObserver();
            console.debug('UglyLinks Class initialized');
            return true;
        }
        disableObserver() {
            console.debug('Disabling mutation observer.');
            this.observer.disconnect();
        }
        enableObserver() {
            console.debug('Enabling mutation observer on document.');
            this.observer.observe(document, {
                childList: true,
                attributes: true,
                attributeFilter: ["href"],
                subtree: true
            });
        }
        static async messageListener(message, app) {
            console.debug('Receiving message:', message, app);
            switch (message.type) {
                case 'uglify': //Message received from background to uglify one url
                    let url = message.url;
                    const alreadyUglified = message.alreadyUglified;
                    await App.uglifyOne(url, alreadyUglified);
                    App.uglylinks = undefined; //in case of a page update, will force an update
                    break;
                case 'uglify_all':
                    await App.uglifyAll(Array.from(document.links));
                    break;
                case 'deuglify_all':
                    App.DeUglifyAll();
                    break;
                case 'toggle_ul': //Activate or deactivate uglylinks on this website
                    await app.toggleUglyLinks(message.otherParams.enabledOnThisWebsite, message.otherParams.links);
                    break;
                default:
                    console.warn('Message not recognized:', message);
            }
            return true;
        }
        async toggleUglyLinks(enabledOnThisWebsite, links) {
            if (enabledOnThisWebsite === undefined) {
                const url = window.location.host;
                enabledOnThisWebsite = !await App.isThisURLdisabled(url);
            }
            this.disableObserver();
            if (enabledOnThisWebsite) {
                await App.uglifyAll(Array.from(document.links), links);
                this.enableObserver();
            }
            else {
                App.DeUglifyAll();
            }
            return true;
        }
        static async onNodeInserted(E) {
            if (App.uglylinks == undefined)
                App.uglylinks = (await App.getUpdatedLinks()).links;
            await App.uglifyAll(E, App.uglylinks);
        }
        static async uglifyAll(l = Array.from(document.links), links) {
            if (links == undefined)
                links = (await App.getUpdatedLinks()).links;
            if (links && links.length == 0)
                return false;
            let cnt = 0;
            for (let i = 0; i < l.length; i++) {
                let e = l[i];
                const url = new URL(e.href, window.location.href); //TODO update storage in the end!
                if (!e.hasAttribute("data-UL_color") && links.includes(App.normalizeURL(url.href))) {
                    this.uglifyElement(e);
                    cnt++;
                }
            }
            let resp;
            if (cnt > 0)
                resp = await browser.runtime.sendMessage({
                    type: "uglified_count",
                    count: cnt
                });
            console.debug(`Uglified ${cnt}/${l.length} anchors. ${links.length} links in db.${resp ? ' Msg sent, resp:' : ''} `, resp);
            return true;
        }
        static DeUglifyAll() {
            let l = document.links;
            console.debug(`Proceeding to DeUglify all links in ${l.length} anchors`);
            for (let i = 0; i < l.length; i++) {
                let e = l[i];
                if (e.hasAttribute("data-UL_color")) {
                    App.deUglifyElement(e);
                }
            }
        }
        static normalizeURL(url, justHost = false) {
            let newUrl = url.replace(/(?:^https?:\/\/(?:www\.)?)|(?:^www\.)/i, '');
            if (justHost)
                newUrl = newUrl.split('/', 1)[0];
            return newUrl;
        }
        static async uglifyOne(url, alreadyUglified, baseURL = window.location.href) {
            console.debug(`${alreadyUglified ? 'Removing' : 'Adding'} uglification for ${url}`);
            const nUrl = App.normalizeURL(new URL(url, baseURL).href);
            const l = document.links;
            console.debug(`verifying ${l.length} elements`);
            for (let i = 0; i < l.length; i++) {
                let e = l[i];
                let element_url = App.normalizeURL(new URL(e.href, baseURL).href);
                if (element_url == nUrl)
                    if (alreadyUglified)
                        App.deUglifyElement(e);
                    else
                        App.uglifyElement(e);
            }
        }
        static uglifyElement(e, child = false) {
            e.setAttribute("data-UL_color", getComputedStyle(e, null).color || '');
            e.setAttribute("data-UL_backgroundColor", getComputedStyle(e, null).backgroundColor || '');
            e.setAttribute("data-UL_opacity", getComputedStyle(e, null).opacity || '');
            e.setAttribute("data-UL_textDecoration", getComputedStyle(e, null).textDecoration || '');
            e.style.color = 'red';
            e.style.backgroundColor = 'yellow';
            e.style.opacity = '0.5';
            e.style.textDecoration = 'line-through';
            if (!child)
                console.debug(`uglified ${e.href}`);
            for (let c of Array.from(e.children))
                this.uglifyElement(c, true);
            return true;
        }
        static deUglifyElement(e) {
            e.style.color = e.getAttribute("data-UL_color") || '';
            e.style.backgroundColor = e.getAttribute("data-UL_backgroundColor") || '';
            e.style.opacity = e.getAttribute("data-UL_opacity") || '';
            e.style.textDecoration = e.getAttribute("data-UL_textDecoration") || '';
            for (let c of Array.from(e.children))
                this.deUglifyElement(c);
            e.removeAttribute("data-UL_color");
            e.removeAttribute("data-UL_backgroundColor");
            e.removeAttribute("data-UL_opacity");
            e.removeAttribute("data-UL_textDecoration");
        }
    }
    App.uglylinks = undefined;
    return App;
})();
new App().initUglyLinks()
    .catch(reason => console.error("Error initializing content-script", reason));
