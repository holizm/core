import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    symlinkSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import getPartApiRolePath from './getPartApiRolePath.js'

test('part API role selection overrides the process role and validates its boundary', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'partRole'))
    const dependencyBase = path.join(directory, 'accounts/api')
    const processPath = path.join(directory, 'hotelOs/managerApi')
    const admin = path.join(dependencyBase, 'api/admin')
    const manager = path.join(dependencyBase, 'api/manager')
    const declaration = path.join(processPath, 'accounts')
    const params = {
        dependency: 'accounts',
        dependencyBase,
        processPath,
    }
    try {
        mkdirSync(admin, { recursive: true })
        mkdirSync(processPath, { recursive: true })
        assert.equal(getPartApiRolePath(params), null)
        mkdirSync(manager)
        assert.equal(getPartApiRolePath(params), manager)
        symlinkSync(admin, declaration)
        assert.equal(getPartApiRolePath(params), admin)
        rmSync(declaration)
        symlinkSync(processPath, declaration)
        assert.throws(() => getPartApiRolePath(params), /Invalid API role selection/)
        rmSync(declaration)
        symlinkSync(path.join(directory, 'missing'), declaration)
        assert.throws(() => getPartApiRolePath(params), { code: 'ENOENT' })
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
