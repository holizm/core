import ensureApiDatabaseContainer from './ensureApiDatabaseContainer.js';
import ensureApiSearchDatabaseContainer from './ensureApiSearchDatabaseContainer.js';
export default params => {
    params.addContainerStartupTask('ensure database container', () => ensureApiDatabaseContainer(params));
    if (!params.usesBackingInfrastructure) {
        params.addContainerStartupTask('ensure search database container', () => ensureApiSearchDatabaseContainer(params));
    }
};
