import runOnServer from './runOnServer.js'
export default async ({
    domain,
    fullProcessName,
    pm2,
    processPath,
    requireListening,
}) => {
    const command = `node --input-type=module -e 'import { execFileSync } from "child_process"; import getListeningPort from "/holism/server/scripts/getListeningPort.js"; let port = ""; for (let attempt = 0; attempt < ${requireListening ? 30 : 1}; attempt++) { const pid = execFileSync("${pm2}", ["pid", "${fullProcessName}"], { encoding: "utf8" }).trim().split("\\n").at(-1); port = getListeningPort(pid); if (port) break; await new Promise(resolve => setTimeout(resolve, 500)); } console.log(port);'`
    const listeningPort = (await runOnServer(domain, command, true)).trim()
    if (/^[1-9]\d*$/.test(listeningPort)) return listeningPort
    if (requireListening) throw new Error(`${fullProcessName} did not start listening after publication`)
    const configuredCommand = `node --input-type=module -e 'import { execFileSync } from "child_process"; const processes = JSON.parse(execFileSync("${pm2}", ["jlist"], { encoding: "utf8" })); const process = processes.find(item => item.name === "${fullProcessName}"); const args = process?.pm2_env?.args || []; const candidates = [...(Array.isArray(args) ? args : [args]), process?.pm2_env?.PORT].filter(value => /^[1-9]\\d*$/.test(String(value)) && Number(value) <= 65535); console.log(candidates.at(-1) || "");'`
    const configuredPort = (await runOnServer(domain, configuredCommand, true)).trim()
    if (/^[1-9]\d*$/.test(configuredPort)) return configuredPort
    return (await runOnServer(domain, `sed -nE 's/.*127\\.0\\.0\\.1:([0-9]+).*/\\1/p' ${processPath}/compose.yaml | head -n1`, true)).trim()
}
