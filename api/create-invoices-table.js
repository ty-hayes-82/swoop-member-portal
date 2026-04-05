import { sql } from '@vercel/postgres';

function seededRand(seed) {
  let s = ((seed * 1103515245 + 12345) & 0x7fffffff);
  return (s % 10000) / 10000;
}

function padId(n) {
  return String(n).padStart(3, '0');
}

// Quarterly dues by membership type (annual / 4)
const QUARTERLY_DUES = {
  FG: 1125,    // 4500/4
  SOC: 375,    // 1500/4
  SPT: 750,    // 3000/4
  JR: 500,     // 2000/4
  LEG: 1375,   // 5500/4
  NR: 937.50,  // 3750/4
};

// Quarters with invoice/due dates
const QUARTERS = [
  { label: '2025-Q1', invoiceDate: '2025-01-01', dueDate: '2025-01-31' },
  { label: '2025-Q2', invoiceDate: '2025-04-01', dueDate: '2025-04-30' },
  { label: '2025-Q3', invoiceDate: '2025-07-01', dueDate: '2025-07-31' },
  { label: '2025-Q4', invoiceDate: '2025-10-01', dueDate: '2025-10-31' },
  { label: '2026-Q1', invoiceDate: '2026-01-01', dueDate: '2026-01-31' },
];

// Membership type distribution (deterministic by member index)
const MEMBER_TYPES = ['FG', 'SOC', 'SPT', 'JR', 'LEG', 'NR'];

function getMemberType(memberIndex) {
  // Weighted distribution: FG 35%, SOC 20%, SPT 15%, JR 10%, LEG 10%, NR 10%
  const r = seededRand(memberIndex * 7 + 31);
  if (r < 0.35) return 'FG';
  if (r < 0.55) return 'SOC';
  if (r < 0.70) return 'SPT';
  if (r < 0.80) return 'JR';
  if (r < 0.90) return 'LEG';
  return 'NR';
}

// Determine payment behavior category for each member
function getPaymentCategory(memberIndex) {
  // 80% paid, 10% current, 5% past_due_30, 3% past_due_60, 2% past_due_90
  const r = seededRand(memberIndex * 13 + 97);
  if (r < 0.80) return 'paid';
  if (r < 0.90) return 'current';
  if (r < 0.95) return 'past_due_30';
  if (r < 0.98) return 'past_due_60';
  return 'past_due_90';
}

function getCollectionStatus(status) {
  switch (status) {
    case 'past_due_30': return 'reminder_sent';
    case 'past_due_60': return 'second_notice';
    case 'past_due_90': return 'final_notice';
    default: return 'none';
  }
}

function getDaysPastDue(status, quarterIndex) {
  const today = new Date('2026-03-10');
  const dueDate = new Date(QUARTERS[quarterIndex].dueDate);
  const diff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  if (status === 'paid' || status === 'current') return 0;
  return Math.max(diff, 0);
}

function calculateLateFee(amount, daysPastDue) {
  if (daysPastDue <= 0) return 0;
  const monthsPastDue = Math.ceil(daysPastDue / 30);
  return Math.round(amount * 0.015 * monthsPastDue * 100) / 100;
}

// F&B minimum shortfall members (40 members, deterministic)
function isFbShortfallMember(memberIndex) {
  return seededRand(memberIndex * 19 + 53) < 0.1333; // ~40 out of 300
}

function getFbShortfallAmount(memberIndex, quarterIndex) {
  const r = seededRand(memberIndex * 23 + quarterIndex * 37 + 71);
  return Math.round((50 + r * 150) * 100) / 100; // $50-$200
}

// Assessment members (about 30 members get one assessment)
function isAssessmentMember(memberIndex) {
  return seededRand(memberIndex * 29 + 41) < 0.10; // ~30 members
}

function getAssessmentAmount(memberIndex) {
  const r = seededRand(memberIndex * 31 + 67);
  return Math.round((500 + r * 1500) * 100) / 100; // $500-$2000
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS member_invoices (
        invoice_id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL DEFAULT 'dues',
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid',
        paid_date TEXT,
        paid_amount REAL DEFAULT 0,
        days_past_due INTEGER NOT NULL DEFAULT 0,
        late_fee REAL DEFAULT 0,
        collection_status TEXT DEFAULT 'none'
      )
    `;

    // Create index for lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_member ON member_invoices(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON member_invoices(status)`;

    // Clear existing data for idempotent seeding
    await sql`DELETE FROM member_invoices`;

    let totalInserted = 0;

    for (let m = 1; m <= 300; m++) {
      const memberId = `mbr_${padId(m)}`;
      const memberType = getMemberType(m);
      const quarterlyDues = QUARTERLY_DUES[memberType];
      const payCategory = getPaymentCategory(m);

      // Generate quarterly dues invoices
      for (let q = 0; q < QUARTERS.length; q++) {
        const quarter = QUARTERS[q];
        const invoiceId = `INV-${memberId}-DUES-${quarter.label}`;

        let status, paidDate, paidAmount, daysPastDue, lateFee, collectionStatus;

        if (payCategory === 'paid') {
          // All invoices paid on time
          status = 'paid';
          const payDay = 10 + Math.floor(seededRand(m * 41 + q * 7) * 15);
          const dueDateObj = new Date(quarter.dueDate);
          const payDateObj = new Date(dueDateObj);
          payDateObj.setDate(payDateObj.getDate() - (30 - payDay));
          paidDate = payDateObj.toISOString().split('T')[0];
          paidAmount = quarterlyDues;
          daysPastDue = 0;
          lateFee = 0;
          collectionStatus = 'none';
        } else if (payCategory === 'current') {
          // Most paid, latest one is current (not yet due)
          if (q < QUARTERS.length - 1) {
            status = 'paid';
            const payDay = 10 + Math.floor(seededRand(m * 43 + q * 11) * 15);
            const dueDateObj = new Date(quarter.dueDate);
            const payDateObj = new Date(dueDateObj);
            payDateObj.setDate(payDateObj.getDate() - (30 - payDay));
            paidDate = payDateObj.toISOString().split('T')[0];
            paidAmount = quarterlyDues;
            daysPastDue = 0;
            lateFee = 0;
            collectionStatus = 'none';
          } else {
            status = 'current';
            paidDate = null;
            paidAmount = 0;
            daysPastDue = 0;
            lateFee = 0;
            collectionStatus = 'none';
          }
        } else if (payCategory === 'past_due_30') {
          // Last invoice is 30 days past due
          if (q < QUARTERS.length - 1) {
            status = 'paid';
            const payDay = 5 + Math.floor(seededRand(m * 47 + q * 13) * 20);
            const dueDateObj = new Date(quarter.dueDate);
            const payDateObj = new Date(dueDateObj);
            payDateObj.setDate(payDateObj.getDate() + payDay);
            paidDate = payDateObj.toISOString().split('T')[0];
            paidAmount = quarterlyDues;
            daysPastDue = 0;
            lateFee = 0;
            collectionStatus = 'none';
          } else {
            daysPastDue = getDaysPastDue('past_due_30', q);
            status = 'past_due_30';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'reminder_sent';
          }
        } else if (payCategory === 'past_due_60') {
          // Last 2 invoices are late
          if (q < QUARTERS.length - 2) {
            status = 'paid';
            const payDay = 5 + Math.floor(seededRand(m * 51 + q * 17) * 25);
            const dueDateObj = new Date(quarter.dueDate);
            const payDateObj = new Date(dueDateObj);
            payDateObj.setDate(payDateObj.getDate() + payDay);
            paidDate = payDateObj.toISOString().split('T')[0];
            paidAmount = quarterlyDues;
            daysPastDue = 0;
            lateFee = 0;
            collectionStatus = 'none';
          } else if (q === QUARTERS.length - 2) {
            daysPastDue = getDaysPastDue('past_due_60', q);
            status = 'past_due_60';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'second_notice';
          } else {
            daysPastDue = getDaysPastDue('past_due_30', q);
            status = 'past_due_30';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'reminder_sent';
          }
        } else {
          // past_due_90: last 3 invoices are late
          if (q < QUARTERS.length - 3) {
            status = 'paid';
            const payDay = 10 + Math.floor(seededRand(m * 53 + q * 19) * 30);
            const dueDateObj = new Date(quarter.dueDate);
            const payDateObj = new Date(dueDateObj);
            payDateObj.setDate(payDateObj.getDate() + payDay);
            paidDate = payDateObj.toISOString().split('T')[0];
            paidAmount = quarterlyDues;
            daysPastDue = 0;
            lateFee = 0;
            collectionStatus = 'none';
          } else if (q === QUARTERS.length - 3) {
            daysPastDue = getDaysPastDue('past_due_90', q);
            status = 'past_due_90';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'final_notice';
          } else if (q === QUARTERS.length - 2) {
            daysPastDue = getDaysPastDue('past_due_60', q);
            status = 'past_due_60';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'second_notice';
          } else {
            daysPastDue = getDaysPastDue('past_due_30', q);
            status = 'past_due_30';
            paidDate = null;
            paidAmount = 0;
            lateFee = calculateLateFee(quarterlyDues, daysPastDue);
            collectionStatus = 'reminder_sent';
          }
        }

        const description = `${memberType} Membership Dues - ${quarter.label}`;

        await sql`
          INSERT INTO member_invoices (
            invoice_id, member_id, invoice_date, due_date, amount, type,
            description, status, paid_date, paid_amount, days_past_due,
            late_fee, collection_status
          ) VALUES (
            ${invoiceId}, ${memberId}, ${quarter.invoiceDate}, ${quarter.dueDate},
            ${quarterlyDues}, 'dues', ${description}, ${status}, ${paidDate},
            ${paidAmount}, ${daysPastDue}, ${lateFee}, ${collectionStatus}
          )
        `;
        totalInserted++;
      }

      // F&B minimum shortfall invoices
      if (isFbShortfallMember(m)) {
        // 2-4 shortfall invoices spread across quarters
        const shortfallCount = 2 + Math.floor(seededRand(m * 61 + 83) * 3);
        for (let s = 0; s < shortfallCount && s < QUARTERS.length; s++) {
          const qIdx = Math.floor(seededRand(m * 67 + s * 71) * QUARTERS.length);
          const quarter = QUARTERS[qIdx];
          const amount = getFbShortfallAmount(m, s);
          const invoiceId = `INV-${memberId}-FB-${quarter.label}-${s}`;

          const fbStatus = payCategory === 'paid' || payCategory === 'current' ? 'paid' : payCategory;
          const fbPaidDate = fbStatus === 'paid'
            ? new Date(new Date(quarter.dueDate).getTime() + 5 * 86400000).toISOString().split('T')[0]
            : null;

          await sql`
            INSERT INTO member_invoices (
              invoice_id, member_id, invoice_date, due_date, amount, type,
              description, status, paid_date, paid_amount, days_past_due,
              late_fee, collection_status
            ) VALUES (
              ${invoiceId}, ${memberId}, ${quarter.invoiceDate}, ${quarter.dueDate},
              ${amount}, 'fb_minimum',
              ${'F&B Minimum Shortfall - ' + quarter.label},
              ${fbStatus}, ${fbPaidDate},
              ${fbStatus === 'paid' ? amount : 0},
              ${fbStatus === 'paid' ? 0 : getDaysPastDue(fbStatus, qIdx)},
              ${fbStatus === 'paid' ? 0 : calculateLateFee(amount, getDaysPastDue(fbStatus, qIdx))},
              ${fbStatus === 'paid' ? 'none' : getCollectionStatus(fbStatus)}
            )
          `;
          totalInserted++;
        }
      }

      // Assessment invoices (capital improvements)
      if (isAssessmentMember(m)) {
        const amount = getAssessmentAmount(m);
        const invoiceId = `INV-${memberId}-ASSESS-2025`;

        await sql`
          INSERT INTO member_invoices (
            invoice_id, member_id, invoice_date, due_date, amount, type,
            description, status, paid_date, paid_amount, days_past_due,
            late_fee, collection_status
          ) VALUES (
            ${invoiceId}, ${memberId}, '2025-06-01', '2025-07-15',
            ${amount}, 'assessment',
            'Capital Improvement Assessment - Clubhouse Renovation',
            'paid',
            '2025-07-10',
            ${amount},
            0, 0, 'none'
          )
        `;
        totalInserted++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created member_invoices table and inserted ${totalInserted} invoices`,
      breakdown: {
        members: 300,
        quarterlyDuesInvoices: 300 * 5,
        fbShortfallInvoices: '~80-120',
        assessmentInvoices: '~30',
        paymentCategories: {
          fullyPaid: '~240 members (80%)',
          current: '~30 members (10%)',
          pastDue30: '~15 members (5%)',
          pastDue60: '~9 members (3%)',
          pastDue90: '~6 members (2%)',
        },
      },
    });
  } catch (error) {
    console.error('Error creating invoices table:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
