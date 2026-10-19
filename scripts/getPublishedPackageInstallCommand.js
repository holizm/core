export default (params, remoteBuildDir, remoteProcessPath) => {
    const install = `cd "${remoteProcessPath}" && /holism/server/commands/installPackages`
    if (!params.isApi) return install
    const command = [
        'set -e',
        'restorePlatformModules() {',
        `    mkdir -p "${remoteProcessPath}/node_modules"`,
        `    find "${remoteProcessPath}/node_modules" -mindepth 1 -maxdepth 1 -type d -name '.*' ! -name '.bin' -exec rm -rf {} +`,
        `    unzip -o "${remoteBuildDir}/${params.process}.zip" 'node_modules/*' -d "${remoteProcessPath}"`,
        '    local publishedRoot',
        `    publishedRoot=$(dirname "${remoteProcessPath}")`,
        `    find "${remoteProcessPath}/node_modules" -mindepth 2 -maxdepth 2 -type f -name exports.js -exec sed -i "s|/home/dev/${params.repo}/|$publishedRoot/|g" {} +`,
        '}',
        'trap restorePlatformModules EXIT',
        `trap 'exit 129' HUP`,
        `trap 'exit 130' INT`,
        `trap 'exit 143' TERM`,
        install,
    ].join('\n')
    return command
}
