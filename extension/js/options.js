// Copyright 2018  Franklin Orellana
// This file is part of UglyLinks.
// 
// UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 
import { UglyLinks, i18n } from "./uglylinks_classes.js";

const uglyLinks = new UglyLinks();
uglyLinks.init()
    .then(() => {
    new Vue({
        el: '#app',
        data: {
            i18n: i18n,
            ulApp: uglyLinks,
            links: new Array(),
            disabledWebs: new Array()
        },
        computed: {},
        methods: {
            removeOne: async function (idx) {
                const url = this.links[idx].url;
                console.log('removing uglylink:', idx, url);
                await uglyLinks.links.removeURL(url);
                this.links.splice(idx, 1);
            },
            removeOneDW: async function (idx) {
                const url = this.disabledWebs[idx].url;
                console.log('removing disabled website:', idx, url);
                await uglyLinks.disabledWebsites.removeURL(url);
                this.disabledWebs.splice(idx, 1);
            },
            removeAll: async function (_ev) {
                let x = confirm(browser.i18n.getMessage('ConfirmRemoveAll'));
                if (x === true) {
                    await uglyLinks.removeAllLinks();
                    await this.refreshUglifiedLinks();
                }
                else
                    console.trace('Operation cancelled');
            },
            exportLinks: () => uglyLinks.export_links(),
            importLinks: function () {
                const fileElem = document.getElementById("fileElem");
                if (fileElem)
                    fileElem.click();
            },
            closeWindow: () => window.close(),
            fileChange: async function (ev) {
                const fileElem = document.getElementById("fileElem");
                await uglyLinks.importFile(ev, fileElem);
                await this.refreshUglifiedLinks();
            },
            refreshUglifiedLinks: async function () {
                this.links = await uglyLinks.links.getLinksArray() || [];
            }
        },
        created: async function () {
            await this.refreshUglifiedLinks();
            this.disabledWebs = await uglyLinks.disabledWebsites.getLinksArray() || [];
        }
    });
});
