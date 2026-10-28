import {
    removeAndRecreateDir,
    replaceVariables,
} from './os.js';
export default params => {
    const {
        home,
        process,
        repo
    } = params;
    const editorPath = `/tmp/${repo}/${process}/.vscode`;
    removeAndRecreateDir(editorPath);
    replaceVariables(`${home}/core/api/launch`, `${editorPath}/launch.json`, params);
};
