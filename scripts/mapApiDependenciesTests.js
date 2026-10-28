import assert from 'assert/strict';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import test from 'node:test';
import mapApiDependencies from './mapApiDependencies.js';
test('a runnable reference file cannot hide a standalone dependency part', t => {
    const home = fs.mkdtempSync(path.join(tmpdir(), 'apiDependencies'));
    t.after(() => fs.rmSync(home, {
        force: true,
        recursive: true
    }));
    const processPath = path.join(home, 'hotelOs/adminApi');
    for (const directory of ['hotelOs/adminApi', 'tasks/api/api/admin', 'tasks/api/business', 'hotelOs/rooms/api/api/admin']) fs.mkdirSync(path.join(home, directory), { recursive: true });
    fs.writeFileSync(path.join(home, 'hotelOs/tasks'), 'Existing reference');
    fs.writeFileSync(path.join(home, 'tasks/part'), 'task\n    title\n');
    fs.writeFileSync(path.join(home, 'hotelOs/rooms/part'), 'room\n    number\n');
    const volumes = [];
    mapApiDependencies({
        addVolume: (source, target) => volumes.push([source, target]),
        containerHome: home,
        dependencies: ['rooms', 'tasks'],
        home,
        isControl: false,
        nodeModules: path.join(processPath, 'node_modules'),
        org: 'holizm',
        process: 'adminApi',
        processPath,
        repo: 'hotelOs'
    });
    assert.ok(volumes.some(([source, target]) => source === path.join(home, 'tasks/part') && target.endsWith('/node_modules/tasks/part')));
    assert.ok(volumes.some(([source]) => source === path.join(home, 'tasks/api/api/admin')));
    assert.ok(volumes.some(([source]) => source === path.join(home, 'hotelOs/rooms/part')));
    assert.equal(volumes.some(([source]) => source.startsWith(path.join(home, 'hotelOs/tasks/'))), false);
});
