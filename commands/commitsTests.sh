#!/usr/bin/env bash
set -euo pipefail

commandPath=$(cd -- "${BASH_SOURCE[0]%/*}" && pwd)/commits
testDirectory=$(mktemp -d /tmp/commitsTests.XXXXXX)
trap 'rm -rf -- "$testDirectory"' EXIT
export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME=Test
export GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=Test
export GIT_COMMITTER_EMAIL=test@example.com
cd "$testDirectory"
bash "$commandPath" --help | rg -q 'Usage: commits'
if bash "$commandPath" 2>/dev/null; then exit 1; fi
git init --quiet repository
cd repository
bash "$commandPath" | rg -q 'No commits yet'
printf 'First line\n' > item
git add item
git commit --quiet -m 'Initial item'
printf 'Second line\n' > item
git commit --quiet -am 'Update item'
output=$(bash "$commandPath" 1)
[[ $output == *'Update item'* && $output != *'Initial item'* ]]
[[ $output == *'diff --git a/item b/item'* && $output == *'-First line'* && $output == *'+Second line'* ]]
[[ $output == *'1 file changed'* && $output == *'Author: Test'* ]]
output=$(bash "$commandPath")
[[ $output == *'Initial item'* && $output == *'Update item'* ]]
mkdir nested
cd nested
output=$(bash "$commandPath" 1)
[[ $output == *'+Second line'* ]]
for count in 0 -1 invalid; do
    if bash "$commandPath" "$count" 2>/dev/null; then exit 1; fi
done
if bash "$commandPath" 1 extra 2>/dev/null; then exit 1; fi
cd ..
for number in 3 4 5 6; do
    printf '%s\n' "$number" > item
    git commit --quiet -am "Update $number"
done
output=$(bash "$commandPath")
[[ $(printf '%s\n' "$output" | rg -c '^commit ') == 6 ]]
[[ $(printf '%s\n' "$output" | rg '^    ' | head -1) == '    Update 6' ]]
export COMMITS_COMMAND="$commandPath"
export PAGER_MARKER="$testDirectory/pager"
export GIT_PAGER='printf "%s" "$LESS" > "$PAGER_MARKER"; cat'
unset LESS
script --quiet --return --command 'bash "$COMMITS_COMMAND"' /dev/null >/dev/null
[[ $(cat "$PAGER_MARKER") == R ]]
