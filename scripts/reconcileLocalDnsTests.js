import assert from 'assert/strict'
import test from 'node:test'
import reconcileLocalDns from './reconcileLocalDns.js'

test('reconcileLocalDns replaces stale host mappings and retains unrelated hosts', () => {
    const content = '127.0.0.1 old.local app.local # local services\n10.0.0.2 db.local\n'
    const result = reconcileLocalDns(content, [
        { host: 'app.local', ip: '127.0.0.2' },
        'new.local',
    ])
    assert.equal(result, '127.0.0.1 old.local # local services\n10.0.0.2 db.local\n127.0.0.2 app.local\n127.0.0.1 new.local\n')
    assert.equal(reconcileLocalDns(result, [
        { host: 'app.local', ip: '127.0.0.2' },
        'new.local',
    ]), result)
})

test('reconcileLocalDns rejects conflicting or unsafe mappings', () => {
    assert.throws(() => reconcileLocalDns('', [
        { host: 'app.local', ip: '127.0.0.1' },
        { host: 'app.local', ip: '127.0.0.2' },
    ]), /Conflicting/)
    assert.throws(() => reconcileLocalDns('', ['app.local#bad']), /Invalid/)
})
