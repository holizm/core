import base64
import json
from pathlib import Path
import sys

payload = json.loads(base64.b64decode(sys.argv[1]))
home = Path.home()

isProcess = lambda directory: directory.is_dir() and (
    directory.name.endswith(('Api', 'Panel', 'Site'))
    or directory.name == 'site'
    or (directory / 'site').is_file()
    or (directory / 'package.json').is_file()
    or (directory / 'compose.yaml').is_file()
)

targets = {
    home / '.codex' / 'AGENTS.md': payload['agent'],
    home / 'AGENTS.md': payload['home'],
    Path('/holism/AGENTS.md'): payload['platform'],
}
for instance in sorted(home.iterdir()):
    if not instance.is_dir() or instance.name.startswith('.'):
        continue
    if (instance / '.git').exists():
        continue
    processes = [directory for directory in sorted(instance.iterdir()) if isProcess(directory)]
    if not processes:
        continue
    targets[instance / 'AGENTS.md'] = payload['instance']
    for process in processes:
        targets[process / 'AGENTS.md'] = payload['process']

for file in targets:
    if file.exists() and not file.read_text().startswith('# Generated policies\n'):
        raise RuntimeError(f'Refusing to replace custom policies: {file}')

for file, content in targets.items():
    file.parent.mkdir(parents=True, exist_ok=True)
    if not file.exists() or file.read_text() != content:
        file.write_text(content)
    print(file)
