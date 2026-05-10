#!/usr/bin/env node

import fs, { rmSync } from 'fs'
import path from 'path'
import {
    error,
    errorAndExit,
    info,
} from '../scripts/logger.js'
import { runOnTerminal } from './terminal.js'
import camelize from './camelize.js'

export const getOrgRepoFromGit = () => {
    let url = runOnTerminal('git config --get remote.origin.url', {
        throwOnError: false,
        hideError: true,
    })
    if (!url) errorAndExit('Not a git repo')
    if (url.endsWith('.git')) url = url.slice(0, -4)
    let orgRepo
    if (url.startsWith('https')) {
        const parts = url.split('/')
        orgRepo = {
            org: camelize(parts[3]),
            repo: camelize(parts[4].replace('.git', '')),
        }
    } else {
        orgRepo = {
            org: camelize(url.split(':')[1].split('/')[0]),
            repo: camelize(url.split('/').reverse()[0].replace('.git', '')),
        }
    }
    if (!orgRepo.org) {
        orgRepo.org = 'na'
    }
    return orgRepo

    let repoPath
    if (url.startsWith('git@')) {
        [, repoPath] = url.split(':', 2)
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
        const parts = url.split('/')
        repoPath = parts.slice(-2).join('/')
    } else {
        errorAndExit(`Unrecognized git remote format: ${url}`)
    }

    let [org, repo] = repoPath.split('/')
    org = camelize(org)
    repo = camelize(repo)
    // todo: remove these camelizing methods later
    return { org, repo }
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

export const exists = p => p && fs.existsSync(p)
export const isFile = p => p && fs.existsSync(p) && fs.statSync(p).isFile()
export const isDir = p => p && fs.existsSync(p) && fs.statSync(p).isDirectory()

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

export const createFileIfNotExists = (p) => {
    const dir = path.dirname(p)
    fs.mkdirSync(dir, { recursive: true })
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true })
        else return
    }
    fs.closeSync(fs.openSync(p, 'w'))
}

export const writeFileIfNotExists = (p, content) => {
    const dir = path.dirname(p)
    fs.mkdirSync(dir, { recursive: true })
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true })
        else return
    }
    fs.writeFileSync(p, content)
}

export const copyFileIfNotExists = (source, dest) => {
    if (fs.existsSync(dest)) {
        if (fs.statSync(dest).isDirectory()) fs.rmSync(dest, { recursive: true, force: true })
        else return
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
    if (!p) errorAndExit('Path must not be empty')
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content)
}

export const overrideFile = (p, content) => {
    if (isFile(p)) rmSync(p)
    writeFile(p, content)
}

export const append = (p, content) => {
    if (!p) errorAndExit('Path must not be empty')
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.appendFileSync(p, content)
}

export const getDepth = path => {
    const parts = (path || process.cwd()).split('/').filter(Boolean)
    return parts.length
}

export const isRepo = params => fs.existsSync(path.join(params.processPath, '.git'))

export const isProcess = params => {
    const { processPath } = params
    if (getDepth(processPath) !== 4) return false
    const folder = path.basename(processPath)
    const keywords = ['accounts', 'api', 'panel', 'site', 'etl', 'worker']
    const folderLower = folder.toLowerCase()

    if (keywords.some(k => folderLower.includes(k))) return true

    const files = fs.readdirSync(processPath)
    const pascalFiles = new Set(files.filter(f => fs.statSync(path.join(processPath, f)).isFile()))
    for (const keyword of keywords) {
        if (pascalFiles.has(pascalize(keyword))) return true
    }
    return false
}

export const isAccounts = params => isProcess(params) && path.basename(params.processPath) === 'accounts'
export const isApi = params => isProcess(params) && (['process.js'].some(f => fs.existsSync(path.join(params.processPath, f))) || path.basename(params.processPath).endsWith('Api') || path.basename(params.processPath) === 'etl')
export const isWorker = params => isProcess(params) && path.basename(params.processPath).includes('worker')
export const isPanel = params => isProcess(params) && path.basename(params.processPath).includes('Panel')
export const isSite = params => {
    if (!isProcess(params)) return false
    const folder = path.basename(params.processPath)
    const hasSite = folder.includes('site')
    const hasApi = folder.includes('api')
    const hasAppDir = fs.existsSync(path.join(params.processPath, 'pages'))
    return (hasSite && !hasApi) || hasAppDir
}
export const isHeadlessPanel = params => isPanel(params) && fs.existsSync(path.join(params.processPath, 'headless'))
export const isEtl = params => isApi(params) && params.processPath.endsWith('etl')

export const getDirs = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

}

export const getFiles = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => d.name);
}

export const getDirsAndFiles = path => {
    return fs.readdirSync(path || '.', { withFileTypes: true })
        .map(d => d.name)
}
