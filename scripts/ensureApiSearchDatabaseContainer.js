import createSearchDatabaseContainer from './createSearchDatabaseContainer.js';
import { runOnTerminalAsync } from './terminal.js';
export default async params => {
    const { repo } = params;
    const searchDatabaseContainerName = `${repo}SearchDatabases`;
    const runningSearchDatabaseContainer = await runOnTerminalAsync(`docker ps -q -f name=${searchDatabaseContainerName}`);
    if (runningSearchDatabaseContainer.trim()) {
        return;
    }
    const exitedSearchDatabaseContainer = await runOnTerminalAsync(`docker ps -aq -f status=exited -f name=${searchDatabaseContainerName}`);
    if (exitedSearchDatabaseContainer.trim()) {
        await runOnTerminalAsync(`docker rm ${searchDatabaseContainerName}`, { throwOnError: true });
    }
    const webServerChanged = await createSearchDatabaseContainer(params);
    params.webServerChanged = webServerChanged || params.webServerChanged;
};
