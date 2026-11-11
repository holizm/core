import assert from 'assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import {
    fileURLToPath,
    pathToFileURL,
} from 'url';
import { runOnTerminalAsync } from '../../scripts/terminal.js';
const generator = fileURLToPath(new URL('./generateExports.js', import.meta.url));
test('generated public exports remain importable after deployment relocation', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'publicExports'));
    const source = path.join(directory, 'source');
    const target = path.join(directory, 'published');
    const root = path.join(source, 'sample/siteApi/node_modules/geo');
    const business = path.join(root, 'business/location');
    await fs.mkdir(business, { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await fs.writeFile(path.join(business, 'extendListParameters.js'), 'export const location = true\n');
    await fs.writeFile(path.join(business, 'getLocation.js'), `export default () => 'Location'\n`);
    await fs.writeFile(path.join(business, 'extendListParametersTests.js'), 'throw new Error()\n');
    for (const scope of ['testing', 'integrationTests']) {
        await fs.mkdir(path.join(root, scope));
        await fs.writeFile(path.join(root, scope, 'mockProvider.js'), 'export const leakedMock = true\n');
    }
    const actualRoot = path.join(source, 'parts/geo');
    await fs.mkdir(path.dirname(actualRoot), { recursive: true });
    await fs.rename(root, actualRoot);
    await fs.symlink(path.relative(path.dirname(root), actualRoot), root);
    await fs.symlink(path.relative(path.dirname(actualRoot), path.dirname(root)), path.join(source, 'parts/node_modules'));
    try {
        await runOnTerminalAsync(`'${process.execPath}' '${generator}' geo`, {
            env: {
                ...process.env,
                containerHome: source,
                process: 'siteApi',
                repo: 'sample'
            },
            throwOnError: true
        });
        const exports = await fs.readFile(path.join(root, 'exports.js'), 'utf8');
        assert.equal(exports.includes(source), false);
        assert.ok(exports.includes(`'./business/location/extendListParameters.js'`));
        assert.equal(exports.includes('Tests.js'), false);
        assert.equal(exports.includes('mockProvider'), false);
        await fs.rename(source, target);
        const published = path.join(target, 'sample/siteApi/node_modules/geo/exports.js');
        const module = await import(pathToFileURL(published));
        assert.equal(module.getLocation(), 'Location');
    } finally {
        await fs.rm(directory, {
            force: true,
            recursive: true
        });
    }
});
