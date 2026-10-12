import assert from 'assert/strict'
import fs from 'fs'
import { test } from 'node:test'
import reportPolicyTimings from './reportPolicyTimings.js'

test('reportPolicyTimings aggregates calls and sorts by total time', () => {
    reportPolicyTimings([
        [
            { durationMilliseconds: 2, task: 'parse' },
            { durationMilliseconds: 4, task: 'validate' },
        ],
        [
            { durationMilliseconds: 3, task: 'parse' },
        ],
    ])
    const lines = fs.readFileSync('/tmp/checkPolicyTimings.md', 'utf8').trim().split('\n')
    assert.deepEqual(lines.slice(2), [
        '| parse | 5.000 | 2 | 2.500 |',
        '| validate | 4.000 | 1 | 4.000 |',
    ])
})
