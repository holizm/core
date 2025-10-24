#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { errorAndExit } from "../logger.js"
import { runOnTerminal } from "./terminal.js"

export const getOrgRepoFromGit = () => {
    let url = runOnTerminal("git config --get remote.origin.url")
    if (!url) errorAndExit("No remote.origin.url found in git config.")

    if (url.endsWith(".git")) url = url.slice(0, -4)

    let repoPath
    if (url.startsWith("git@")) {
        [, repoPath] = url.split(":", 2)
    } else if (url.startsWith("https://") || url.startsWith("http://")) {
        const parts = url.split("/")
        repoPath = parts.slice(-2).join("/")
    } else {
        errorAndExit(`Unrecognized git remote format: ${url}`)
    }

    const [org, repo] = repoPath.split("/")
    return { org, repo }
}

export const exit = () => process.exit()

const readReplaceWrite = (inputFile, outputFile, flag) => {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    const content = fs.readFileSync(inputFile, "utf8")
    const replaced = content.replace(/\$(\w+)|\${(\w+)}/g, (_, v1, v2) => process.env[v1 || v2] || "")
    fs.writeFileSync(outputFile, replaced, { flag })
}

export const replaceEnvs = (inputFile, outputFile) => readReplaceWrite(inputFile, outputFile, "w")
export const replaceEnvsAndAppend = (inputFile, outputFile) => readReplaceWrite(inputFile, outputFile, "a")

export const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile()
export const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory()

export const createDirIfNotExists = dirPath => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

export const createFileIfNotExists = (p) => {
    if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true })
        else return
    }
    fs.closeSync(fs.openSync(p, "w"))
}

export const writeFileIfNotExists = (p, content) => {
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
    fs.copyFileSync(source, dest)
}

export const getFileContent = (p) => fs.readFileSync(p, "utf8")
export const getFileLines = (p) => fs
    .readFileSync(p, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

export const writeFile = (p, content) => {
    if (!p) errorAndExit("Path must not be empty")
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content)
}

export const getDepth = () => {
    const parts = process.cwd().split(path.sep).filter(Boolean)
    return parts.length
}

export const isRepo = params => fs.existsSync(path.join(params.processPath, ".git"))

export const isProcess = params => {
    const { processPath } = params
    if (getDepth() !== 4) return false
    const folder = path.basename(processPath)
    const keywords = ["accounts", "api", "panel", "site", "etl", "worker"]
    const folderLower = folder.toLowerCase()

    if (keywords.some(k => folderLower.includes(k))) return true

    const files = fs.readdirSync(processPath)
    const pascalFiles = new Set(files.filter(f => fs.statSync(path.join(processPath, f)).isFile()))
    for (const keyword of keywords) {
        if (pascalFiles.has(pascalize(keyword))) return true
    }
    return false
}

export const isAccounts = params => isProcess(params) && path.basename(params.processPath) === "accounts"
export const isApi = params => isProcess(params) && ["app.js"].some(f => fs.existsSync(path.join(params.processPath, f)))
export const isWorker = params => isProcess(params) && path.basename(params.processPath).includes("worker")
export const isPanel = params => isProcess(params) && path.basename(params.processPath).includes("panel")
export const isSite = params => {
    if (!isProcess(params)) return false
    const folder = path.basename(params.processPath)
    const hasSite = folder.includes("site")
    const hasApi = folder.includes("api")
    const hasAppDir = fs.existsSync(path.join(params.processPath, "pages"))
    return (hasSite && !hasApi) || hasAppDir
}
export const isHeadlessPanel = params => isPanel(params) && fs.existsSync(path.join(params.processPath, "headless"))
export const isEtl = params => isApi(params) && params.processPath.endsWith("etl")
