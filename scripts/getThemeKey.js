import {
    basename,
    dirname,
} from 'path'

export default directory => {
    const name = basename(directory)
    const prefix = basename(dirname(directory)) === 'siteThemes' ? 'core' : ''
    return prefix + name.replace(/^coreTheme/, 'core').replace(/^theme/, '')
}
