import isControlProcess from './isControlProcess.js'

export default params => isControlProcess(params) && params.process === 'panel'
