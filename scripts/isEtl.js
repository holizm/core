import isApi from './isApi.js'

export default params => isApi(params) && params.processPath.endsWith('etl')
