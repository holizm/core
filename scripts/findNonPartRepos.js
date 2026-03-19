import { getContent } from './os.js'
import { runOnTerminal } from "./terminal.js"

const home = process.env.HOME
const cacheFile = '/tmp/nonPartRepos.json'

export default () => {
    if (isFile(cacheFile)) {
        return getContent(cacheFile)
    }
    const command = `
        find ${home} -maxdepth 2 -type d -name .git | cut -d'/' -f4 | sort |
        while read repo;
        do
            if [ ! -f ${home}/${repo}/part ]; then
                if [ ! -d ${home}/${repo}/common ]; then
                    echo $repo
                fi
            fi
        done
    `
    const output = runOnTerminal(command)
    const repos = output.split('\n').map(i => i.trim()).filter(i)
    return repos
}
