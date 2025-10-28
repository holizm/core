#!/usr/bin/env bash
set -euo pipefail

readonly color_red=$(tput setaf 1)
readonly color_green=$(tput setaf 2)
readonly color_cyan=$(tput setaf 6)
readonly color_yellow=$(tput setaf 3)
readonly color_magenta=$(tput setaf 5)
readonly color_reset=$(tput sgr0)

readonly check_mark=$'\xE2\x9C\x94'

success() { printf "${color_green}%s${color_reset}\n" "$*"; }
info() { printf "${color_cyan}%s${color_reset}\n" "$*"; }
warning() { printf "${color_yellow}%s${color_reset}\n" "$*"; }
error() { printf "${color_red}%s${color_reset}\n" "$*" >&2; }
divide() { printf "\n${color_magenta}----------${color_reset}\n\n"; }
