import { runOnTerminal } from './terminal.js'

export default () => runOnTerminal('sudo nginx -t && sudo systemctl reload nginx 1>/dev/null 2>&1')
