import { DeviceAdapter } from './adapters/DeviceAdapter';
import { HikvisionISAPIAdapter } from './adapters/HikvisionISAPIAdapter';
import { SimulatedDeviceAdapter } from './adapters/SimulatedDeviceAdapter';
import { GenericWiegandAdapter } from './adapters/GenericWiegandAdapter';
import { AccessDeviceVendor } from '../../types';

class AdapterRegistry {
  private adapters: Map<string, DeviceAdapter> = new Map();

  constructor() {
    this.register(new HikvisionISAPIAdapter());
    this.register(new SimulatedDeviceAdapter());
    this.register(new GenericWiegandAdapter());
  }

  register(adapter: DeviceAdapter): void {
    this.adapters.set(adapter.vendor.toLowerCase(), adapter);
  }

  getAdapter(vendor: AccessDeviceVendor | string, isSimulatedOnly: boolean = false): DeviceAdapter {
    if (isSimulatedOnly) {
      return this.adapters.get('simulated') || new SimulatedDeviceAdapter();
    }
    const found = this.adapters.get(vendor.toLowerCase());
    return found || this.adapters.get('simulated') || new SimulatedDeviceAdapter();
  }

  listSupportedVendors(): { vendor: string; name: string; protocols: string[] }[] {
    return Array.from(this.adapters.values()).map((a) => ({
      vendor: a.vendor,
      name: a.name,
      protocols: a.supportedProtocols,
    }));
  }
}

export const adapterRegistry = new AdapterRegistry();
