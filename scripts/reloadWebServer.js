import { runOnTerminal } from './terminal.js'

export default () => runOnTerminal('sudo nginx -t && (sudo systemctl is-active --quiet nginx && sudo systemctl reload nginx || sudo systemctl start nginx) 1>/dev/null 2>&1')
