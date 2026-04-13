import esprima from 'nightly-esprima'
import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import fs from 'fs'
import path from 'path'

try {
    const file = process.argv[2]
    const org = process.env.Organization
    const repo = process.env.Repository
    const app = process.env.App
    let code = fs.readFileSync(file, {
        encoding: 'utf8',
        flag: 'r'
    })
    code = code.replaceAll('<>', '<Fragment>')
    code = code.replaceAll('</>', '</Fragment>')
    let ast = esprima.parseModule(code, { 'jsx': true })
    let acornAst = Parser.extend(jsx()).parse(code, {
        ecmaVersion: 'latest',
        locations: true,
        sourceType: 'module',
        plugins: { jsx: true }
    })
    let tokens = esprima.tokenize(code, { 'jsx': true })
    let astFile = file
        .replace(`/${repo}`, '')
        .replace(`/${app}`, '')
        .replace('/src', '')
        .replace('/routes', '')
        .replace('/coreParts', '')
        .replace('./', '/')
        .replace('.jsx', '.json')
    astFile = `/tmp/${repo}/${app}/ast${astFile}`
    let acornAstFile = astFile.replace('.json', '.acorn.json')
    let tokenFile = `${astFile}.tokens`
    let directory = path.dirname(astFile)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(astFile, JSON.stringify(ast))
    fs.writeFileSync(acornAstFile, JSON.stringify(acornAst))
    // fs.writeFileSync (tokenFile, JSON.stringify(tokens))
} catch (e) {
    console.error(e)
}
