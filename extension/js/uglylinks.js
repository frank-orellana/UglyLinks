/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/uglylinks.webpack.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/uglylinks.webpack.ts":
/*!**********************************!*\
  !*** ./src/uglylinks.webpack.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* Copyright 2018  Franklin Orellana
This file is part of UglyLinks.

UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>.
*/
/// <references type='web-ext-types' />
console.debug('uglylinks Content Script Loading!');
class App {
    constructor() {
        this._self = this;
        this.observer = new MutationObserver(function (mutations) {
            let uglyLinks; // = (await App.getUpdatedLinks()).links;
            mutations.forEach(async (mutation) => {
                if (mutation.type == 'childList') {
                    if (mutation.addedNodes.length > 0) {
                        let lnks = [];
                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                            let e = mutation.addedNodes[i];
                            if (e.nodeType != Node.TEXT_NODE) {
                                const e1 = e;
                                if (e1.tagName == 'A') {
                                    lnks = lnks.concat(e1);
                                }
                                else {
                                    lnks = lnks.concat(Array.from(e1.getElementsByTagName('A')));
                                }
                            }
                        }
                        if (lnks.length > 0) {
                            if (!uglyLinks)
                                uglyLinks = (await App.getUpdatedLinks()).links;
                            App.onNodeInserted(lnks, uglyLinks);
                        }
                    }
                }
                else if (mutation.type == 'attributes') {
                    //console.trace('attributes:', mutation.target, mutation.attributeName);
                    if (mutation.attributeName && mutation.attributeName.toLocaleUpperCase() === 'HREF') {
                        if (!uglyLinks)
                            uglyLinks = (await App.getUpdatedLinks()).links;
                        App.onNodeInserted([mutation.target], uglyLinks);
                    }
                }
            });
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
        browser.runtime.onMessage.addListener((message) => App.messageListener(message, this));
        console.debug('Listener added on Content Script');
        console.debug('UglyLinks Class initialized');
        const url = window.location.host;
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
    static async messageListener(message, app) {
        console.debug('Receiving message:', message, app);
        switch (message.type) {
            case 'uglify':
                let url = message.url;
                const alreadyUglified = message.alreadyUglified;
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
    static onNodeInserted(E, uglyLinks) {
        const timeout_ms = 100;
        if (!App.ul_uglifyall_timeout) {
            console.debug(`dom changed... setting timeout to ${timeout_ms}ms`);
            App.ul_uglifyall_timeout = setTimeout(() => App.uglifyAll(E, uglyLinks), timeout_ms);
        }
    }
    //TODO: correct this! what's links default value? pass it always? yes!
    static async uglifyAll(l = Array.from(document.links), links) {
        if (links == undefined)
            links = (await App.getUpdatedLinks()).links;
        console.debug(`Proceeding to uglify ${links.length} links in ${l.length} anchors`);
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
        e.style.color = e.getAttribute("data-UL_color");
        e.style.backgroundColor = e.getAttribute("data-UL_backgroundColor");
        e.style.opacity = e.getAttribute("data-UL_opacity");
        e.style.textDecoration = e.getAttribute("data-UL_textDecoration");
        for (let c of Array.from(e.children))
            this.deUglifyElement(c);
        e.removeAttribute("data-UL_color");
        e.removeAttribute("data-UL_backgroundColor");
        e.removeAttribute("data-UL_opacity");
        e.removeAttribute("data-UL_textDecoration");
    }
}
(async () => {
    console.log('initializing!!!!!!!');
    await new App().initUglyLinks();
    console.log('initialized!!!!!!!');
})();


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL3VnbHlsaW5rcy53ZWJwYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRmE7QUFDYjtBQUNBOztBQUVBO0FBQ0Esc0ZBQXNGO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsZ0NBQWdDO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCwwRUFBMEU7QUFDdEk7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCwyREFBMkQ7QUFDdkg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsSUFBSTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrREFBK0QsV0FBVztBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxhQUFhLFlBQVksU0FBUztBQUNoRjtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsY0FBYztBQUNyQztBQUNBLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLElBQUk7QUFDdEMsNEJBQTRCLG9DQUFvQztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQsU0FBUztBQUN0RSx1QkFBdUIsY0FBYztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5Qix3Q0FBd0Msb0JBQW9CLElBQUk7QUFDekY7QUFDQTtBQUNBLG1DQUFtQyxTQUFTO0FBQzVDLHVCQUF1QixjQUFjO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyIsImZpbGUiOiJ1Z2x5bGlua3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy91Z2x5bGlua3Mud2VicGFjay50c1wiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xyXG4vKiBDb3B5cmlnaHQgMjAxOCAgRnJhbmtsaW4gT3JlbGxhbmFcclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgVWdseUxpbmtzLlxyXG5cclxuVWdseUxpbmtzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3IgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuVWdseUxpbmtzIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCBVZ2x5TGlua3MuICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcbi8vLyA8cmVmZXJlbmNlcyB0eXBlPSd3ZWItZXh0LXR5cGVzJyAvPlxyXG5jb25zb2xlLmRlYnVnKCd1Z2x5bGlua3MgQ29udGVudCBTY3JpcHQgTG9hZGluZyEnKTtcclxuY2xhc3MgQXBwIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX3NlbGYgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAobXV0YXRpb25zKSB7XHJcbiAgICAgICAgICAgIGxldCB1Z2x5TGlua3M7IC8vID0gKGF3YWl0IEFwcC5nZXRVcGRhdGVkTGlua3MoKSkubGlua3M7XHJcbiAgICAgICAgICAgIG11dGF0aW9ucy5mb3JFYWNoKGFzeW5jIChtdXRhdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT0gJ2NoaWxkTGlzdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXV0YXRpb24uYWRkZWROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsbmtzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbXV0YXRpb24uYWRkZWROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGUgPSBtdXRhdGlvbi5hZGRlZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUubm9kZVR5cGUgIT0gTm9kZS5URVhUX05PREUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlMSA9IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUxLnRhZ05hbWUgPT0gJ0EnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxua3MgPSBsbmtzLmNvbmNhdChlMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsbmtzID0gbG5rcy5jb25jYXQoQXJyYXkuZnJvbShlMS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnQScpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsbmtzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdWdseUxpbmtzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVnbHlMaW5rcyA9IChhd2FpdCBBcHAuZ2V0VXBkYXRlZExpbmtzKCkpLmxpbmtzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwLm9uTm9kZUluc2VydGVkKGxua3MsIHVnbHlMaW5rcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtdXRhdGlvbi50eXBlID09ICdhdHRyaWJ1dGVzJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS50cmFjZSgnYXR0cmlidXRlczonLCBtdXRhdGlvbi50YXJnZXQsIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtdXRhdGlvbi5hdHRyaWJ1dGVOYW1lICYmIG11dGF0aW9uLmF0dHJpYnV0ZU5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSA9PT0gJ0hSRUYnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdWdseUxpbmtzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWdseUxpbmtzID0gKGF3YWl0IEFwcC5nZXRVcGRhdGVkTGlua3MoKSkubGlua3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEFwcC5vbk5vZGVJbnNlcnRlZChbbXV0YXRpb24udGFyZ2V0XSwgdWdseUxpbmtzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGFzeW5jIGdldFVwZGF0ZWRMaW5rcygpIHtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdzZW5kaW5nIG1lc3NhZ2UgZnJvbSBjb250ZW50IHNjcmlwdDogZ2V0LWxpbmtzJyk7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiBcImdldC1saW5rc1wiLCB0bzogXCJiYWNrZ3JvdW5kXCIsIG1zZzogXCJtZXNzYWdlIGZyb20gY29udGVudCBzY3JpcHRcIiB9KTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwicmVzcG9uc2U6XCIsIHJlc3BvbnNlKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgYXN5bmMgaXNUaGlzVVJMZGlzYWJsZWQodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1Zygnc2VuZGluZyBtZXNzYWdlIGZyb20gY29udGVudCBzY3JpcHQ6IGlzVVJMRGlzYWJsZWQnKTtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6IFwiaXMtdGhpcy11cmwtZGlzYWJsZWRcIiwgdG86IFwiYmFja2dyb3VuZFwiLCB1cmw6IHVybCB9KTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwicmVzcG9uc2U6XCIsIHJlc3BvbnNlKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGlzYWJsZWQ7XHJcbiAgICB9XHJcbiAgICBhc3luYyBpbml0VWdseUxpbmtzKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgVWdseUxpbmtzJyk7XHJcbiAgICAgICAgLy8vIEB0cy1pZ25vcmVcclxuICAgICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlKSA9PiBBcHAubWVzc2FnZUxpc3RlbmVyKG1lc3NhZ2UsIHRoaXMpKTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdMaXN0ZW5lciBhZGRlZCBvbiBDb250ZW50IFNjcmlwdCcpO1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1VnbHlMaW5rcyBDbGFzcyBpbml0aWFsaXplZCcpO1xyXG4gICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoYENoZWNraW5nIGlmIFwiJHt1cmx9XCIgaXMgZGlzYWJsZWRgKTtcclxuICAgICAgICBpZiAoYXdhaXQgQXBwLmlzVGhpc1VSTGRpc2FibGVkKHVybCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQ3VycmVudCBVUkwgaXMgZGlzYWJsZWQgZm9yIFVnbHlMaW5rcycpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IEFwcC51Z2xpZnlBbGwoKTtcclxuICAgICAgICB0aGlzLmVuYWJsZU9ic2VydmVyKCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBkaXNhYmxlT2JzZXJ2ZXIoKSB7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlci5kaXNjb25uZWN0KCk7XHJcbiAgICB9XHJcbiAgICBlbmFibGVPYnNlcnZlcigpIHtcclxuICAgICAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHtcclxuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IFtcImhyZWZcIl0sXHJcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBhc3luYyBtZXNzYWdlTGlzdGVuZXIobWVzc2FnZSwgYXBwKSB7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjZWl2aW5nIG1lc3NhZ2U6JywgbWVzc2FnZSwgYXBwKTtcclxuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICd1Z2xpZnknOlxyXG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IG1lc3NhZ2UudXJsO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxyZWFkeVVnbGlmaWVkID0gbWVzc2FnZS5hbHJlYWR5VWdsaWZpZWQ7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBBcHAudWdsaWZ5T25lKHVybCwgYWxyZWFkeVVnbGlmaWVkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd1Z2xpZnlfYWxsJzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEFwcC51Z2xpZnlBbGwoQXJyYXkuZnJvbShkb2N1bWVudC5saW5rcykpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2RldWdsaWZ5X2FsbCc6XHJcbiAgICAgICAgICAgICAgICBBcHAuRGVVZ2xpZnlBbGwoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd0b2dnbGVfdWwnOlxyXG4gICAgICAgICAgICAgICAgYXBwLnRvZ2dsZVVnbHlMaW5rcyhtZXNzYWdlLm90aGVyUGFyYW1zLmVuYWJsZWRPblRoaXNXZWJzaXRlLCBtZXNzYWdlLm90aGVyUGFyYW1zLmxpbmtzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdNZXNzYWdlIG5vdCByZWNvZ25pemVkOicsIG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGFzeW5jIHRvZ2dsZVVnbHlMaW5rcyhlbmFibGVkT25UaGlzV2Vic2l0ZSwgbGlua3MpIHtcclxuICAgICAgICBpZiAoZW5hYmxlZE9uVGhpc1dlYnNpdGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcclxuICAgICAgICAgICAgZW5hYmxlZE9uVGhpc1dlYnNpdGUgPSAhYXdhaXQgQXBwLmlzVGhpc1VSTGRpc2FibGVkKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGlzYWJsZU9ic2VydmVyKCk7XHJcbiAgICAgICAgaWYgKGVuYWJsZWRPblRoaXNXZWJzaXRlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IEFwcC51Z2xpZnlBbGwoQXJyYXkuZnJvbShkb2N1bWVudC5saW5rcyksIGxpbmtzKTtcclxuICAgICAgICAgICAgdGhpcy5lbmFibGVPYnNlcnZlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQXBwLkRlVWdsaWZ5QWxsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIG9uTm9kZUluc2VydGVkKEUsIHVnbHlMaW5rcykge1xyXG4gICAgICAgIGNvbnN0IHRpbWVvdXRfbXMgPSAxMDA7XHJcbiAgICAgICAgaWYgKCFBcHAudWxfdWdsaWZ5YWxsX3RpbWVvdXQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgZG9tIGNoYW5nZWQuLi4gc2V0dGluZyB0aW1lb3V0IHRvICR7dGltZW91dF9tc31tc2ApO1xyXG4gICAgICAgICAgICBBcHAudWxfdWdsaWZ5YWxsX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IEFwcC51Z2xpZnlBbGwoRSwgdWdseUxpbmtzKSwgdGltZW91dF9tcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9UT0RPOiBjb3JyZWN0IHRoaXMhIHdoYXQncyBsaW5rcyBkZWZhdWx0IHZhbHVlPyBwYXNzIGl0IGFsd2F5cz8geWVzIVxyXG4gICAgc3RhdGljIGFzeW5jIHVnbGlmeUFsbChsID0gQXJyYXkuZnJvbShkb2N1bWVudC5saW5rcyksIGxpbmtzKSB7XHJcbiAgICAgICAgaWYgKGxpbmtzID09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgbGlua3MgPSAoYXdhaXQgQXBwLmdldFVwZGF0ZWRMaW5rcygpKS5saW5rcztcclxuICAgICAgICBjb25zb2xlLmRlYnVnKGBQcm9jZWVkaW5nIHRvIHVnbGlmeSAke2xpbmtzLmxlbmd0aH0gbGlua3MgaW4gJHtsLmxlbmd0aH0gYW5jaG9yc2ApO1xyXG4gICAgICAgIGlmIChsaW5rcyAmJiBsaW5rcy5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGxldCBjbnQgPSAwO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZSA9IGxbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoZS5ocmVmLCB3aW5kb3cubG9jYXRpb24uaHJlZik7IC8vVE9ETyB1cGRhdGUgc3RvcmFnZSBpbiB0aGUgZW5kIVxyXG4gICAgICAgICAgICBpZiAoIWUuaGFzQXR0cmlidXRlKFwiZGF0YS1VTF9jb2xvclwiKSAmJiBsaW5rcy5pbmNsdWRlcyhBcHAubm9ybWFsaXplVVJMKHVybC5ocmVmKSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudWdsaWZ5RWxlbWVudChlKTtcclxuICAgICAgICAgICAgICAgIGNudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoYFVnbGlmaWVkICR7Y250fSBhbmNob3JzYCk7XHJcbiAgICAgICAgYnJvd3Nlci50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pXHJcbiAgICAgICAgICAgIC50aGVuKCh0YWJzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0YWJzWzBdICE9IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGFic1swXS5pZCA9PSAnbnVtYmVyJylcclxuICAgICAgICAgICAgICAgIGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWJzWzBdLmlkIHx8IDAsIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInVnbGlmaWVkX2NvdW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGNudCB8fCAwXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdubyBhY3RpdmUgdGFiJyk7XHJcbiAgICAgICAgfSkudGhlbigodmFsKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ291bnQgbWVzc2FnZSBzZW50LiBhbnN3ZXIgcmVjZWl2ZWQ6XCIsIHZhbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgRGVVZ2xpZnlBbGwoKSB7XHJcbiAgICAgICAgbGV0IGwgPSBkb2N1bWVudC5saW5rcztcclxuICAgICAgICBjb25zb2xlLmRlYnVnKGBQcm9jZWVkaW5nIHRvIERlVWdsaWZ5IGFsbCBsaW5rcyBpbiAke2wubGVuZ3RofSBhbmNob3JzYCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlID0gbFtpXTtcclxuICAgICAgICAgICAgaWYgKGUuaGFzQXR0cmlidXRlKFwiZGF0YS1VTF9jb2xvclwiKSkge1xyXG4gICAgICAgICAgICAgICAgQXBwLmRlVWdsaWZ5RWxlbWVudChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyBub3JtYWxpemVVUkwodXJsLCBqdXN0SG9zdCA9IGZhbHNlKSB7XHJcbiAgICAgICAgbGV0IG5ld1VybCA9IHVybC5yZXBsYWNlKC8oPzpeaHR0cHM/OlxcL1xcLyg/Ond3d1xcLik/KXwoPzped3d3XFwuKS9pLCAnJyk7XHJcbiAgICAgICAgaWYgKGp1c3RIb3N0KVxyXG4gICAgICAgICAgICBuZXdVcmwgPSBuZXdVcmwuc3BsaXQoJy8nLCAxKVswXTtcclxuICAgICAgICByZXR1cm4gbmV3VXJsO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGFzeW5jIHVnbGlmeU9uZSh1cmwsIGFscmVhZHlVZ2xpZmllZCwgYmFzZVVSTCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhgJHthbHJlYWR5VWdsaWZpZWQgPyAnUmVtb3ZpbmcnIDogJ0FkZGluZyd9IHVnbGlmaWNhdGlvbiBmb3IgJHt1cmx9YCk7XHJcbiAgICAgICAgY29uc3QgblVybCA9IEFwcC5ub3JtYWxpemVVUkwobmV3IFVSTCh1cmwsIGJhc2VVUkwpLmhyZWYpO1xyXG4gICAgICAgIGNvbnN0IGwgPSBkb2N1bWVudC5saW5rcztcclxuICAgICAgICBjb25zb2xlLmRlYnVnKGB2ZXJpZnlpbmcgJHtsLmxlbmd0aH0gZWxlbWVudHNgKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGwubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGUgPSBsW2ldO1xyXG4gICAgICAgICAgICBsZXQgZWxlbWVudF91cmwgPSBBcHAubm9ybWFsaXplVVJMKG5ldyBVUkwoZS5ocmVmLCBiYXNlVVJMKS5ocmVmKTtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnRfdXJsID09IG5VcmwpXHJcbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeVVnbGlmaWVkKVxyXG4gICAgICAgICAgICAgICAgICAgIEFwcC5kZVVnbGlmeUVsZW1lbnQoZSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgQXBwLnVnbGlmeUVsZW1lbnQoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc3RhdGljIHVnbGlmeUVsZW1lbnQoZSwgY2hpbGQgPSBmYWxzZSkge1xyXG4gICAgICAgIGUuc2V0QXR0cmlidXRlKFwiZGF0YS1VTF9jb2xvclwiLCBnZXRDb21wdXRlZFN0eWxlKGUsIG51bGwpLmNvbG9yIHx8ICcnKTtcclxuICAgICAgICBlLnNldEF0dHJpYnV0ZShcImRhdGEtVUxfYmFja2dyb3VuZENvbG9yXCIsIGdldENvbXB1dGVkU3R5bGUoZSwgbnVsbCkuYmFja2dyb3VuZENvbG9yIHx8ICcnKTtcclxuICAgICAgICBlLnNldEF0dHJpYnV0ZShcImRhdGEtVUxfb3BhY2l0eVwiLCBnZXRDb21wdXRlZFN0eWxlKGUsIG51bGwpLm9wYWNpdHkgfHwgJycpO1xyXG4gICAgICAgIGUuc2V0QXR0cmlidXRlKFwiZGF0YS1VTF90ZXh0RGVjb3JhdGlvblwiLCBnZXRDb21wdXRlZFN0eWxlKGUsIG51bGwpLnRleHREZWNvcmF0aW9uIHx8ICcnKTtcclxuICAgICAgICBlLnN0eWxlLmNvbG9yID0gJ3JlZCc7XHJcbiAgICAgICAgZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAneWVsbG93JztcclxuICAgICAgICBlLnN0eWxlLm9wYWNpdHkgPSAnMC41JztcclxuICAgICAgICBlLnN0eWxlLnRleHREZWNvcmF0aW9uID0gJ2xpbmUtdGhyb3VnaCc7XHJcbiAgICAgICAgaWYgKCFjaGlsZClcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgdWdsaWZpZWQgJHtlLmhyZWZ9YCk7XHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBBcnJheS5mcm9tKGUuY2hpbGRyZW4pKVxyXG4gICAgICAgICAgICB0aGlzLnVnbGlmeUVsZW1lbnQoYywgdHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZGVVZ2xpZnlFbGVtZW50KGUpIHtcclxuICAgICAgICBlLnN0eWxlLmNvbG9yID0gZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLVVMX2NvbG9yXCIpO1xyXG4gICAgICAgIGUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLVVMX2JhY2tncm91bmRDb2xvclwiKTtcclxuICAgICAgICBlLnN0eWxlLm9wYWNpdHkgPSBlLmdldEF0dHJpYnV0ZShcImRhdGEtVUxfb3BhY2l0eVwiKTtcclxuICAgICAgICBlLnN0eWxlLnRleHREZWNvcmF0aW9uID0gZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLVVMX3RleHREZWNvcmF0aW9uXCIpO1xyXG4gICAgICAgIGZvciAobGV0IGMgb2YgQXJyYXkuZnJvbShlLmNoaWxkcmVuKSlcclxuICAgICAgICAgICAgdGhpcy5kZVVnbGlmeUVsZW1lbnQoYyk7XHJcbiAgICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLVVMX2NvbG9yXCIpO1xyXG4gICAgICAgIGUucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1VTF9iYWNrZ3JvdW5kQ29sb3JcIik7XHJcbiAgICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLVVMX29wYWNpdHlcIik7XHJcbiAgICAgICAgZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLVVMX3RleHREZWNvcmF0aW9uXCIpO1xyXG4gICAgfVxyXG59XHJcbihhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnaW5pdGlhbGl6aW5nISEhISEhIScpO1xyXG4gICAgYXdhaXQgbmV3IEFwcCgpLmluaXRVZ2x5TGlua3MoKTtcclxuICAgIGNvbnNvbGUubG9nKCdpbml0aWFsaXplZCEhISEhISEnKTtcclxufSkoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIifQ==