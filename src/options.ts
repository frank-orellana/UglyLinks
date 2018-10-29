// Copyright 2018  Franklin Orellana
// This file is part of UglyLinks.
// 
// UglyLinks is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// UglyLinks is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with UglyLinks.  If not, see <http://www.gnu.org/licenses/>. 
import { UglyLinks, i18n, LinkProps } from "./uglylinks_classes.js";
import Vue from 'vue';

const uglyLinks = new UglyLinks();

uglyLinks.init()
	.then(()=> {
		new Vue({		
		el : '#app',
		data : {
			i18n : i18n,
			ulApp: uglyLinks,
			links: new Array<LinkProps>(),
			disabledWebs : new Array<LinkProps>()
		},
		computed: {
		},
		methods:{
			removeOne: async function(idx:number){
				
				const url :string  = this.links[idx].url;
				console.log('removing uglylink:',idx,url);
				await uglyLinks.links.removeURL(url);
				
				this.links.splice(idx,1);
			},
			removeOneDW: async function(idx:number){
				
				const url :string  = this.disabledWebs[idx].url;
				console.log('removing disabled website:',idx,url);
				await uglyLinks.disabledWebsites.removeURL(url);
				
				this.disabledWebs.splice(idx,1);
			},
			removeAll: async (_ev:Event) => {
				let x :boolean = confirm(browser.i18n.getMessage('ConfirmRemoveAll'));
				if (x === true) 
					await uglyLinks.removeAllLinks();
				else 
					console.trace('Operation cancelled');
			},
			exportLinks: () => uglyLinks.export_links(),
			importLinks: function(){
				const fileElem : HTMLInputElement = document.getElementById("fileElem") as HTMLInputElement;
				if (fileElem) fileElem.click();
			},
			closeWindow:()=>window.close(),
			fileChange: (ev:Event) =>{
				const fileElem : HTMLInputElement = document.getElementById("fileElem") as HTMLInputElement;
				uglyLinks.importFile(ev, fileElem as HTMLInputElement);
			}
		},
		created: async function(){
			this.links = await uglyLinks.links.getLinksArray() || [];
			this.disabledWebs = await uglyLinks.disabledWebsites.getLinksArray() || [];
		}
	})

});