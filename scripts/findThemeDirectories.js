import {
    join,
    relative,
} from 'path'
import { getDirs } from './os.js'

export default (repoPath, corePath) => {
    const directories = getDirs(repoPath).filter(name => /^theme\d+$/.test(name))
    if (corePath) {
        directories.push(...getDirs(corePath)
            .filter(name => /^theme\d+$/.test(name))
            .map(name => relative(repoPath, join(corePath, name))))
    }
    return directories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
