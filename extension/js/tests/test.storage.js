import { UglyLinks } from '../uglylinks_classes.js';
describe('Mocha', function () {
    describe('working', function () {
        it('ok', function () {
            chai.expect(1).to.equal(1);
        });
    });
});
const test_db_name = 'test-uglylinks-db';
const ulApp = new UglyLinks();
describe('Uglylinks', () => {
    describe('Initialization', () => {
        it('Storage initialized', async () => {
            await ulApp.init({ dbName: test_db_name });
            chai.expect(ulApp.links.storage).not.undefined;
        });
    });
    describe('Database initalized', () => {
        it('Database should not be undefined', () => {
            chai.expect(ulApp.links.storage.db).not.undefined;
        });
    });
    describe('Tables created', () => {
        it('Tables created', async () => {
            const db = ulApp.links.storage.db;
            chai.expect(db ? db.objectStoreNames.contains('uglyfied_links') : false).equal(true);
        });
    });
    describe('Insertion test', () => {
        const testURLs = ['test1.test', 'test2.test', 'test3.test', 'test4.test'];
        it('Links inserted', async () => {
            await ulApp.removeAllLinks();
            for (let lnk in testURLs) {
                chai.expect(await ulApp.links.addURL(lnk)).eq(true);
            }
            chai.expect(await ulApp.links.size, 'Size of links should be ' + testURLs.length)
                .eq(testURLs.length);
            for (let lnk in testURLs) {
                chai.expect(await ulApp.links.hasURL(lnk)).eq(true);
            }
        });
    });
    describe('Removal test', () => {
        it('Links removed', async () => {
            const currentCount = await ulApp.links.size;
            chai.expect(currentCount).greaterThan(0);
            const arr = await ulApp.links.getLinksArray() || [];
            chai.expect(await ulApp.toggleURL(arr[0].url)).eq(false);
            chai.expect(await ulApp.links.size, 'Size of links should be reduced after removing one url')
                .eq(currentCount - 1);
            await ulApp.removeAllLinks();
            chai.expect(await ulApp.links.size, 'Size of links should be 0')
                .eq(0);
        });
    });
});
describe('IndexedDBRemoval', async () => {
    describe('IndexedDB Removed', () => {
        it('ok', async () => {
            ulApp.storage.db.close();
            chai.expect(await idb.delete(test_db_name)).undefined;
        });
    });
});
