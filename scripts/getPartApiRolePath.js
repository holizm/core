import {
    existsSync,
    lstatSync,
    realpathSync,
} from 'fs'
import path from 'path'
import getProcessRole from './getProcessRole.js'

export default ({
    dependency,
    dependencyBase,
    processPath,
}) => {
    const declaration = path.join(processPath, dependency)
    const roleDirectory = path.join(dependencyBase, 'api')
    if (lstatSync(declaration, { throwIfNoEntry: false })?.isSymbolicLink()) {
        const selected = realpathSync(declaration)
        if (path.dirname(selected) !== realpathSync(roleDirectory)) {
            throw new Error(`Invalid API role selection: ${declaration}`)
        }
        return selected
    }
    const role = getProcessRole(path.basename(processPath))
    const selected = path.join(roleDirectory, role)
    return role && existsSync(selected)
        ?
        selected
        :
        null
}
