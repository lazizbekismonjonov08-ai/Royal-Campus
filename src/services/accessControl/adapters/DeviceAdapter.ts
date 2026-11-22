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

export interface DeviceAdapter {
  readonly vendor: string;
  readonly name: string;
  readonly supportedProtocols: string[];

  /**
   * Test physical or simulated connection to device.
   * Requirement 9: NEVER claim physical terminal is connected unless hardware ping succeeds.
   */
  testConnection(config: DeviceConnectionConfig): Promise<ConnectionTestResult>;

  /**
   * Trigger the physical or simulated door/turnstile relay.
   */
  triggerRelay(terminal: AccessTerminal, durationSeconds: number): Promise<{ success: boolean; message: string }>;

  /**
   * Sync a student's card credential or face photo to the terminal.
   */
  syncStudentCredential(terminal: AccessTerminal, user: UserCredentialPayload): Promise<SyncResult>;

  /**
   * Delete student credentials from terminal (e.g. upon checkout or purge).
   */
  deleteStudentCredential(terminal: AccessTerminal, studentId: string): Promise<SyncResult>;

  /**
   * Parse incoming event webhook stream payload from terminal into standardized AccessLogEvent.
   */
  parseIncomingWebhook(payload: any, terminal: AccessTerminal): AccessLogEvent | null;
}
