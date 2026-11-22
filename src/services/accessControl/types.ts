import {
  AccessTerminal,
  AccessLogEvent,
  AccessControlPolicy,
  AccessCredentialType,
  AccessDecisionType,
  AccessReasonCode,
  Student,
} from '../../types';

export interface DeviceConnectionConfig {
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
  apiKey?: string;
  protocol: 'ISAPI' | 'OpenAPI' | 'HikCentral_Gateway' | 'OSDP' | 'Simulated';
  timeoutMs?: number;
}

export interface ConnectionTestResult {
  connected: boolean;
  status: 'online' | 'offline' | 'simulated' | 'error';
  latencyMs?: number;
  deviceModel?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  errorMessage?: string;
  isSimulated: boolean;
}

export interface UserCredentialPayload {
  studentId: string;
  fullName: string;
  cardUid?: string;
  facePhotoUrl?: string;
  faceBase64?: string;
  validFrom: string;
  validTo: string;
  roomNumber?: string;
  bedIdentifier?: string;
}

export interface SyncResult {
  success: boolean;
  syncedCardsCount: number;
  syncedFacesCount: number;
  error?: string;
  details?: Record<string, any>;
}

export interface AccessEvaluationRequest {
  terminalId: string;
  credentialType: AccessCredentialType;
  credentialValue: string; // Card UID, face feature ID, or student ID
  direction: 'entry' | 'exit';
  timestamp?: string;
  simulatedTime?: string; // Optional time override for demo/testing (e.g. "23:45" to test curfew)
  isSimulated?: boolean;
}

export interface AccessEvaluationResponse {
  decision: AccessDecisionType;
  reasonCode: AccessReasonCode;
  reasonMessage: string;
  student?: {
    id: string;
    fullName: string;
    roomNumber?: string;
    bedNumber?: number | string;
    bedIdentifier?: string;
    floor?: number;
    phone?: string;
    status: string;
    debtAmount: number;
    paidUntil: string;
  };
  terminal: {
    id: string;
    name: string;
    location: string;
    direction: string;
  };
  relayOpenSeconds: number;
  curfewFlagged: boolean;
  debtWarning: boolean;
  logEvent: AccessLogEvent;
}
