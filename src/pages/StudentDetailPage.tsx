import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Edit3,
  School,
  MapPin,
  Phone,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Building2,
  Trophy
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_COLORS: Record<string, string> = {
  'Green': 'bg-[#B7C930]',
  'Orange': 'bg-[#F59E0B]',
  'Red': 'bg-[#EF5879]',
  'Fee Receipt Pending': 'bg-[#0EC0E2]',
  'With We Care': 'bg-[#8B5CF6]',
};

const StudentDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    const { data } = await supabase
      .from('admission_students')
      .select(`
        *,
        advisor:profiles(name)
      `)
      .eq('id', id)
      .single();
    
    if (data) setStudent(data);
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-tfi-pink font-bold">Loading student details...</div>;
  if (!student) return <div className="p-20 text-center text-red-500 font-bold">Student not found.</div>;

  const InfoItem = ({ icon: Icon, label, value, subValue }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-tfi-pink border border-gray-100 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-tfi-muted uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-tfi-dark">{value || 'Not specified'}</p>
        {subValue && <p className="text-[10px] text-tfi-muted">{subValue}</p>}
      </div>
    </div>
  );

  const StatusItem = ({ label, done, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", done ? "text-tfi-green bg-tfi-green/10" : "text-gray-300 bg-white")}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-bold text-tfi-dark">{label}</span>
      </div>
      {done ? (
        <div className="flex items-center gap-1.5 text-tfi-green">
          <CheckCircle2 size={16} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Done</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-gray-300">
          <XCircle size={16} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Pending</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn btn-ghost px-4 py-2 bg-white shadow-sm">
          <ArrowLeft size={20} />
          Back to List
        </button>
        <button 
          onClick={() => navigate(`/admin/students/${id}/edit`)}
          className="btn btn-primary shadow-lg shadow-tfi-pink/20"
        >
          <Edit3 size={18} />
          Edit Profile
        </button>
      </div>

      {/* Hero Card */}
      <div className="card p-0 overflow-hidden relative border-none ring-1 ring-gray-100">
        <div className="h-32 tfi-gradient opacity-90"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 relative z-10">
            <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-tfi-pink to-tfi-cyan flex items-center justify-center text-4xl font-black text-white shadow-inner">
                {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </div>
            </div>
            <div className="flex-1 space-y-2 mb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-tfi-dark tracking-tight">{student.name}</h1>
                <span className={cn("badge text-white px-4 py-1", CATEGORY_COLORS[student.student_category] || "bg-gray-400")}>
                  {student.student_category}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-tfi-muted font-bold text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-tfi-pink/10 text-tfi-pink flex items-center justify-center text-[10px]">ID</span>
                  {student.student_id}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-tfi-cyan" />
                  Batch {student.batch}
                </div>
                <div className="flex items-center gap-2">
                  <School size={14} className="text-tfi-green" />
                  {student.school}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-400" />
                  {student.org}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-100">
          <div className="p-6 text-center border-r border-gray-100">
            <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest mb-1">Advisor</p>
            <p className="text-lg font-black text-tfi-dark">{student.advisor?.name || 'N/A'}</p>
          </div>
          <div className="p-6 text-center border-r border-gray-100">
            <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest mb-1">Gender</p>
            <p className="text-lg font-black text-tfi-dark">{student.gender || 'N/A'}</p>
          </div>
          <div className="p-6 text-center border-r border-gray-100">
            <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest mb-1">Phone</p>
            <p className="text-lg font-black text-tfi-dark">{student.phone_1 || 'N/A'}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest mb-1">Marks</p>
            <p className="text-lg font-black text-tfi-pink">{student.marks ? `${student.marks}%` : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-8 bg-tfi-cyan rounded-full"></div>
            <h3 className="text-xl font-black text-tfi-dark tracking-tight uppercase">Academic</h3>
          </div>
          <div className="card p-4 space-y-2">
            <InfoItem icon={Trophy} label="Board Marks" value={student.marks ? `${student.marks}%` : 'Pending'} />
            <InfoItem icon={BookOpen} label="Stream" value={student.stream} />
            <InfoItem icon={GraduationCap} label="Eligibility" value={student.eligibility} />
            <InfoItem icon={FileText} label="Seat Number" value={student.seat_number} />
            <InfoItem icon={Building2} label="Entrance Exam Interest" value={student.interested_in_entrance_exam} />
          </div>
        </div>

        {/* Admission Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-8 bg-tfi-pink rounded-full"></div>
            <h3 className="text-xl font-black text-tfi-dark tracking-tight uppercase">Admission</h3>
          </div>
          <div className="card p-4 space-y-2">
            <InfoItem icon={School} label="Admission Category" value={student.admission_category} />
            <InfoItem icon={Building2} label="College Name" value={student.college_name} />
            <InfoItem icon={GraduationCap} label="Final Course" value={student.final_course} subValue={student.course_details} />
            <InfoItem icon={CreditCard} label="Fees Paid" value={student.fees_paid ? `₹${student.fees_paid.toLocaleString()}` : '₹0'} />
            <div className="mt-4 pt-4 border-t border-gray-100">
               <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest px-4 mb-2">Admission Status</p>
               <div className="px-4 py-3 bg-tfi-pink/5 rounded-xl border border-tfi-pink/10">
                 <p className="text-sm font-black text-tfi-pink leading-tight">{student.admission_status}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Follow-up Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-8 bg-tfi-green rounded-full"></div>
            <h3 className="text-xl font-black text-tfi-dark tracking-tight uppercase">Follow-up</h3>
          </div>
          <div className="card p-4 space-y-3">
            <StatusItem label="2Cs Completed" done={student.two_cs} icon={CheckCircle2} />
            <StatusItem label="Student in Touch" done={student.student_in_touch} icon={Phone} />
            <StatusItem label="Fee Receipt Uploaded" done={student.fee_receipt_uploaded} icon={CreditCard} />
            <StatusItem label="Home Visit Required" done={student.home_visit_required} icon={MapPin} />
            <StatusItem label="Home Visit Done" done={student.home_visit_done} icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="card space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tfi-dark text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h3 className="text-xl font-black text-tfi-dark tracking-tight uppercase">Advisor Notes</h3>
          </div>
          <span className="text-xs font-bold text-tfi-muted bg-gray-100 px-4 py-1.5 rounded-full">
            Last Updated: {new Date(student.updated_at).toLocaleDateString()}
          </span>
        </div>
        <div className="bg-gray-50/50 p-8 rounded-2xl border-2 border-dashed border-gray-200">
          {student.notes ? (
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{student.notes}</p>
          ) : (
            <div className="text-center py-10 text-tfi-muted">
              <FileText size={40} className="mx-auto mb-4 opacity-10" />
              <p className="italic">No notes recorded for this student yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;
