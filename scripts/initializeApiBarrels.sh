export directories=$(find "$containerHome/$repo/$process/node_modules" -mindepth 2 -maxdepth 2 -type f -name part -printf '%h\n' | sed "s|^$containerHome/$repo/$process/node_modules/||" | sort -u)
directories=$(printf '%s\n' core "$directories" | sort -u)
node $home/core/commands/api/generateExports.js $directories
node $home/core/commands/api/generatePackageJsonFiles.js $directories
