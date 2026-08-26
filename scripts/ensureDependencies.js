import {
    isFile,
    writeFile,
} from './os.js'

export default params => {
    const { dependenciesPath } = params

    if (!isFile(dependenciesPath)) {
        writeFile(dependenciesPath, 'blog\n')
    }
}
