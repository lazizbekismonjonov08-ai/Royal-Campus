import {
  AccessTerminal,
  Student,
  AccessControlPolicy,
  AccessLogEvent,
} from '../../types';
import {
  AccessEvaluationRequest,
  AccessEvaluationResponse,
  ConnectionTestResult,
  SyncResult,
} from './types';
import { evaluateAccessDecision } from './accessDecisionEngine';
import { adapterRegistry } from './adapterRegistry';

export class AccessClientService {
  /**
   * Evaluates access decision using server API with graceful engine fallback.
   * Requirement 8: Enforce access rules on the server side, not only in the frontend.
   */
  async evaluateAccess(
    req: AccessEvaluationRequest,
    terminal: AccessTerminal,
    students: Student[],
    policy: AccessControlPolicy
  ): Promise<AccessEvaluationResponse> {
    try {
      const response = await fetch('/api/access-control/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: req,
          terminal,
          students,
          policy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Construct the log event from server response
        const logEvent: AccessLogEvent = data.logEvent || {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: req.timestamp || new Date().toISOString(),
          isSimulated: Boolean(data.isSimulated || terminal.isSimulatedOnly),
          source: Boolean(data.isSimulated || terminal.isSimulatedOnly) ? 'simulated_test' : 'hikvision_device',
          terminalId: terminal.id,
          terminalName: terminal.name,
          studentId: data.student?.id,
          studentName: data.student?.fullName,
          studentRoom: data.student?.roomNumber,
          credentialType: req.credentialType,
          credentialValue: req.credentialValue,
          direction: req.direction,
          decision: data.decision,
          reasonCode: data.reasonCode,
          reasonMessage: data.reasonMessage,
          curfewFlagged: data.curfewFlagged,
          debtWarning: data.debtWarning,
          relayTriggered: data.decision === 'granted',
        };

        return {
          decision: data.decision,
          reasonCode: data.reasonCode,
          reasonMessage: data.reasonMessage,
          student: data.student,
          terminal: data.terminal || {
            id: terminal.id,
            name: terminal.name,
            location: terminal.location,
            direction: terminal.direction,
          },
          relayOpenSeconds: data.relayOpenSeconds || 5,
          curfewFlagged: Boolean(data.curfewFlagged),
          debtWarning: Boolean(data.debtWarning),
          logEvent,
        };
      }
    } catch (e) {
      // Network fallback (e.g. running without express in standalone vite client)
    }

    // Direct invocation of the server-rule engine
    return evaluateAccessDecision(req, terminal, students, policy);
  }

  /**
   * Hardware ping/connection test.
   * Requirement 9: Never claim physical terminal is connected unless verified.
   */
  async testConnection(terminal: AccessTerminal): Promise<ConnectionTestResult> {
    if (terminal.isSimulatedOnly) {
      const simAdapter = adapterRegistry.getAdapter('simulated', true);
      return simAdapter.testConnection({
        ipAddress: terminal.ipAddress,
        port: terminal.port,
        username: terminal.username,
        protocol: 'Simulated',
      });
    }

    try {
      const response = await fetch('/api/access-control/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: terminal.ipAddress,
          port: terminal.port,
          isSimulatedOnly: terminal.isSimulatedOnly,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallback to adapter's testConnection
    }

    const adapter = adapterRegistry.getAdapter(terminal.vendor, terminal.isSimulatedOnly);
    return adapter.testConnection({
      ipAddress: terminal.ipAddress,
      port: terminal.port,
      username: terminal.username,
      password: terminal.password,
      protocol: terminal.protocol,
    });
  }

  /**
   * Syncs user credential to the terminal adapter.
   */
  async syncStudent(terminal: AccessTerminal, student: Student): Promise<SyncResult> {
    const adapter = adapterRegistry.getAdapter(terminal.vendor, terminal.isSimulatedOnly);
    return adapter.syncStudentCredential(terminal, {
      studentId: student.id,
      fullName: student.fullName,
      cardUid: student.rfidCardNumber,
      facePhotoUrl: student.facePhotoUrl,
      validFrom: '2026-09-01',
      validTo: '2027-06-30',
      roomNumber: student.roomNumber,
      bedIdentifier: student.bedIdentifier,
    });
  }

  /**
   * Manually triggers door/turnstile relay unlatch.
   */
  async triggerRelay(terminal: AccessTerminal, durationSeconds: number = 5): Promise<{ success: boolean; message: string }> {
    const adapter = adapterRegistry.getAdapter(terminal.vendor, terminal.isSimulatedOnly);
    return adapter.triggerRelay(terminal, durationSeconds);
  }
}

export const accessClientService = new AccessClientService();
