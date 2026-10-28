import assert from 'assert/strict';
import {
    mock,
    test,
} from 'node:test';
const calls = [];
const names = ['createApiContainer', 'createCiCd', 'createDirectories', 'createMissingApiFiles', 'getApiUtilityDirectories', 'linkApiEditorFiles', 'mapApiCore', 'mapApiDependencies', 'mapApiProcesses', 'mapApiRunnable', 'mapApiUtilities', 'mapLocalizations', 'mapNode', 'mapRunnableSearchableProperties', 'mapSettings', 'mapSystemTenants', 'registerApiDatabaseTasks', 'removeRootOwnedDirectories'];
for (const name of names) mock.module(`./${name}.js`, {
    defaultExport: () => {
        calls.push(name);
        return [];
    }
});
mock.module('./isEtl.js', { defaultExport: () => false });
mock.module('./logger.js', {
    namedExports: {
        divide: () => {},
        info: () => {}
    }
});
mock.module('./timing.js', { namedExports: { measure: (name, action) => action() } });
const { default: startApi } = await import('./startApi.js');
test('API startup composes all mappings before joining volumes and starting backing services', () => {
    startApi({
        joinVolumes: () => calls.push('joinVolumes'),
        localBuild: false,
        process: 'adminApi',
        repo: 'hotelOs'
    });
    for (const name of names) assert.ok(calls.includes(name));
    assert.ok(calls.indexOf('mapApiDependencies') < calls.indexOf('joinVolumes'));
    assert.ok(calls.indexOf('mapApiCore') < calls.indexOf('joinVolumes'));
    assert.ok(calls.indexOf('joinVolumes') < calls.indexOf('registerApiDatabaseTasks'));
});
