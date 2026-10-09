import { execFileSync } from 'child_process'
import micromatch from 'micromatch'
import buildExclusions from './buildExclusions.js'

export default artifactPath => {
    const entries = execFileSync('unzip', ['-Z1', artifactPath], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    }).split('\n')
    const excludedEntry = entries
        .map(entry => entry.replace(/^\.\//, ''))
        .find(entry => micromatch.isMatch(entry, buildExclusions, { dot: true }))
    if (excludedEntry) {
        throw new Error(`Build artifact contains excluded file: ${excludedEntry}`)
    }
}
