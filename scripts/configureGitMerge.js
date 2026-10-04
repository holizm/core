import { execFileSync } from 'child_process'

export default () => {
    for (const [key, value] of [
        ['pull.rebase', 'false'],
        ['pull.ff', 'true'],
        ['pull.twohead', 'ort'],
    ]) execFileSync('git', ['config', '--global', key, value])
}
