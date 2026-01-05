export directories=$(find "$home/spl" -maxdepth 1 -mindepth 1 -type d | sed "s|^$home/spl/||" | sort)
node $home/core/commands/api/generateExports.js $directories
node $home/core/commands/api/generatePackageJsonFiles.js $directories
