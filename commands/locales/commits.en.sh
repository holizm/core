declare -A messages=(
    [help]='Usage: commits [count]
Open commit history in the Git pager, starting with the latest commit and its diff.
Use the arrow keys to scroll to older commits; press q to quit.
Optionally limit the number of commits.'
    [usage]='Usage: commits [count]
Count must be a positive integer.'
    [repository]='Run commits inside a Git repository.'
    [empty]='No commits yet.'
)
