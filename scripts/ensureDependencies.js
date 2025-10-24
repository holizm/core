import {
    isFile,
    writeFile,
} from "./os.js"

export default params => {
    const {
        dependenciesPath,
        commonPath,
    } = params

    if (!isFile(dependenciesPath)) {
        writeFile(dependenciesPath, 'blog\n')
    }
}
