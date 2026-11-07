#!/usr/bin/env bash
set -euo pipefail

commandPath=$(cd -- "${BASH_SOURCE[0]%/*}" && pwd)/compressWithPassword
testDirectory=$(mktemp -d /tmp/compressWithPasswordTestsXXXXXX)
trap 'rm -rf -- "$testDirectory"' EXIT
mkdir "$testDirectory/source folder"
printf 'Secret test content\n' > "$testDirectory/source folder/hidden name"
printf 'Hidden dotfile\n' > "$testDirectory/source folder/.hidden"

printf 'TestPasswordOnly9!\nTestPasswordOnly9!\n' | "$commandPath" "$testDirectory/source folder" > "$testDirectory/createLog" 2>&1
archivePath="$testDirectory/source folder.7z"
[[ -f "$archivePath" ]]
[[ $(stat -c '%a' "$archivePath") == 600 ]]
7z l -pTestPasswordOnly9! -slt "$archivePath" > "$testDirectory/listLog"
rg -q '7zAES' "$testDirectory/listLog"
rg -q 'Encrypted = \+' "$testDirectory/listLog"
if 7z l -pWrongPassword "$archivePath" > "$testDirectory/wrongLog" 2>&1; then
    exit 1
fi
if rg -q 'hidden name|\.hidden' "$testDirectory/wrongLog"; then
    exit 1
fi
7z x -pTestPasswordOnly9! "-o$testDirectory/restored" "$archivePath" > "$testDirectory/extractLog"
cmp "$testDirectory/source folder/hidden name" "$testDirectory/restored/source folder/hidden name"
cmp "$testDirectory/source folder/.hidden" "$testDirectory/restored/source folder/.hidden"
originalHash=$(sha256sum "$archivePath")
if "$commandPath" "$testDirectory/source folder" > "$testDirectory/existingLog" 2>&1; then
    exit 1
fi
[[ $(sha256sum "$archivePath") == "$originalHash" ]]
if "$commandPath" "$testDirectory/missing" > "$testDirectory/missingLog" 2>&1; then
    exit 1
fi
cd "$testDirectory/source folder"
printf 'TestPasswordOnly9!\nTestPasswordOnly9!\n' | "$commandPath" '.hidden' > "$testDirectory/fileLog" 2>&1
7z t -pTestPasswordOnly9! '.hidden.7z' > "$testDirectory/testLog"
for passwords in $'\n\n' $'FirstPassword\nOtherPassword\n'; do
    if printf '%s' "$passwords" | "$commandPath" 'hidden name' > "$testDirectory/rejectedLog" 2>&1; then
        exit 1
    fi
    [[ ! -e 'hidden name.7z' ]]
done
printf 'compressWithPassword tests passed\n'
