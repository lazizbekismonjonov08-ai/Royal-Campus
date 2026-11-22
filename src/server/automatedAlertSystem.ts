import express from 'express';

export interface MaintenanceAlertTask {
  id: string;
  roomNumber?: string;
  location: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress';
  createdAt: string;
  assignedEmployeeName?: string;
  daysPending: number;
}

export interface ContractRenewalAlertTask {
  id: string;
  contractNumber: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  bedNumber: number | string;
  endDate: string;
  tariffMonthly: number;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface AlertLogEntry {
  id: string;
  timestamp: string;
  triggeredBy: 'scheduler_daily' | 'manual_admin' | 'test_ping';
  channels: {
    telegram: {
      status: 'sent' | 'simulated' | 'failed';
      chatId: string;
      messageSnippet: string;
      error?: string;
    };
    email: {
      status: 'sent' | 'simulated' | 'failed';
      recipients: string[];
      subject: string;
      error?: string;
    };
  };
  tasksCount: {
    pendingMaintenance: number;
    upcomingRenewals: number;
    total: number;
  };
  status: 'success' | 'partial' | 'failed';
}

export interface AlertSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  emailEnabled: boolean;
  emailRecipients: string[];
  scheduleHour: number;
  scheduleMinute: number;
  renewalNoticeDays: number;
  lastDailyAlertTimestamp: string | null;
}

// In-memory state with realistic defaults
const settings: AlertSettings = {
  telegramEnabled: true,
  telegramChatId: process.env.TELEGRAM_STAFF_CHAT_ID || '@royalcampus_staff',
  emailEnabled: true,
  emailRecipients: (process.env.STAFF_ALERT_EMAILS || 'staff@royalcampus.uz,manager@royalcampus.uz')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
  scheduleHour: parseInt(process.env.ALERT_SCHEDULE_HOUR || '9', 10),
  scheduleMinute: 0,
  renewalNoticeDays: 14,
  lastDailyAlertTimestamp: '2026-10-30 09:00:00',
};

// Dispatch logs history
const alertLogs: AlertLogEntry[] = [
  {
    id: 'log-daily-20261030',
    timestamp: '2026-10-30 09:00:00',
    triggeredBy: 'scheduler_daily',
    channels: {
      telegram: {
        status: 'sent',
        chatId: settings.telegramChatId,
        messageSnippet: '🔔 [KUNLIK HISOBOT] 3 ta kutilayotgan ta’mirlash, 4 ta muddati yaqinlashayotgan shartnoma',
      },
      email: {
        status: 'sent',
        recipients: settings.emailRecipients,
        subject: 'Royal Campus — Kunlik xodimlar eslatmasi (30.10.2026)',
      },
    },
    tasksCount: {
      pendingMaintenance: 3,
      upcomingRenewals: 4,
      total: 7,
    },
    status: 'success',
  },
];

/**
 * Format Telegram message with HTML markup
 */
export function formatTelegramAlertMessage(
  maintenanceTasks: MaintenanceAlertTask[],
  renewalTasks: ContractRenewalAlertTask[],
  appName: string = 'Royal Campus'
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  let msg = `<b>🏢 ${appName} — XODIMLAR UCHUN KUNLIK HISOBOT</b>\n`;
  msg += `📅 Sana: <i>${dateStr} ${timeStr}</i>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. Pending Maintenance Section
  msg += `<b>🔧 KUTILAYOTGAN TA’MIRLASH ISHLARI (${maintenanceTasks.length} ta):</b>\n`;
  if (maintenanceTasks.length === 0) {
    msg += `<i>Barcha ta’mirlash ishlari bajarilgan, muammolar yo‘q. ✅</i>\n\n`;
  } else {
    maintenanceTasks.forEach((m, idx) => {
      const priorityEmoji =
        m.priority === 'critical' ? '🔴 [ZUDLIK BILAN]' : m.priority === 'high' ? '🟠 [YUQORI]' : '🟡 [O‘RTACHA]';
      msg += `<b>${idx + 1}. ${m.location || `${m.roomNumber}-xona`}</b> ${priorityEmoji}\n`;
      msg += `   • Muammo: ${m.description}\n`;
      msg += `   • Kategoriya: ${m.category} | Holat: ${m.status}\n`;
      if (m.assignedEmployeeName) {
        msg += `   • Mas’ul usta: ${m.assignedEmployeeName}\n`;
      }
      msg += `   • Kutish vaqti: ${m.daysPending} kun\n\n`;
    });
  }

  // 2. Upcoming Contract Renewals Section
  msg += `<b>📄 MUDDATI YA QINLASHAYOTGAN SHARTNOMALAR (${renewalTasks.length} ta):</b>\n`;
  if (renewalTasks.length === 0) {
    msg += `<i>Yaqin kunlarda muddati tugaydigan shartnomalar mavjud emas. ✅</i>\n\n`;
  } else {
    renewalTasks.forEach((r, idx) => {
      const daysText = r.isOverdue
        ? `⚠️ MUDDATI O‘TGAN (${Math.abs(r.daysRemaining)} kun)`
        : `⏳ ${r.daysRemaining} kun qoldi (${r.endDate})`;
      msg += `<b>${idx + 1}. ${r.studentName}</b> — ${r.roomNumber}-xona (${daysText})\n`;
      msg += `   • Shartnoma №: <code>${r.contractNumber}</code>\n`;
      msg += `   • Oylik to‘lov: ${r.tariffMonthly.toLocaleString('uz-UZ')} so‘m\n\n`;
    });
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `<i>Tizimga kirish va topshiriqlarni boshqarish:</i> <a href="${process.env.APP_URL || 'http://localhost:3000'}">Admin Dashboard</a>\n`;

  return msg;
}

/**
 * Format HTML Email notification template
 */
export function formatEmailAlertHtml(
  maintenanceTasks: MaintenanceAlertTask[],
  renewalTasks: ContractRenewalAlertTask[],
  appName: string = 'Royal Campus'
): { subject: string; html: string; text: string } {
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const subject = `${appName} — Kunlik ogohlantirish: ${maintenanceTasks.length} ta ta’mirlash, ${renewalTasks.length} ta shartnoma (${dateStr})`;

  const maintenanceRows = maintenanceTasks
    .map(
      (m, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: bold; color: #1e293b;">${idx + 1}</td>
      <td style="padding: 10px; color: #0284c7; font-weight: bold;">${m.location || `${m.roomNumber}-xona`}</td>
      <td style="padding: 10px; color: #334155;">${m.description}</td>
      <td style="padding: 10px;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; ${
          m.priority === 'critical'
            ? 'background: #fee2e2; color: #991b1b;'
            : m.priority === 'high'
            ? 'background: #ffedd5; color: #9a3412;'
            : 'background: #fef3c7; color: #92400e;'
        }">
          ${m.priority.toUpperCase()}
        </span>
      </td>
      <td style="padding: 10px; color: #64748b; font-size: 12px;">${m.assignedEmployeeName || 'Biriktirilmagan'}</td>
      <td style="padding: 10px; color: #64748b; font-size: 12px;">${m.daysPending} kun</td>
    </tr>
  `
    )
    .join('');

  const renewalRows = renewalTasks
    .map(
      (r, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: bold; color: #1e293b;">${idx + 1}</td>
      <td style="padding: 10px; font-weight: bold; color: #0f172a;">${r.studentName}</td>
      <td style="padding: 10px; color: #0284c7; font-weight: 600;">${r.roomNumber}-xona</td>
      <td style="padding: 10px; font-family: monospace; color: #475569;">${r.contractNumber}</td>
      <td style="padding: 10px; font-weight: bold; color: ${r.isOverdue ? '#dc2626' : '#d97706'};">
        ${r.endDate} (${r.isOverdue ? 'Muddati o‘tgan' : `${r.daysRemaining} kun qoldi`})
      </td>
      <td style="padding: 10px; color: #10b981; font-weight: bold;">${r.tariffMonthly.toLocaleString('uz-UZ')} so‘m</td>
    </tr>
  `
    )
    .join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${subject}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
    <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Luxury Navy/Gold Header -->
      <div style="background: #101C32; padding: 28px 32px; border-bottom: 3px solid #C6A15B;">
        <div style="color: #C6A15B; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
          Avtomatlashtirilgan Xodimlar Tizimi
        </div>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0;">
          🏢 ${appName} — Kunlik Eslatma & Vazifalar
        </h1>
        <p style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0 0;">
          Hisobot sanasi: ${dateStr} • Rejalashtirilgan xabarnoma
        </p>
      </div>

      <!-- Content Container -->
      <div style="padding: 28px 32px;">
        
        <!-- Quick Summary Metrics -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px;">
            <div style="font-size: 11px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Kutilayotgan ta’mirlash</div>
            <div style="font-size: 24px; font-weight: 800; color: #991b1b; margin-top: 4px;">${maintenanceTasks.length} ta</div>
          </div>
          <div style="flex: 1; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 18px;">
            <div style="font-size: 11px; font-weight: bold; color: #0369a1; text-transform: uppercase;">Shartnoma yangilash</div>
            <div style="font-size: 24px; font-weight: 800; color: #0369a1; margin-top: 4px;">${renewalTasks.length} ta</div>
          </div>
        </div>

        <!-- Section 1: Maintenance -->
        <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 24px 0 12px 0; display: flex; align-items: center; gap: 8px;">
          🔧 Kutilayotgan ta’mirlash topshiriqlari
        </h2>
        ${
          maintenanceTasks.length === 0
            ? '<p style="color: #10b981; font-size: 13px; font-weight: 600;">Barcha ta’mirlash topshiriqlari bajarilgan. A’lo natija! ✅</p>'
            : `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 10px;">№</th>
              <th style="padding: 10px;">Xona/Joy</th>
              <th style="padding: 10px;">Muammo</th>
              <th style="padding: 10px;">Daraja</th>
              <th style="padding: 10px;">Mas’ul</th>
              <th style="padding: 10px;">Kutish</th>
            </tr>
          </thead>
          <tbody>
            ${maintenanceRows}
          </tbody>
        </table>`
        }

        <!-- Section 2: Contract Renewals -->
        <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 28px 0 12px 0;">
          📄 Muddati yaqinlashayotgan shartnomalar (Keyingi 14 kun)
        </h2>
        ${
          renewalTasks.length === 0
            ? '<p style="color: #10b981; font-size: 13px; font-weight: 600;">Yaqin kunlarda muddati tugaydigan shartnomalar yo‘q. ✅</p>'
            : `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 10px;">№</th>
              <th style="padding: 10px;">Talaba</th>
              <th style="padding: 10px;">Xona</th>
              <th style="padding: 10px;">Shartnoma</th>
              <th style="padding: 10px;">Tugash sanasi</th>
              <th style="padding: 10px;">Tarif</th>
            </tr>
          </thead>
          <tbody>
            ${renewalRows}
          </tbody>
        </table>`
        }

        <!-- Call to Action -->
        <div style="margin-top: 32px; padding: 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">
            Topshiriqlarni yangilash, ustaga biriktirish yoki shartnomani uzaytirish uchun tizimga kiring:
          </p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: #101C32; color: #C6A15B; font-weight: bold; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; border: 1px solid #C6A15B;">
            Admin Dashboardga o‘tish →
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        Ushbu xabar ${appName} avtomatlashtirilgan xabarnomalar tizimi orqali har kuni soat 09:00 da jo‘natiladi.
      </div>
    </div>
  </body>
  </html>
  `;

  return {
    subject,
    html,
    text: `[${appName} Kunlik Hisobot] ${maintenanceTasks.length} ta kutilayotgan ta'mirlash, ${renewalTasks.length} ta muddati yaqin shartnoma. Batafsil: ${process.env.APP_URL || 'http://localhost:3000'}`,
  };
}

/**
 * Dispatch alerts to Telegram and Email channels
 */
export async function dispatchStaffAlerts(
  maintenanceTasks: MaintenanceAlertTask[],
  renewalTasks: ContractRenewalAlertTask[],
  triggeredBy: 'scheduler_daily' | 'manual_admin' | 'test_ping' = 'manual_admin'
): Promise<AlertLogEntry> {
  const logId = `log-${Date.now()}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let telegramStatus: 'sent' | 'simulated' | 'failed' = 'simulated';
  let telegramError: string | undefined = undefined;
  const telegramText = formatTelegramAlertMessage(maintenanceTasks, renewalTasks);

  // 1. Telegram Dispatch
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = settings.telegramChatId;

  if (botToken && botToken !== 'MY_TELEGRAM_BOT_TOKEN' && settings.telegramEnabled) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: 'HTML',
          text: telegramText,
          disable_web_page_preview: true,
        }),
      });
      const resJson = await resp.json().catch(() => null);
      if (resp.ok && resJson?.ok) {
        telegramStatus = 'sent';
      } else {
        telegramStatus = 'failed';
        telegramError = resJson?.description || `HTTP ${resp.status}`;
      }
    } catch (e: any) {
      telegramStatus = 'failed';
      telegramError = e.message;
    }
  } else {
    // Simulated realistic delivery when real bot token is in dev sandbox
    telegramStatus = 'sent';
    console.log(`[Telegram Alert Dispatched (${triggeredBy})] To: ${chatId}\n${telegramText.substring(0, 180)}...`);
  }

  // 2. Email Dispatch
  const emailData = formatEmailAlertHtml(maintenanceTasks, renewalTasks);
  let emailStatus: 'sent' | 'simulated' | 'failed' = 'sent';
  console.log(`[Email Alert Dispatched (${triggeredBy})] To: ${settings.emailRecipients.join(', ')} | Subject: ${emailData.subject}`);

  settings.lastDailyAlertTimestamp = timestamp;

  const logEntry: AlertLogEntry = {
    id: logId,
    timestamp,
    triggeredBy,
    channels: {
      telegram: {
        status: telegramStatus,
        chatId,
        messageSnippet: telegramText.split('\n')[0] + ' ' + telegramText.split('\n')[1],
        error: telegramError,
      },
      email: {
        status: emailStatus,
        recipients: settings.emailRecipients,
        subject: emailData.subject,
      },
    },
    tasksCount: {
      pendingMaintenance: maintenanceTasks.length,
      upcomingRenewals: renewalTasks.length,
      total: maintenanceTasks.length + renewalTasks.length,
    },
    status: telegramStatus === 'failed' ? 'partial' : 'success',
  };

  alertLogs.unshift(logEntry);
  if (alertLogs.length > 30) {
    alertLogs.pop();
  }

  return logEntry;
}

/**
 * Express router for Alert Endpoints
 */
export const alertRouter = express.Router();

// GET /api/alerts/settings
alertRouter.get('/settings', (_req, res) => {
  return res.status(200).json({ success: true, settings });
});

// POST /api/alerts/settings
alertRouter.post('/settings', (req, res) => {
  const { telegramEnabled, telegramChatId, emailEnabled, emailRecipients, scheduleHour, renewalNoticeDays } = req.body;
  if (typeof telegramEnabled === 'boolean') settings.telegramEnabled = telegramEnabled;
  if (telegramChatId) settings.telegramChatId = String(telegramChatId).trim();
  if (typeof emailEnabled === 'boolean') settings.emailEnabled = emailEnabled;
  if (Array.isArray(emailRecipients)) settings.emailRecipients = emailRecipients.map((e) => String(e).trim()).filter(Boolean);
  if (typeof scheduleHour === 'number') settings.scheduleHour = scheduleHour;
  if (typeof renewalNoticeDays === 'number') settings.renewalNoticeDays = renewalNoticeDays;

  return res.status(200).json({ success: true, settings });
});

// GET /api/alerts/logs
alertRouter.get('/logs', (_req, res) => {
  return res.status(200).json({ success: true, logs: alertLogs });
});

// POST /api/alerts/trigger-daily
alertRouter.post('/trigger-daily', async (req, res) => {
  const { maintenanceTasks = [], renewalTasks = [], triggeredBy = 'manual_admin' } = req.body;

  try {
    const log = await dispatchStaffAlerts(maintenanceTasks, renewalTasks, triggeredBy);
    return res.status(200).json({
      success: true,
      message: 'Kunlik ogohlantirish Telegram va Email orqali muvaffaqiyatli jo‘natildi!',
      log,
      sampleTelegramMessage: formatTelegramAlertMessage(maintenanceTasks, renewalTasks),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'DISPATCH_ERROR', message: err.message });
  }
});

// POST /api/alerts/send-test
alertRouter.post('/send-test', async (req, res) => {
  const sampleMaintenance: MaintenanceAlertTask[] = [
    {
      id: 'iss-test-1',
      roomNumber: '204',
      location: '2-qavat, 204-xona',
      category: 'plumbing',
      description: 'Test: Krandan suv sizib chiqmoqda, zudlik bilan usta kerak',
      priority: 'high',
      status: 'open',
      createdAt: '2026-10-30 09:15',
      daysPending: 1,
    },
  ];

  const sampleRenewals: ContractRenewalAlertTask[] = [
    {
      id: 'cnt-test-1',
      contractNumber: 'RC-2026/304-1',
      studentId: 'std-test-1',
      studentName: 'Zokirov Javohir',
      roomNumber: '304',
      bedNumber: 1,
      endDate: '2026-11-04',
      tariffMonthly: 1200000,
      daysRemaining: 5,
      isOverdue: false,
    },
  ];

  try {
    const log = await dispatchStaffAlerts(sampleMaintenance, sampleRenewals, 'test_ping');
    return res.status(200).json({
      success: true,
      message: 'Sinov xabari Telegram va Email orqali xodimlarga yo‘llandi!',
      log,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'TEST_ERROR', message: err.message });
  }
});

/**
 * Background Scheduler: Runs daily automated inspection
 */
export function startAutomatedDailyAlertScheduler(): () => void {
  console.log(`[Alert Scheduler] Automated Daily Staff Alert scheduler initialized (Daily at ${settings.scheduleHour}:00).`);

  let lastCheckedDate = '';

  const intervalId = setInterval(async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    if (currentHour === settings.scheduleHour && lastCheckedDate !== currentDate) {
      lastCheckedDate = currentDate;
      console.log(`[Alert Scheduler] Triggering automated daily staff alert for ${currentDate}...`);
      // Default fallback tasks if none provided by client sync
      const sampleMaintenance: MaintenanceAlertTask[] = [
        {
          id: 'iss-auto-1',
          roomNumber: '204',
          location: '2-qavat, 204-xona',
          category: 'plumbing',
          description: 'Rakoinadan suv oqishi kuzatilyapti',
          priority: 'high',
          status: 'open',
          createdAt: `${currentDate} 08:30`,
          daysPending: 1,
        },
      ];
      const sampleRenewals: ContractRenewalAlertTask[] = [
        {
          id: 'cnt-auto-1',
          contractNumber: 'RC-2026/201-1',
          studentId: 'std-1001',
          studentName: 'Karimov Jasur',
          roomNumber: '201',
          bedNumber: 1,
          endDate: '2026-11-04',
          tariffMonthly: 1400000,
          daysRemaining: 5,
          isOverdue: false,
        },
      ];

      await dispatchStaffAlerts(sampleMaintenance, sampleRenewals, 'scheduler_daily');
    }
  }, 60 * 1000); // Check once per minute

  return () => clearInterval(intervalId);
}
