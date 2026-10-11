import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import replaceVariables from './replaceVariables.js'

test('replaceVariables fills repeated variables and clears missing values', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'replaceVariables'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const templatePath = path.join(home, 'template')
    fs.writeFileSync(templatePath, '${name}:${name}:${missing}')
    assert.equal(replaceVariables(templatePath, { name: 'shop' }), 'shop:shop:')
})
