import assert from 'assert/strict';
import {
    mock,
    test,
} from 'node:test';
const calls = [];
const record = name => (...rest) => {
    calls.push([name, ...rest]);
};
mock.module('./isControlRunnable.js', { defaultExport: () => false });
mock.module('./createDatabaseContainer.js', { defaultExport: record('database') });
mock.module('./createSearchDatabaseContainer.js', { defaultExport: record('search') });
mock.module('./os.js', {
    namedExports: {
        copyFileIfNotExists: record('copy'),
        createDirIfNotExists: record('directory'),
        createFileIfNotExists: record('file'),
        removeAndRecreateDir: record('recreate'),
        replaceVariables: record('replace'),
        writeFileIfNotExists: record('write')
    }
});
mock.module('./terminal.js', {
    namedExports: {
        runOnTerminal: () => '',
        runOnTerminalAsync: async () => 'running'
    }
});
const params = {
    addContainerStartupTask: record('startup'),
    addVolume: record('volume'),
    commonPath: '/tmp/compositionCommon',
    composeFile: '/tmp/compositionContainer.yaml',
    containerHome: '/tmp/compositionContainer',
    dependenciesPath: '/tmp/compositionDependencies',
    home: '/tmp/compositionHome',
    initialPath: '/tmp/compositionInitial.json',
    networkRepo: 'backing',
    nodeModules: '/tmp/compositionModules',
    privateSettingsPath: '/tmp/compositionPrivate.json',
    process: 'adminApi',
    publicSettingsPath: '/tmp/compositionPublic.json',
    repo: 'hotelOs',
    usesBackingInfrastructure: true
};
test('API composition keeps core mappings and backing-service ownership intact', async () => {
    for (const name of ['createMissingApiFiles', 'linkApiEditorFiles', 'mapApiCore', 'mapApiRunnable', 'createApiContainer', 'registerApiDatabaseTasks', 'ensureApiDatabaseContainer', 'ensureApiSearchDatabaseContainer']) {
        const { default: compose } = await import(`./${name}.js`);
        await compose(params);
    }
    assert.ok(calls.some(call => call[0] === 'volume' && call[1] === '/tmp/compositionHome/api/core/data'));
    assert.equal(calls.filter(call => call[0] === 'startup').length, 1);
    assert.ok(calls.some(call => call[0] === 'replace' && call[2] === params.composeFile));
    assert.ok(calls.some(call => call[0] === 'write' && call[1] === 'process.js'));
    assert.ok(calls.every(call => !JSON.stringify(call).includes('connectionStrings')));
});
