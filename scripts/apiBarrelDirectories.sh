nodeModules="$containerHome/$repo/$process/node_modules"
directories=$(find "$nodeModules" -mindepth 2 -maxdepth 2 -type f -name part -printf '%h\n' | sed "s|^$nodeModules/||" | sort -u)
export directories=$(printf '%s\n' core "$directories" | sort -u)
