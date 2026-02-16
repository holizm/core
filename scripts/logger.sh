#!/usr/bin/env bash
set -euo pipefail

colorRed=$(tput setaf 1)
colorGreen=$(tput setaf 2)
colorCyan=$(tput setaf 6)
colorYellow=$(tput setaf 3)
colorMagenta=$(tput setaf 5)
colorReset=$(tput sgr0)
checkMark=$'\xE2\x9C\x94'

success() { printf "${colorGreen}%s${colorReset}\n" "$*"; }
info() { printf "${colorCyan}%s${colorReset}\n" "$*"; }
warning() { printf "${colorYellow}%s${colorReset}\n" "$*"; }
error() { printf "${colorRed}%s${colorReset}\n" "$*" >&2; }
divide() { printf "\n${colorMagenta}----------${colorReset}\n\n"; }
dividedError() { divide; error "$@"; divide; }
errorAndExit() { dividedError "$@"; exit 1; }
check() {
    printf "${colorGreen}%s;%s${colorReset}\n" "$*" "$checkMark" | column -t -s ';'
}
