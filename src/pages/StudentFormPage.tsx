import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  User, 
  BookOpen, 
  School, 
  PhoneCall, 
  FileText, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'admission', label: 'Admission', icon: School },
  { id: 'followup', label: 'Follow-up', icon: PhoneCall },
  { id: 'notes', label: 'Notes', icon: FileText },
];

const StudentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advisors, setAdvisors] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    student_id: '',
    name: '',
    school: '',
    batch: 2024,
    org: '',
    advisor_id: null,
    gender: '',
    phone_1: '',
    phone_2: '',
    email: '',
    mother_name: '',
    marks: '',
    stream: '',
    seat_number: '',
    eligibility: 'Eligible',
    interested_in_entrance_exam: '',
    student_category: 'Green',
    admission_category: 'Admission Not Done',
    admission_status: 'Unreachable',
    final_course: '',
    course_details: '',
    college_name: '',
    fees_paid: 0,
    fee_receipt_uploaded: false,
    two_cs: false,
    student_in_touch: false,
    home_visit_required: false,
    home_visit_done: false,
    notes: ''
  });

  useEffect(() => {
    fetchAdvisors();
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const fetchAdvisors = async () => {
    const { data } = await supabase.from('profiles').select('id, name').eq('role', 'admission_advisor');
    setAdvisors(data || []);
  };

  const fetchStudent = async () => {
    setLoading(true);
    const { data } = await supabase.from('admission_students').select('*').eq('id', id).single();
    if (data) setFormData(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (id) {
        const { error } = await supabase.from('admission_students').update(formData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admission_students').insert(formData);
        if (error) throw error;
      }
      navigate('/admin/students');
    } catch (err: any) {
      setError(err.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading form...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-tfi-dark">{id ? 'Edit Student' : 'Add New Student'}</h1>
            <p className="text-tfi-muted">{id ? `Updating record for ${formData.name}` : 'Fill in the details below to create a new record'}</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={saving}
          className="btn btn-primary px-8 py-3"
        >
          {saving ? 'Saving...' : (
            <>
              <Save size={20} />
              Save Record
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 border-2",
                activeTab === tab.id 
                  ? "bg-tfi-pink/5 border-tfi-pink text-tfi-pink" 
                  : "bg-white border-transparent text-tfi-muted hover:bg-gray-50"
              )}
            >
              <tab.icon size={18} />
              <span className="flex-1 text-left">{tab.label}</span>
              {/* Optional completion indicator */}
              <div className="w-2 h-2 rounded-full bg-tfi-green shadow-sm"></div>
            </button>
          ))}
        </aside>

        {/* Form Content */}
        <div className="flex-1 card p-8 min-h-[500px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Student ID *</label>
                  <input type="text" name="student_id" required className="input" value={formData.student_id} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Full Name *</label>
                  <input type="text" name="name" required className="input" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">School</label>
                  <input type="text" name="school" className="input" value={formData.school} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Batch</label>
                  <input type="number" name="batch" className="input" value={formData.batch} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Organization</label>
                  <input type="text" name="org" className="input" value={formData.org} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Advisor</label>
                  <select name="advisor_id" className="input" value={formData.advisor_id || ''} onChange={handleChange}>
                    <option value="">Select Advisor</option>
                    {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Gender</label>
                  <select name="gender" className="input" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Phone 1</label>
                  <input type="text" name="phone_1" className="input" value={formData.phone_1} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Phone 2</label>
                  <input type="text" name="phone_2" className="input" value={formData.phone_2} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Email Address</label>
                  <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Mother's Name</label>
                  <input type="text" name="mother_name" className="input" value={formData.mother_name} onChange={handleChange} />
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Marks (Percentage)</label>
                  <input type="number" step="0.01" name="marks" className="input" value={formData.marks} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Stream</label>
                  <input type="text" name="stream" className="input" value={formData.stream} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Seat Number</label>
                  <input type="text" name="seat_number" className="input" value={formData.seat_number} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Eligibility</label>
                  <select name="eligibility" className="input" value={formData.eligibility} onChange={handleChange}>
                    {[
                      'Eligible','Hall ticket Not submitted','Not Eligible - ATKT',
                      'Not Eligible - Gap year','Not Eligible - Others',
                      'Not Eligible - Student doing Diploma','Not Eligible - Student in grade 11'
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Interested in Entrance Exam?</label>
                  <input type="text" name="interested_in_entrance_exam" className="input" value={formData.interested_in_entrance_exam} onChange={handleChange} />
                </div>
              </div>
            )}

            {activeTab === 'admission' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Student Category</label>
                  <select name="student_category" className="input" value={formData.student_category} onChange={handleChange}>
                    {['Green','Orange','Red','Fee Receipt Pending','With We Care'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Admission Category</label>
                  <select name="admission_category" className="input" value={formData.admission_category} onChange={handleChange}>
                    {['Admission Done','Admission Not Done','CET/NEET/JEE','Fee Receipt Pending','Green','Pick up Next Year','Red'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Admission Status</label>
                  <select name="admission_status" className="input" value={formData.admission_status} onChange={handleChange}>
                    {[
                      'Confirmed Admission & Fees paid','Confirmed Admission but fees not paid',
                      'Applied through Inhouse Quota','Waiting for direct admissions',
                      'Waiting for competitive exams (CET/NEET)','Preparing for competitive exam',
                      'Don\'t want to study','want to take a gap year','Unreachable'
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Final Course</label>
                  <input type="text" name="final_course" className="input" value={formData.final_course} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Course Details</label>
                  <input type="text" name="course_details" className="input" value={formData.course_details} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">College Name</label>
                  <input type="text" name="college_name" className="input" value={formData.college_name} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-tfi-muted uppercase tracking-wider">Fees Paid</label>
                  <input type="number" name="fees_paid" className="input" value={formData.fees_paid} onChange={handleChange} />
                </div>
                <div className="md:col-span-2 py-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" name="fee_receipt_uploaded" className="sr-only peer" checked={formData.fee_receipt_uploaded} onChange={handleChange} />
                      <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-tfi-green transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                    <span className="text-sm font-bold text-tfi-dark group-hover:text-tfi-pink transition-colors">Fee Receipt Uploaded</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {[
                  { name: 'two_cs', label: '2Cs Completed' },
                  { name: 'student_in_touch', label: 'Student in Touch' },
                  { name: 'home_visit_required', label: 'Home Visit Required' },
                  { name: 'home_visit_done', label: 'Home Visit Done' },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-tfi-pink/30 hover:bg-gray-50 transition-all cursor-pointer group">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      formData[item.name] ? "bg-tfi-green text-white shadow-lg shadow-tfi-green/20" : "bg-gray-100 text-gray-400"
                    )}>
                      {formData[item.name] ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-tfi-dark group-hover:text-tfi-pink">{item.label}</p>
                      <p className="text-xs text-tfi-muted">{formData[item.name] ? 'Marked as completed' : 'Action pending'}</p>
                    </div>
                    <input type="checkbox" name={item.name} className="sr-only" checked={formData[item.name]} onChange={handleChange} />
                    <div className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                      formData[item.name] ? "bg-tfi-pink border-tfi-pink" : "border-gray-200"
                    )}>
                      {formData[item.name] && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-tfi-pink" />
                  <h3 className="font-bold text-tfi-dark">Advisor Notes</h3>
                </div>
                <textarea
                  name="notes"
                  className="input min-h-[300px] resize-none p-6 leading-relaxed"
                  placeholder="Record interactions, specific student needs, or any follow-up details here..."
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
                <p className="text-xs text-tfi-muted italic">Notes are automatically associated with your advisor profile and the student record.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentFormPage;
