import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CSV_FILE = './for Suraj - Admission Data.xlsx - Master Tracker.csv';

// PM Credentials (Change these to your PM account after creating it via SQL)
const PM_EMAIL = 'admin@tfi.admissions';
const PM_PASSWORD = 'TFI@2024';

async function importData() {
  console.log('🚀 Starting TFI Admissions Import...');

  // 1. Sign in as PM (needed for RLS)
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: PM_EMAIL,
    password: PM_PASSWORD,
  });

  if (authError) {
    console.error('❌ Auth Error:', authError.message);
    console.log('Please ensure you have created the PM account via SQL first.');
    return;
  }

  console.log('✅ Signed in as PM');

  // 2. Fetch Advisors for mapping
  const { data: profiles } = await supabase.from('profiles').select('id, name');
  const advisorMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.name.toUpperCase()]: p.id }), {});

  const students = [];
  const advisorAssignments = {
    'HD': [], 'KG': [], 'SK': [], 'VS': []
  };

  // 3. Read and Parse CSV
  const parser = fs.createReadStream(CSV_FILE).pipe(
    parse({
      delimiter: ',',
      from_line: 2, // Skip header
      relax_column_count: true
    })
  );

  let count = 0;

  for await (const row of parser) {
    try {
      // Split student_id:NAME
      const idNamePart = row[2] || '';
      const [student_id, ...nameParts] = idNamePart.split(':');
      const name = nameParts.join(':') || 'Unknown';

      // Advisor Mapping
      const advisorCode = (row[6] || '').toUpperCase();
      const advisor_id = advisorMap[advisorCode] || null;

      // College Fallback
      let college = row[24] || '';
      if (!college || college === 'Other') {
        college = row[25] || college;
      }

      const t = (v) => (v || '').trim();
      const student = {
        email: t(row[1]),
        student_id: student_id.trim(),
        name: name.trim(),
        school: t(row[3]),
        batch: parseInt(row[4]) || 2024,
        org: t(row[7]),
        advisor_id: advisor_id,
        gender: t(row[8]),
        phone_1: t(row[9]),
        phone_2: t(row[10]),
        student_category: t(row[11]),
        interested_in_entrance_exam: t(row[12]),
        two_cs: t(row[13]).toLowerCase() === 'true',
        student_in_touch: t(row[14]).toLowerCase() === 'true',
        seat_number: t(row[15]),
        mother_name: t(row[16]),
        marks: parseFloat(t(row[17]).replace(/,/g, '')) || 0,
        stream: t(row[18]),
        eligibility: t(row[19]),
        admission_category: t(row[20]),
        admission_status: t(row[21]),
        final_course: t(row[22]),
        course_details: t(row[23]),
        college_name: t(college),
        fees_paid: parseInt(t(row[26]).replace(/,/g, '')) || 0,
        fee_receipt_uploaded: t(row[27]).toLowerCase() === 'true',
        notes: t(row[28]),
        home_visit_required: t(row[29]).toLowerCase() === 'true',
        home_visit_done: t(row[30]).toLowerCase() === 'true'
      };

      if (student.student_id) {
        students.push(student);
        if (advisorCode && advisorAssignments[advisorCode]) {
           advisorAssignments[advisorCode].push(student.student_id);
        }
      }

      count++;
      if (count % 50 === 0) console.log(`📦 Processed ${count} rows...`);
    } catch (err) {
      console.warn(`⚠️ Error parsing row ${count + 2}:`, err.message);
    }
  }

  console.log(`✨ Parsed ${students.length} students. Starting Upsert...`);

  // 4. Batch Upsert (Max 100 per call for safety)
  const batchSize = 100;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const { error } = await supabase
      .from('admission_students')
      .upsert(batch, { onConflict: 'student_id' });

    if (error) {
      console.error(`❌ Upsert Error at batch ${i}:`, error.message);
    } else {
      console.log(`✅ Upserted batch ${i / batchSize + 1}`);
    }
  }

  // 5. Bulk Assign Advisors (One update per advisor)
  console.log('👥 Finalizing advisor assignments...');
  for (const [code, ids] of Object.entries(advisorAssignments)) {
    if (ids.length === 0) continue;
    const advId = advisorMap[code];
    if (!advId) continue;

    const { error } = await supabase
      .from('admission_students')
      .update({ advisor_id: advId })
      .in('student_id', ids);

    if (error) {
      console.error(`❌ Advisor Assignment Error (${code}):`, error.message);
    } else {
      console.log(`✅ Assigned ${ids.length} students to ${code}`);
    }
  }

  console.log('🎉 Import Complete!');
}

importData();
