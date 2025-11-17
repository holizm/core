import fs from 'fs/promises'
import { info } from './logger.js'

const home = process.env.HOME

export default async repoDir => {
    const vcsIgnorePath = `${home}/core/vcsIgnore`
    const infoDir = `${repoDir}/.git/info`
    const excludeFile = `${infoDir}/exclude`

    await fs.mkdir(infoDir, { recursive: true })
    await fs.copyFile(vcsIgnorePath, excludeFile)
}
