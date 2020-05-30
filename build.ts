/*import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';
 /* // */
const fs : any = require('fs');
const path : any = require('path');
const exec: any = require('child_process').exec;
// */
console.debug('Initializing build');

declare interface WebExtensionManifest {
    manifest_version: number;
    version: string;
    version_name?: string;
    name: string;
    default_locale?: string;
    description?: string;
    homepage_url?: string;
    icons?: {
        "16": string;
        "32": string;
        "48": string;
        "64": string;
    },
    content_scripts: Array<{
        matches: Array<string>,
        js: Array<string>
    }>,
    applications: {
        gecko: any
    }
}

const extensionDir : string = path.resolve(__dirname, 'extension');
const buildDir : string = path.resolve(__dirname, 'builds');
const tmpBuildDir : string = path.join(buildDir, 'temp');
const tmpDirFirefox : string = path.join(tmpBuildDir, 'firefox');
const tmpDirChrome  : string = path.join(tmpBuildDir, 'chrome');



let fileName :string = path.join(extensionDir, 'manifest.json');
console.debug("Reading original manifest file:", fileName)
let fileJson : WebExtensionManifest = require(fileName) as WebExtensionManifest;

updateBuildNumber(fileJson, fileName);

deleteFolderRecursive(tmpBuildDir);
/* Firefox */
copyFolderRecursiveSync(extensionDir, tmpDirFirefox, false);
const manifestFirefoxPath : string = path.join(tmpDirFirefox, 'manifest.json');
console.debug("Reading firefox manifest file:", fileName);
const manifestFirefox : WebExtensionManifest = require(manifestFirefoxPath) as WebExtensionManifest;
delete manifestFirefox.version_name;
manifestFirefox.content_scripts[0].js.splice(
    manifestFirefox.content_scripts[0].js.indexOf("js/lib/browser-polyfill.min.js"), 1);
writeJsonToFile(manifestFirefox, path.join(tmpDirFirefox, "manifest.json"));

const browserPolifillRE : RegExp = 
    /<script +(?:defer)? ?src *= *"..\/js\/lib\/browser-polyfill.min.js" *><\/script>\n?/i;
replaceInFile(path.join(tmpDirFirefox, 'html', 'background.html'), browserPolifillRE, '');
replaceInFile(path.join(tmpDirFirefox, 'html', 'options.html'), browserPolifillRE, '');
replaceInFile(path.join(tmpDirFirefox, 'html', 'popup.html'), browserPolifillRE, '');
fs.unlinkSync(path.join(tmpDirFirefox, 'js', 'lib', "browser-polyfill.min.js"));

const zippedFFExtFullPath: string = path.join(buildDir, "UglyLinks-firefox-latest.zip");
(async  () => {
    await zipExtensions(tmpDirFirefox, zippedFFExtFullPath);
    fs.copyFileSync(zippedFFExtFullPath, zippedFFExtFullPath.replace('latest', fileJson.version));
})()
.then(() => console.log('Firefox build success'))
.catch((err) => console.error('Firefox build error',err));

/*Chrome*/
copyFolderRecursiveSync(extensionDir, tmpDirChrome, false);
delete fileJson.applications;
writeJsonToFile(fileJson, path.join(tmpDirChrome, "manifest.json"));
const zippedCHromeExtFullPath: string = path.join(buildDir, "UglyLinks-chrome-latest.zip");
(async () => {
    await zipExtensions(tmpDirChrome, zippedCHromeExtFullPath);
    fs.copyFileSync(zippedCHromeExtFullPath, zippedCHromeExtFullPath.replace('latest', fileJson.version));
})()
.then(() => console.log('Chrome build success'))
.catch((err) => console.error('Chrome build error',err));

async function zipExtensions(sourceDir: string, destFileName: string) {
    return new Promise((resolve, reject) => {
        const isWindows: boolean = process.platform.substr(0, 3) === 'win';

        if (isWindows) {
            const s7zPath: string = path.join(process.env.PROGRAMFILES, "7-Zip", "7z.exe")
            if (fs.existsSync(s7zPath)) {
                const command: string = "\"" + s7zPath + "\"" + " a " + "\"" + destFileName
                    + "\"" + " " + "\"" + path.join(sourceDir, "*") + "\"";

                exec(command, function callback(error: string) {
                    if (error) {
                        console.error('Error while zipping files, command:', command, error);
                        reject(false);
                    }
                    console.debug("zipped", destFileName);
                    resolve(true);
                });
            } else {
                console.warn("7-zip not installed not installed on default path.")
                console.error("Cannot zip extensions. You will have to do it manually")
                reject();
            }
        } else {
            console.log("Not on windows");
            console.error("Cannot zip extensions. You will have to do it manually");
            reject();
        }
    });
}



function writeJsonToFile(jsonFile: WebExtensionManifest, destFile: string) {
    console.log('writing to ', destFile);
    try {
        fs.writeFileSync(destFile, JSON.stringify(jsonFile, null, 2));
    } catch (err) {
        console.error(JSON.stringify(jsonFile, null, 2));
        return console.error(err);
    }
}

function updateBuildNumber(jsonFile: WebExtensionManifest, destFile: string) {
    const arrayVersion: Array<string> = jsonFile.version.split(".", 4);
    let newBuildNumber: string = (Number.parseInt(arrayVersion[3]) + 1).toString();
    arrayVersion[3] = newBuildNumber;
    jsonFile.version = arrayVersion.join(".");

    console.log('upgrading build number to ', newBuildNumber, 'version=>', jsonFile.version);

    writeJsonToFile(jsonFile, destFile);
    return true;
}

function copyFileSync(source: string, target: string) {
    let targetFile :string = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target))
        if (fs.lstatSync(target).isDirectory())
            targetFile = path.join(target, path.basename(source));

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source: string, target: string, copyFolderBaseName: boolean = true) {

    const targetFolder : string = copyFolderBaseName ? path.join(target, path.basename(source)) : target;
    if (!fs.existsSync(targetFolder))
        fs.mkdirSync(targetFolder, { recursive: true });

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        const files : string[] = fs.readdirSync(source);
        files.forEach(function (file: string) {
            const curSource : string = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

function deleteFolderRecursive(pPath: string) {
    if (fs.existsSync(pPath)) {
        const files : string[] = fs.readdirSync(pPath);
        files.forEach(function (file: string) {
            const curPath : string = path.join(pPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else  // delete file
                fs.unlinkSync(curPath);
        });
        fs.rmdirSync(pPath);
    }
};


function replaceInFile(path: string, original: string | RegExp, newText: string) {
    try {
        const result: string = fs.readFileSync(path, 'utf8').replace(original, newText);

        fs.writeFileSync(path, result, 'utf8');
        return console.debug('text replaced in file ' + path);
    } catch (e) {
        return console.error(e);
    }
}