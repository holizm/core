import {
    removeAndRecreateDir,
    writeFile,
} from './os.js'

export default params => {
    const {
        multiThemed,
        process,
        repo,
        themeDirectories,
    } = params
    if (!multiThemed) return
    const directory = `/tmp/${repo}/${process}/themeStyles`
    removeAndRecreateDir(directory)
    themeDirectories.forEach(themeDirectory => {
        const themeNumber = themeDirectory.slice('theme'.length)
        const content = `@import 'tailwindcss' source(none);\n@source '..';\n@source '../themes/${themeNumber}';\n@import '../themes/${themeNumber}/style.css';\n`
        writeFile(`${directory}/theme${themeNumber}.css`, content)
    })
}
