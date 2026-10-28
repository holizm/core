import { replaceVariables } from './os.js';
export default params => {
    const {
        composeFile,
        home
    } = params;
    const composeTemplatePath = `${home}/core/container/composes/api`;
    replaceVariables(composeTemplatePath, composeFile, params);
};
