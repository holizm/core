import createDatabaseContainer from './createDatabaseContainer.js';
import { runOnTerminalAsync } from './terminal.js';
export default async params => {
    const databaseParams = params.usesBackingInfrastructure ? {
        ...params,
        lowercaseRepo: params.networkRepo.toLowerCase(),
        repo: params.networkRepo
    } : params;
    const { repo } = databaseParams;
    const databaseContainerName = `${repo}Databases`;
    const runningDatabaseContainer = await runOnTerminalAsync(`docker ps -q -f name=${databaseContainerName}`);
    if (runningDatabaseContainer.trim()) {
        return;
    }
    const exitedDatabaseContainer = await runOnTerminalAsync(`docker ps -aq -f status=exited -f name=${databaseContainerName}`);
    if (exitedDatabaseContainer.trim()) {
        await runOnTerminalAsync(`docker rm ${databaseContainerName}`, { throwOnError: true });
    }
    await createDatabaseContainer(databaseParams);
};
