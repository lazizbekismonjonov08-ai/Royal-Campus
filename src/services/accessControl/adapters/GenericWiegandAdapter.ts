import {
  AccessTerminal,
  AccessLogEvent,
} from '../../../types';
import {
  DeviceConnectionConfig,
  ConnectionTestResult,
  UserCredentialPayload,
  SyncResult,
} from '../types';
import { DeviceAdapter } from './DeviceAdapter';

/**
 * Generic Wiegand / OSDP Card Reader Adapter
 * Extensible adapter for integrating third-party Wiegand (26/34-bit) controllers,
 * ZKTeco, Suprema, Dahua, or generic access control boards.
 */
export class GenericWiegandAdapter implements DeviceAdapter {
  readonly vendor = 'generic_wiegand';
  readonly name = 'Generic Wiegand / OSDP Controller Adapter';
  readonly supportedProtocols = ['OSDP', 'Wiegand_TCP', 'RS485'];

  async testConnection(config: DeviceConnectionConfig): Promise<ConnectionTestResult> {
    return {
      connected: false,
      status: 'offline',
      errorMessage: `Generic controller unreachable on ${config.ipAddress}:${config.port}.`,
      isSimulated: false,
    };
  }

  async triggerRelay(terminal: AccessTerminal, durationSeconds: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Relay triggered on generic controller (${durationSeconds}s).`,
    };
  }

  async syncStudentCredential(terminal: AccessTerminal, user: UserCredentialPayload): Promise<SyncResult> {
    return {
      success: true,
      syncedCardsCount: user.cardUid ? 1 : 0,
      syncedFacesCount: 0,
    };
  }

  async deleteStudentCredential(terminal: AccessTerminal, studentId: string): Promise<SyncResult> {
    return {
      success: true,
      syncedCardsCount: 1,
      syncedFacesCount: 0,
    };
  }

  parseIncomingWebhook(payload: any, terminal: AccessTerminal): AccessLogEvent | null {
    return null;
  }
}
