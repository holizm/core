import fs from 'fs';
import { runOnTerminal } from './terminal.js';
export default params => {
    const {
        commonPath,
        containerHome,
        home,
        process,
        repo
    } = params;
    const dirs = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type d 2>/dev/null`).split('\n');
    const links = runOnTerminal(`find ${home}/${repo}/${process}/ -mindepth 1 -type l 2>/dev/null`).split('\n');
    for (const item of [...dirs, ...links]) {
        if (item) {
            params.addVolume(`${item}`, `${item}`);
        }
    }
    if (fs.existsSync(`${commonPath}/api`)) {
        params.addVolume(`${commonPath}/api`, `${containerHome}/${repo}/${process}/commonApi`);
    }
};
