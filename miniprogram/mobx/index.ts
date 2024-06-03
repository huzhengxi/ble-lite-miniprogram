
import { configure } from 'mobx-miniprogram'

export { bleScanStore } from './ble-scan-store'
export { deviceStore } from './device-store'

configure({ enforceActions: 'observed' })
