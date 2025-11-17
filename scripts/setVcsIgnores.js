import findRepos from './findRepos.js'
import setVcsIgnore from "./setVcsIgnore.js"

const repos = findRepos()
for (const repo of repos) {
    await setVcsIgnore(repo)
}
