import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import { fileURLToPath } from 'url'

for (const missingRepository of [false, true]) test(`dependency updates include newSite when missing=${missingRepository}`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'updateDepsTests'))
    const environmentPath = path.join(directory, 'environment')
    fs.writeFileSync(environmentPath, `mkdir() { :; }
cd() { printf 'directory:%s\\n' "$1"; }
rm() { :; }
cp() { printf 'copy:%s:%s\\n' "$1" "$2"; }
npx() { printf 'update:%s\\n' "$*"; }
git() {
    printf 'git:%s\\n' "$*"
    if [[ "$1" == 'diff' ]]; then return 1; fi
}
test() {
    if [[ "$1" == '-d' && "$2" == "$HOME/newSite" && "$dependencyTestMissingRepository" == 'true' && "$repositoryCloned" != 'true' ]]; then return 1; fi
    return 0
}
clone() {
    printf 'clone:%s\\n' "$*"
    repositoryCloned=true
}
`)
    try {
        const result = spawnSync('bash', [fileURLToPath(new URL('./updateDeps', import.meta.url))], {
            encoding: 'utf8',
            env: {
                ...process.env,
                BASH_ENV: environmentPath,
                dependencyTestMissingRepository: String(missingRepository),
            },
        })
        assert.equal(result.status, 0, result.stderr)
        const sections = result.stdout.split(/---- Processing (\w+) ----\n/)
        const repositories = []
        for (let index = 1; index < sections.length; index += 2) {
            const repository = sections[index]
            const output = sections[index + 1]
            repositories.push(repository)
            if (repository === 'newSite') {
                assert.equal(output.includes('clone:holizm newSite'), missingRepository)
                if (missingRepository) assert.ok(output.indexOf('clone:holizm newSite') < output.indexOf('copy:'))
            }
            assert.ok(output.includes(`copy:${process.env.HOME}/${repository}/package.json:.`))
            assert.ok(output.includes('update:npm-check-updates -u'))
            assert.ok(output.includes(`copy:package.json:${process.env.HOME}/${repository}/package.json`))
            assert.ok(output.includes('git:add package.json'))
            assert.ok(output.includes('git:commit -m update dependencies'))
            assert.ok(output.includes('git:push'))
        }
        assert.deepEqual(repositories, ['api', 'panel', 'site', 'newSite', 'core', 'policies'])
    }
    finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
