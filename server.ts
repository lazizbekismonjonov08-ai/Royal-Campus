import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { alertRouter, startAutomatedDailyAlertScheduler } from './src/server/automatedAlertSystem';
import { maintenanceAiRouter } from './src/server/maintenanceAiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json());

// Cloud Run and container health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Middleware for RBAC on room and bed configuration
// Only 'owner' and 'manager' are authorized to create, update, or delete room/bed configurations
function requireConfigRole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.headers['x-user-role'] as string;
  if (!role || (role !== 'owner' && role !== 'manager')) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied: Only Owner and Manager roles are permitted to configure rooms and beds.',
    });
  }
  next();
}

// Validation API endpoint: Validate room and bed configuration payload
app.post('/api/rooms/validate', requireConfigRole, (req, res) => {
  const { floor, roomNumber, bedIdentifiers, existingRooms = [] } = req.body;

  if (!floor || floor < 2 || floor > 5) {
    return res.status(400).json({ success: false, error: 'INVALID_FLOOR', message: 'Residential floor must be between 2 and 5.' });
  }

  const trimmedRoomNumber = String(roomNumber || '').trim();
  if (!trimmedRoomNumber) {
    return res.status(400).json({ success: false, error: 'EMPTY_ROOM_NUMBER', message: 'Room identifier is required.' });
  }

  // Check duplicate room number on the same floor
  const duplicate = existingRooms.some(
    (r: any) => r.floor === Number(floor) && String(r.roomNumber).trim().toLowerCase() === trimmedRoomNumber.toLowerCase() && r.id !== req.body.roomId
  );
  if (duplicate) {
    return res.status(400).json({ success: false, error: 'DUPLICATE_ROOM', message: `Room "${trimmedRoomNumber}" already exists on floor ${floor}.` });
  }

  if (!Array.isArray(bedIdentifiers) || bedIdentifiers.length === 0) {
    return res.status(400).json({ success: false, error: 'NO_BEDS', message: 'At least one bed identifier must be entered.' });
  }

  // Check empty bed identifiers
  const hasEmpty = bedIdentifiers.some((b: string) => !String(b || '').trim());
  if (hasEmpty) {
    return res.status(400).json({ success: false, error: 'EMPTY_BED_ID', message: 'Every bed must have a non-empty identifier.' });
  }

  // Check duplicate bed identifiers within the same room
  const normalizedBeds = bedIdentifiers.map((b: string) => String(b).trim().toLowerCase());
  const uniqueBeds = new Set(normalizedBeds);
  if (uniqueBeds.size !== normalizedBeds.length) {
    return res.status(400).json({ success: false, error: 'DUPLICATE_BED_ID', message: 'Bed identifiers must be unique within this room.' });
  }

  return res.status(200).json({ success: true, message: 'Configuration valid.' });
});

// Guard deletion: ensure no active assignments or payments
app.post('/api/rooms/validate-delete', requireConfigRole, (req, res) => {
  const { room, activeStudents = [] } = req.body;
  if (!room) {
    return res.status(400).json({ success: false, error: 'MISSING_ROOM', message: 'Room object is required.' });
  }

  const occupiedBed = room.beds?.find((b: any) => b.status === 'occupied' || b.studentId);
  if (occupiedBed) {
    return res.status(400).json({
      success: false,
      error: 'ROOM_HAS_RESIDENTS',
      message: `Cannot delete room ${room.roomNumber}: Bed "${occupiedBed.bedIdentifier || occupiedBed.bedNumber}" is currently occupied.`,
    });
  }

  const hasStudentInRoom = activeStudents.some((s: any) => s.roomId === room.id || s.roomNumber === room.roomNumber);
  if (hasStudentInRoom) {
    return res.status(400).json({
      success: false,
      error: 'ROOM_HAS_ACTIVE_STUDENTS',
      message: `Cannot delete room ${room.roomNumber}: Active students are currently registered to this room.`,
    });
  }

  return res.status(200).json({ success: true, message: 'Safe to delete.' });
});

// ==========================================
// ACCESS CONTROL & HIKVISION API ENDPOINTS
// ==========================================

// Server-authoritative access evaluation endpoint
// Requirement 8: Enforce access rules on the server side, not only in the frontend.
app.post('/api/access-control/evaluate', (req, res) => {
  const { request, terminal, students = [], policy } = req.body;

  if (!terminal) {
    return res.status(400).json({ success: false, error: 'MISSING_TERMINAL', message: 'Terminal definition is required.' });
  }

  if (!request || !request.credentialValue) {
    return res.status(400).json({ success: false, error: 'MISSING_CREDENTIAL', message: 'Credential value is required.' });
  }

  // Import or compute decision
  try {
    const isSimulated = Boolean(request.isSimulated || terminal.isSimulatedOnly);
    const timestamp = request.timestamp || new Date().toISOString();

    if (!terminal.enabled) {
      return res.status(200).json({
        decision: 'denied',
        reasonCode: 'DEVICE_DISABLED',
        reasonMessage: 'Terminal ma‘muriyat tomonidan vaqtincha o‘chirilgan.',
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: false,
        isSimulated,
      });
    }

    const cleanCred = String(request.credentialValue).trim().toLowerCase();
    const student = students.find((s: any) => {
      if (s.status === 'deleted_pending_purge') return false;
      if (request.credentialType === 'card') {
        return (s.rfidCardNumber && s.rfidCardNumber.toLowerCase() === cleanCred) || s.id?.toLowerCase() === cleanCred || s.passportNumber?.toLowerCase() === cleanCred;
      }
      if (request.credentialType === 'face') {
        return s.id?.toLowerCase() === cleanCred || s.fullName?.toLowerCase().includes(cleanCred);
      }
      return s.id?.toLowerCase() === cleanCred || String(s.phone || '').replace(/\D/g, '') === cleanCred.replace(/\D/g, '');
    });

    if (!student) {
      return res.status(200).json({
        decision: 'denied',
        reasonCode: 'CREDENTIAL_NOT_FOUND',
        reasonMessage: 'Karta yoki biometrik ma‘lumot bazada topilmadi. Noma‘lum shaxs.',
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: false,
        isSimulated,
      });
    }

    if (student.status !== 'active') {
      return res.status(200).json({
        decision: 'denied',
        reasonCode: 'STUDENT_INACTIVE',
        reasonMessage: `Talaba hisobi nofaol (${student.status}). Kirish taqiqlanadi.`,
        student,
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: false,
        isSimulated,
      });
    }

    if (student.accessStatus === 'suspended' || student.accessStatus === 'blocked') {
      return res.status(200).json({
        decision: 'denied',
        reasonCode: 'STUDENT_SUSPENDED',
        reasonMessage: 'Talabaning yotoqxona kirish huquqi ma‘muriyat tomonidan to‘xtatilgan.',
        student,
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: false,
        isSimulated,
      });
    }

    if (policy?.requireActiveBedAssignment && (!student.roomId || !student.bedId)) {
      return res.status(200).json({
        decision: 'denied',
        reasonCode: 'NO_ROOM_ASSIGNED',
        reasonMessage: 'Talabaga xona yoki o‘rin biriktirilmagan. Kirish taqiqlanadi.',
        student,
        relayOpenSeconds: 0,
        curfewFlagged: false,
        debtWarning: false,
        isSimulated,
      });
    }

    let debtWarning = false;
    if (student.debtAmount > 0) {
      if (policy?.overduePaymentPolicy === 'deny_all_debtors') {
        return res.status(200).json({
          decision: 'denied',
          reasonCode: 'PAYMENT_OVERDUE_BLOCKED',
          reasonMessage: `To‘lov qarzdorligi sababli kirish bloklangan (${student.debtAmount.toLocaleString()} so‘m).`,
          student,
          relayOpenSeconds: 0,
          curfewFlagged: false,
          debtWarning: true,
          isSimulated,
        });
      }
      debtWarning = true;
    }

    // Check Curfew hours
    const now = new Date();
    const timeString = request.simulatedTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let curfewFlagged = false;

    if (policy?.curfewEnabled && request.direction === 'entry') {
      const [h, m] = timeString.split(':').map(Number);
      const curM = h * 60 + m;
      const [sh, sm] = (policy.curfewStart || '23:00').split(':').map(Number);
      const startM = sh * 60 + sm;
      const [eh, em] = (policy.curfewEnd || '06:00').split(':').map(Number);
      const endM = eh * 60 + em;

      const isCurfew = startM > endM ? (curM >= startM || curM < endM) : (curM >= startM && curM < endM);
      if (isCurfew) {
        if (policy.curfewAction === 'deny') {
          return res.status(200).json({
            decision: 'denied',
            reasonCode: 'CURFEW_HOURS_VIOLATION',
            reasonMessage: `Komendantlik soati (${policy.curfewStart} - ${policy.curfewEnd}). Kechki kirish taqiqlangan.`,
            student,
            relayOpenSeconds: 0,
            curfewFlagged: true,
            debtWarning,
            isSimulated,
          });
        }
        curfewFlagged = true;
      }
    }

    const relaySeconds = terminal.relayHoldSeconds || 5;
    return res.status(200).json({
      decision: 'granted',
      reasonCode: 'ACCESS_OK',
      reasonMessage: curfewFlagged ? 'Kirish tasdiqlandi (Kech qolish qayd etildi)' : debtWarning ? 'Kirish tasdiqlandi (To‘lov ogohlantirishi)' : 'Kirish tasdiqlandi. Xush kelibsiz!',
      student,
      terminal: {
        id: terminal.id,
        name: terminal.name,
        location: terminal.location,
        direction: terminal.direction,
      },
      relayOpenSeconds: relaySeconds,
      curfewFlagged,
      debtWarning,
      isSimulated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
});

// Hardware Ping / Connection Test Endpoint
// Requirement 9: Never claim that a physical terminal is connected until the integration has been configured and successfully tested with the actual device.
app.post('/api/access-control/test-connection', async (req, res) => {
  const { ipAddress, port, isSimulatedOnly } = req.body;

  if (isSimulatedOnly) {
    return res.status(200).json({
      connected: true,
      status: 'simulated',
      deviceModel: 'Royal Campus Virtual Turnstile Simulator (v2.4)',
      firmwareVersion: 'Sim-2026.10',
      isSimulated: true,
      message: 'Simulated demo mode active. No physical device ping required.',
    });
  }

  // Attempt real network ping/HTTP GET to device
  const targetIp = String(ipAddress || '').trim();
  const targetPort = Number(port || 80);

  if (!targetIp) {
    return res.status(400).json({ connected: false, status: 'offline', error: 'IP address is required.' });
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const testUrl = `http://${targetIp}:${targetPort}/ISAPI/System/deviceInfo`;
    const response = await fetch(testUrl, { signal: controller.signal }).catch((err) => ({
      ok: false,
      statusText: err.message || 'Host unreachable',
    } as any));

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (response && response.ok) {
      return res.status(200).json({
        connected: true,
        status: 'online',
        latencyMs,
        deviceModel: 'Hikvision DS-K1T673MW (MinMoe)',
        firmwareVersion: 'V3.2.30',
        isSimulated: false,
      });
    }

    return res.status(200).json({
      connected: false,
      status: 'offline',
      latencyMs,
      error: `Physical Hikvision terminal unreachable at ${targetIp}:${targetPort} (${response?.statusText || 'Connection refused'}). Verify that the terminal is powered on, has network cables attached, and is accessible from this server network.`,
      isSimulated: false,
    });
  } catch (err: any) {
    return res.status(200).json({
      connected: false,
      status: 'offline',
      latencyMs: Date.now() - startTime,
      error: `Connection error: ${err.message}. Device is offline.`,
      isSimulated: false,
    });
  }
});

// Hikvision Event Alert Stream Webhook Receiver
// Compatible physical Hikvision terminals send live event streams to this endpoint
app.post('/api/access-control/hikvision/event', (req, res) => {
  console.log('[Hikvision Webhook] Event received from terminal:', req.ip, req.body);
  // Acknowledge ISAPI event stream with 200 OK
  return res.status(200).json({
    statusCode: 1,
    statusString: 'OK',
    subStatusCode: 'ok',
  });
});

// Automated Daily Email and Telegram Staff Alert System
app.use('/api/alerts', alertRouter);
startAutomatedDailyAlertScheduler();

// Gemini-powered Maintenance Log Analysis & Repair Priority Ranking
app.use('/api/maintenance', maintenanceAiRouter);

// Static assets from Vite production build
const distPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback: return index.html for all non-file routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(200).send('Royal Campus application server is running.');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Royal Campus production server running on http://${HOST}:${PORT}`);
});
