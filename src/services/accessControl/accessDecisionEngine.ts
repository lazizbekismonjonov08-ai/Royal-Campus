import {
  Student,
  AccessTerminal,
  AccessLogEvent,
  AccessControlPolicy,
} from '../../types';
import {
  AccessEvaluationRequest,
  AccessEvaluationResponse,
} from './types';

/**
 * Checks whether the given time HH:mm is inside the curfew interval (e.g. 23:00 - 06:00).
 */
export function isWithinCurfewHours(timeHHMM: string, curfewStart: string, curfewEnd: string): boolean {
  const [h, m] = timeHHMM.split(':').map(Number);
  const currentMinutes = h * 60 + m;

  const [startH, startM] = curfewStart.split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = curfewEnd.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Server-authoritative access rule decision engine.
 * Requirement 3: Keep student status, payment status, access permissions, and access logs in backend.
 * Requirement 8: Enforce access rules on the server side, not only in the frontend.
 * Requirement 6: Clearly separate simulated events from real device events.
 */
export function evaluateAccessDecision(
  req: AccessEvaluationRequest,
  terminal: AccessTerminal,
  students: Student[],
  policy: AccessControlPolicy
): AccessEvaluationResponse {
  const isSimulated = Boolean(req.isSimulated || terminal.isSimulatedOnly);
  const timestamp = req.timestamp || new Date().toISOString();

  // 1. Check if terminal is enabled
  if (!terminal.enabled) {
    const logEvent: AccessLogEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      isSimulated,
      source: isSimulated ? 'simulated_test' : 'hikvision_device',
      terminalId: terminal.id,
      terminalName: terminal.name,
      credentialType: req.credentialType,
      credentialValue: req.credentialValue,
      direction: req.direction,
      decision: 'denied',
      reasonCode: 'DEVICE_DISABLED',
      reasonMessage: 'Terminal ma‘muriyat tomonidan vaqtincha o‘chirilgan.',
      relayTriggered: false,
    };

    return {
      decision: 'denied',
      reasonCode: 'DEVICE_DISABLED',
      reasonMessage: 'Terminal o‘chirilgan',
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: 0,
      curfewFlagged: false,
      debtWarning: false,
      logEvent,
    };
  }

  // 2. Find student by credential
  const cleanCred = req.credentialValue.trim().toLowerCase();
  const student = students.find((s) => {
    if (s.status === 'deleted_pending_purge') return false;

    // Card match
    if (req.credentialType === 'card') {
      const matchRfid = s.rfidCardNumber && s.rfidCardNumber.toLowerCase() === cleanCred;
      const matchId = s.id.toLowerCase() === cleanCred;
      const matchPass = s.passportNumber.toLowerCase() === cleanCred;
      return matchRfid || matchId || matchPass;
    }

    // Face match
    if (req.credentialType === 'face') {
      const matchId = s.id.toLowerCase() === cleanCred;
      const matchName = s.fullName.toLowerCase().includes(cleanCred) || cleanCred.includes(s.fullName.toLowerCase());
      return matchId || matchName;
    }

    // QR or PIN
    return s.id.toLowerCase() === cleanCred || s.phone.replace(/\D/g, '') === cleanCred.replace(/\D/g, '');
  });

  // If student credential not recognized
  if (!student) {
    const logEvent: AccessLogEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      isSimulated,
      source: isSimulated ? 'simulated_test' : 'hikvision_device',
      terminalId: terminal.id,
      terminalName: terminal.name,
      credentialType: req.credentialType,
      credentialValue: req.credentialValue,
      direction: req.direction,
      decision: 'denied',
      reasonCode: 'CREDENTIAL_NOT_FOUND',
      reasonMessage: 'Karta yoki biometrik ma‘lumot bazada topilmadi. Noma‘lum shaxs.',
      relayTriggered: false,
    };

    return {
      decision: 'denied',
      reasonCode: 'CREDENTIAL_NOT_FOUND',
      reasonMessage: 'Noma‘lum karta yoki yuz tanib olinmadi',
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: 0,
      curfewFlagged: false,
      debtWarning: false,
      logEvent,
    };
  }

  // 3. Check student enrollment status
  if (student.status !== 'active') {
    const logEvent: AccessLogEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      isSimulated,
      source: isSimulated ? 'simulated_test' : 'hikvision_device',
      terminalId: terminal.id,
      terminalName: terminal.name,
      studentId: student.id,
      studentName: student.fullName,
      studentRoom: student.roomNumber,
      credentialType: req.credentialType,
      credentialValue: req.credentialValue,
      direction: req.direction,
      decision: 'denied',
      reasonCode: 'STUDENT_INACTIVE',
      reasonMessage: `Talabalik holati faol emas (${student.status}). Kirish taqiqlanadi.`,
      relayTriggered: false,
    };

    return {
      decision: 'denied',
      reasonCode: 'STUDENT_INACTIVE',
      reasonMessage: 'Talaba hisobi nofaol holatda',
      student: {
        id: student.id,
        fullName: student.fullName,
        roomNumber: student.roomNumber,
        bedNumber: student.bedNumber,
        bedIdentifier: student.bedIdentifier,
        floor: student.floor,
        phone: student.phone,
        status: student.status,
        debtAmount: student.debtAmount,
        paidUntil: student.paidUntil,
      },
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: 0,
      curfewFlagged: false,
      debtWarning: false,
      logEvent,
    };
  }

  // Check administrative suspension
  if (student.accessStatus === 'suspended' || student.accessStatus === 'blocked') {
    const logEvent: AccessLogEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      isSimulated,
      source: isSimulated ? 'simulated_test' : 'hikvision_device',
      terminalId: terminal.id,
      terminalName: terminal.name,
      studentId: student.id,
      studentName: student.fullName,
      studentRoom: student.roomNumber,
      credentialType: req.credentialType,
      credentialValue: req.credentialValue,
      direction: req.direction,
      decision: 'denied',
      reasonCode: 'STUDENT_SUSPENDED',
      reasonMessage: 'Xavfsizlik xizmati yoki ma‘muriyat tomonidan kirish bloklangan.',
      relayTriggered: false,
    };

    return {
      decision: 'denied',
      reasonCode: 'STUDENT_SUSPENDED',
      reasonMessage: 'Yotoqxona kirish huquqi bloklangan',
      student: {
        id: student.id,
        fullName: student.fullName,
        roomNumber: student.roomNumber,
        status: student.status,
        debtAmount: student.debtAmount,
        paidUntil: student.paidUntil,
      },
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: 0,
      curfewFlagged: false,
      debtWarning: false,
      logEvent,
    };
  }

  // 4. Check active bed assignment
  if (policy.requireActiveBedAssignment && (!student.roomId || !student.bedId)) {
    const logEvent: AccessLogEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      isSimulated,
      source: isSimulated ? 'simulated_test' : 'hikvision_device',
      terminalId: terminal.id,
      terminalName: terminal.name,
      studentId: student.id,
      studentName: student.fullName,
      credentialType: req.credentialType,
      credentialValue: req.credentialValue,
      direction: req.direction,
      decision: 'denied',
      reasonCode: 'NO_ROOM_ASSIGNED',
      reasonMessage: 'Talabaga yotoqxonada xona va o‘rin biriktirilmagan. Qabulxonaga murojaat qiling.',
      relayTriggered: false,
    };

    return {
      decision: 'denied',
      reasonCode: 'NO_ROOM_ASSIGNED',
      reasonMessage: 'Xona biriktirilmagan',
      student: {
        id: student.id,
        fullName: student.fullName,
        phone: student.phone,
        status: student.status,
        debtAmount: student.debtAmount,
        paidUntil: student.paidUntil,
      },
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: 0,
      curfewFlagged: false,
      debtWarning: false,
      logEvent,
    };
  }

  // 5. Check payment status & debt policy
  let debtWarning = false;
  if (student.debtAmount > 0) {
    if (policy.overduePaymentPolicy === 'deny_all_debtors') {
      const logEvent: AccessLogEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp,
        isSimulated,
        source: isSimulated ? 'simulated_test' : 'hikvision_device',
        terminalId: terminal.id,
        terminalName: terminal.name,
        studentId: student.id,
        studentName: student.fullName,
        studentRoom: student.roomNumber,
        credentialType: req.credentialType,
        credentialValue: req.credentialValue,
        direction: req.direction,
        decision: 'denied',
        reasonCode: 'PAYMENT_OVERDUE_BLOCKED',
        reasonMessage: `Yotoqxona to‘lovi qarzdorligi sababli kirish cheklangan (${student.debtAmount.toLocaleString()} so‘m).`,
        relayTriggered: false,
        debtWarning: true,
      };

      return {
        decision: 'denied',
        reasonCode: 'PAYMENT_OVERDUE_BLOCKED',
        reasonMessage: 'To‘lov qarzdorligi mavjud',
        student: {
          id: student.id,
          fullName: student.fullName,
          roomNumber: student.roomNumber,
          bedIdentifier: student.bedIdentifier,
          phone: student.phone,
          status: student.status,
          debtAmount: student.debtAmount,
          paidUntil: student.paidUntil,
        },
        terminal: {
          id: terminal.id,
          name: terminal.name,
          location: terminal.location,
          direction: terminal.direction,
        },
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: true,
        logEvent,
      };
    }
    debtWarning = true;
  }

  // 6. Check curfew hours
  const now = new Date();
  const timeString = req.simulatedTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  let curfewFlagged = false;

  if (policy.curfewEnabled && req.direction === 'entry') {
    const isCurfew = isWithinCurfewHours(timeString, policy.curfewStart, policy.curfewEnd);
    if (isCurfew) {
      if (policy.curfewAction === 'deny') {
        const logEvent: AccessLogEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp,
          isSimulated,
          source: isSimulated ? 'simulated_test' : 'hikvision_device',
          terminalId: terminal.id,
          terminalName: terminal.name,
          studentId: student.id,
          studentName: student.fullName,
          studentRoom: student.roomNumber,
          credentialType: req.credentialType,
          credentialValue: req.credentialValue,
          direction: req.direction,
          decision: 'denied',
          reasonCode: 'CURFEW_HOURS_VIOLATION',
          reasonMessage: `Komendantlik soati (${policy.curfewStart} - ${policy.curfewEnd}). Kechki kirish taqiqlangan.`,
          curfewFlagged: true,
          relayTriggered: false,
        };

        return {
          decision: 'denied',
          reasonCode: 'CURFEW_HOURS_VIOLATION',
          reasonMessage: 'Komendantlik soati buzilishi (Kechki kirish taqiqlangan)',
          student: {
            id: student.id,
            fullName: student.fullName,
            roomNumber: student.roomNumber,
            bedIdentifier: student.bedIdentifier,
            phone: student.phone,
            status: student.status,
            debtAmount: student.debtAmount,
            paidUntil: student.paidUntil,
          },
          terminal: {
            id: terminal.id,
            name: terminal.name,
            location: terminal.location,
            direction: terminal.direction,
          },
          relayOpenSeconds: 0,
          curfewFlagged: true,
          debtWarning,
          logEvent,
        };
      } else {
        curfewFlagged = true;
      }
    }
  }

  // 7. Grant Access!
  const relaySeconds = terminal.relayHoldSeconds || policy.relayDefaultDuration || 5;
  const reasonMessage = curfewFlagged
    ? 'Kirishga ruxsat berildi (Kech qolish qayd etildi)'
    : debtWarning
    ? 'Kirish tasdiqlandi (To‘lov bo‘yicha ogohlantirish)'
    : 'Kirish tasdiqlandi. Xush kelibsiz!';

  const logEvent: AccessLogEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp,
    isSimulated,
    source: isSimulated ? 'simulated_test' : 'hikvision_device',
    terminalId: terminal.id,
    terminalName: terminal.name,
    studentId: student.id,
    studentName: student.fullName,
    studentRoom: student.roomNumber,
    credentialType: req.credentialType,
    credentialValue: req.credentialValue,
    direction: req.direction,
    decision: 'granted',
    reasonCode: 'ACCESS_OK',
    reasonMessage,
    curfewFlagged,
    debtWarning,
    relayTriggered: true,
  };

  return {
    decision: 'granted',
    reasonCode: 'ACCESS_OK',
    reasonMessage,
    student: {
      id: student.id,
      fullName: student.fullName,
      roomNumber: student.roomNumber,
      bedNumber: student.bedNumber,
      bedIdentifier: student.bedIdentifier,
      floor: student.floor,
      phone: student.phone,
      status: student.status,
      debtAmount: student.debtAmount,
      paidUntil: student.paidUntil,
    },
    terminal: {
      id: terminal.id,
      name: terminal.name,
      location: terminal.location,
      direction: terminal.direction,
    },
    relayOpenSeconds: relaySeconds,
    curfewFlagged,
    debtWarning,
    logEvent,
  };
}
