. "$home/core/scripts/apiBarrelDirectories.sh"
node "$home/core/commands/api/generateExports.js" $directories || exit $?
node "$home/core/commands/api/generatePackageJsonFiles.js" $directories || exit $?
node "$home/core/commands/api/generateBusinessExports.js" $directories || exit $?
