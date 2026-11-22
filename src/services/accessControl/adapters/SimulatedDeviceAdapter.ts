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
 * Simulated Access Control Device Adapter
 * Used for demo testing access decisions before physical hardware is connected.
 * Requirement 6: Clearly separates simulated events from real device events.
 */
export class SimulatedDeviceAdapter implements DeviceAdapter {
  readonly vendor = 'simulated';
  readonly name = 'Royal Campus Virtual Turnstile Simulator';
  readonly supportedProtocols = ['Simulated'];

  async testConnection(config: DeviceConnectionConfig): Promise<ConnectionTestResult> {
    return {
      connected: true,
      status: 'simulated',
      latencyMs: 12,
      deviceModel: 'Royal Campus Virtual MinMoe Simulator (v2.4)',
      firmwareVersion: 'Sim-2026.10',
      serialNumber: 'SIM-RC-TURNSTILE-01',
      isSimulated: true,
    };
  }

  async triggerRelay(terminal: AccessTerminal, durationSeconds: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `[Simulated] Virtual relay open for ${durationSeconds} seconds on ${terminal.name}.`,
    };
  }

  async syncStudentCredential(terminal: AccessTerminal, user: UserCredentialPayload): Promise<SyncResult> {
    return {
      success: true,
      syncedCardsCount: user.cardUid ? 1 : 0,
      syncedFacesCount: user.facePhotoUrl ? 1 : 0,
      details: {
        mode: 'simulated',
        message: `Student ${user.fullName} credentials registered in simulation database.`,
      },
    };
  }

  async deleteStudentCredential(terminal: AccessTerminal, studentId: string): Promise<SyncResult> {
    return {
      success: true,
      syncedCardsCount: 1,
      syncedFacesCount: 1,
    };
  }

  parseIncomingWebhook(payload: any, terminal: AccessTerminal): AccessLogEvent | null {
    return null;
  }
}
