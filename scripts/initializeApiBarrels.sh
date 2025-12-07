export directories=$(find /spl -maxdepth 1 -mindepth 1 -type d | sed 's|/spl/||' | sort)
node /core/commands/api/generateExports.js $directories
node /core/commands/api/generatePackageJsonFiles.js $directories
