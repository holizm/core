import { test } from 'node:test'
import assert from 'assert/strict'
import {
    deleteFile,
    replaceVariables,
} from '../../scripts/os.js'
import readDatabaseCompose from '../../scripts/readDatabaseCompose.js'

test('keeps persistent search data mounted when upgrading its database version', async () => {
    const composePath = `/tmp/searchCompose${process.pid}.yaml`
    replaceVariables(`${import.meta.dirname}/search`, composePath, {
        repo: 'searchValidation',
        searchDatabasePort: '7700',
    })
    try {
        const compose = await readDatabaseCompose({ composePath })
        const service = compose.services.search
        assert.equal(service.environment.MEILI_UPGRADE_DB, 'true')
        assert.ok(service.volumes.some(volume => volume.type === 'bind' && volume.target === '/meili_data'))
        assert.equal(service.restart, 'always')
    }
    finally {
        deleteFile(composePath)
    }
})
