import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    chmodSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'

test('ai checks versions, upgrades before launch, and stops on failures', () => {
    const directory = mkdtempSync(join(tmpdir(), 'aiTests'))
    const log = join(directory, 'calls')
    const state = join(directory, 'version')
    const scripts = {
        codex: `#!/bin/bash
if [[ "$1" == '--version' ]]; then
    cat "$testState"
else
    printf 'launch:%s:%s\\n' "$CODEX_HOME" "$*" >> "$testLog"
fi
`,
        npm: `#!/bin/bash
printf 'check\\n' >> "$testLog"
[[ "$testScenario" != 'registryFailure' ]] || exit 7
printf '1.0.0\\n'
`,
        sudo: `#!/bin/bash
printf 'upgrade:%s\\n' "$*" >> "$testLog"
[[ "$testScenario" != 'installFailure' ]] || exit 8
[[ "$testScenario" != 'shadowed' ]] || exit 0
printf 'codex-cli 1.0.0\\n' > "$testState"
`,
    }
    try {
        for (const [name, source] of Object.entries(scripts)) {
            const path = join(directory, name)
            writeFileSync(path, source)
            chmodSync(path, 0o755)
        }
        for (const scenario of ['current', 'outdated', 'missing', 'registryFailure', 'installFailure', 'shadowed']) {
            writeFileSync(log, '')
            writeFileSync(state, scenario === 'current' ? 'codex-cli 1.0.0\n' : '')
            const result = spawnSync('bash', [new URL('./ai', import.meta.url).pathname, '2', 'hello world'], {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    HOME: directory,
                    PATH: `${directory}:${process.env.PATH}`,
                    testLog: log,
                    testScenario: scenario,
                    testState: state,
                },
            })
            const calls = readFileSync(log, 'utf8')
            assert.ok(calls.startsWith('check\n'))
            assert.equal(calls.includes('upgrade:-i npm install -g @openai/codex@latest'), !['current', 'registryFailure'].includes(scenario))
            const succeeds = ['current', 'outdated', 'missing'].includes(scenario)
            assert.equal(result.status === 0, succeeds)
            assert.equal(calls.includes(`launch:${directory}/.codex-account2:--dangerously-bypass-approvals-and-sandbox hello world`), succeeds)
        }
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
