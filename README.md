# UglyLinks
Uglify links you don't like

To edit, download to a folder and move to it. Then execute:

````
npm install -g typescript
npm install
npm run buildw
````

This will:
1. Install typescript and globally
2. Update `node_modules` and: 
3. Build the project into the `/extension/` folder you can open that folder extension from the browser. Also any changes made to a typescript file will be monitored and compiled .

Then you can edit files in the ./src folder (typescript sources), and it will automatically compile into the extension/js folder

To Build Extensions Packed files:
npm run build-zip

This will:
1. create a temp folder builds\temp 
2. create folders for firefox and chrome files
3. copy and modify the files accordingly
4. zip the files and let them in the builds folder (you need to have 7-zip installed or you will have to compress them manually)

To test:
Firefox:
Option 1:
    Go to url about:addons
    Options -> Debug Addons
    Load Temporary Addon
Go to the project folder/webextension and select the manifest.json file

Option 2:


