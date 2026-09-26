import fs, { rmSync } from 'fs'
import path from 'path'
import fg from 'fast-glob'
import camelize from './camelize.js'
import isFile from './isFile.js'
import {
    error,
    errorAndExit,
    warning,
} from '../scripts/logger.js'
import { runOnTerminal } from './terminal.js'

export const deleteByPatterns = async (cwd, patterns) => {
    const matches = await fg(patterns, {
        cwd,
        dot: true,
        caseSensitiveMatch: false,
        onlyFiles: false,
        unique: true,
    })
    matches.sort((a, b) => b.length - a.length)
    for (const p of matches) {
        const fullPath = path.join(cwd, p)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { force: true, recursive: true })
        }
    }
}

export const getOrgRepoFromGit = () => {
    let url = runOnTerminal('git config --get remote.origin.url', {
        throwOnError: false,
        hideError: true,
    })
    if (!url) {
        errorAndExit('Not a git repo')
    }
    if (url.endsWith('.git')) {
        url = url.slice(0, -4)
    }
    let orgRepo
    if (url.startsWith('https')) {
        const parts = url.split('/')
        orgRepo = {
            org: camelize(parts[3]),
            repo: camelize(parts[4].replace('.git', '')),
        }
    }
    else {
        orgRepo = {
            org: camelize(url.split(':')[1].split('/')[0]),
            repo: camelize(url.split('/').reverse()[0].replace('.git', '')),
        }
    }
    if (!orgRepo.org) {
        warning(url)
        orgRepo.org = 'na'
    }
    return orgRepo
}

export const exit = () => process.exit()

const readReplaceWrite = (inputFile, outputFile, flag, params) => {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    const content = fs.readFileSync(inputFile, 'utf8')
    const replaced = content.replace(/\${(\w+)}/g, (_, v1, v2) => params[v1 || v2] || '')
    fs.writeFileSync(outputFile, replaced, { flag })
}

export const replaceVariables = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, 'w', params)
export const replaceVariablesAndAppend = (inputFile, outputFile, params) => readReplaceWrite(inputFile, outputFile, 'a', params)

export const replaceVariablesIfChanged = (inputFile, outputFile, params) => {
    const content = fs.readFileSync(inputFile, 'utf8')
    const replaced = content.replace(/\$\{(\w+)\}/g, (_, v1, v2) => params[v1 || v2] || '')
    if (isFile(outputFile) && fs.readFileSync(outputFile, 'utf8') === replaced) {
        return false
    }
    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    fs.writeFileSync(outputFile, replaced)
    return true
}

export const exists = p => p && fs.existsSync(p)
export const createDirIfNotExists = dirPath => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

export const removeAndRecreateDir = dirPath => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, {
            force: true,
            recursive: true,
        })
    }
    createDirIfNotExists(dirPath)
}

export const createFileIfNotExists = p => {
    const dir = path.dirname(p)
    fs.mkdirSync(dir, { recursive: true })
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) {
            fs.rmSync(p, { force: true, recursive: true })
        }
        else {
            return
        }
    }
    fs.closeSync(fs.openSync(p, 'w'))
}

export const writeFileIfNotExists = (p, content) => {
    const dir = path.dirname(p)
    fs.mkdirSync(dir, { recursive: true })
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) {
            fs.rmSync(p, { force: true, recursive: true })
        }
        else {
            return
        }
    }
    fs.writeFileSync(p, content)
}

export const copyFileIfNotExists = (source, dest) => {
    if (fs.existsSync(dest)) {
        if (fs.statSync(dest).isDirectory()) {
            fs.rmSync(dest, { force: true, recursive: true })
        }
        else {
            return
        }
    }
    try {
        fs.copyFileSync(source, dest)
    } catch (e) {
        error(source, dest)
        error(e)
    }
}

export const getFileNameWithoutExtension = filePath => {
    return path.basename(filePath, path.extname(filePath))
}

export const getContent = (p) => fs.readFileSync(p, 'utf8')
export const getLines = (p) => fs
    .readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

export const writeFile = (p, content) => {
    if (!p) {
        errorAndExit('Path must not be empty')
    }
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content)
}

export const overrideFile = (p, content) => {
    if (isFile(p)) {
        rmSync(p)
    }
    writeFile(p, content)
}

export const append = (p, content) => {
    if (!p) {
        errorAndExit('Path must not be empty')
    }
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.appendFileSync(p, content)
}

export const getDepth = targetPath => {
    const parts = (targetPath || process.cwd()).split('/').filter(Boolean)
    return parts.length
}

export const getDirs = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

}

export const getFiles = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => d.name)
}

export const getDirsAndFiles = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .map(d => d.name)
}

export const deleteFile = filePath => {
    if (!filePath) {
        errorAndExit('Path must not be empty')
    }

    if (!fs.existsSync(filePath)) {
        return
    }

    try {
        if (fs.statSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { force: true, recursive: true })
        }
        else {
            fs.rmSync(filePath, { force: true })
        }
    } catch (e) {
        error(filePath)
        error(e)
    }
}
