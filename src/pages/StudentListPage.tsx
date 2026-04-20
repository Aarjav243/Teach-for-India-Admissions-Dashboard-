import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ChevronRight,
  User,
  School,
  Calendar,
  Plus
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

const StudentListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyStudents, setShowMyStudents] = useState(false);
  const [filters, setFilters] = useState({
    school: '',
    batch: '',
    admission_category: '',
    student_category: ''
  });

  // Fetch unique filter values
  const [filterOptions, setFilterOptions] = useState({
    schools: [] as string[],
    batches: [] as string[],
    admission_categories: [] as string[],
    student_categories: [] as string[]
  });

  useEffect(() => {
    fetchStudents();
    fetchFilterOptions();
  }, [showMyStudents]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admission_students')
        .select(`
          *,
          advisor:profiles(name)
        `)
        .order('name');

      if (showMyStudents && user) {
        query = query.eq('advisor_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const { data } = await supabase.from('admission_students').select('school, batch, admission_category, student_category');
      if (data) {
        const schools = Array.from(new Set(data.map(s => s.school).filter(Boolean)));
        const batches = Array.from(new Set(data.map(s => s.batch?.toString()).filter(Boolean)));
        const admission_categories = Array.from(new Set(data.map(s => s.admission_category).filter(Boolean)));
        const student_categories = Array.from(new Set(data.map(s => s.student_category).filter(Boolean)));
        
        setFilterOptions({ schools, batches, admission_categories, student_categories });
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSchool = !filters.school || s.school === filters.school;
      const matchesBatch = !filters.batch || s.batch?.toString() === filters.batch;
      const matchesAdmissionCat = !filters.admission_category || s.admission_category === filters.admission_category;
      const matchesStudentCat = !filters.student_category || s.student_category === filters.student_category;
      
      return matchesSearch && matchesSchool && matchesBatch && matchesAdmissionCat && matchesStudentCat;
    });
  }, [students, searchTerm, filters]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tfi-dark tracking-tight">Student Database</h1>
          <p className="text-tfi-muted">Manage and track all student admissions in one place.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/students/new')}
          className="btn btn-primary self-start md:self-center"
        >
          <Plus size={20} />
          Add New Student
        </button>
      </div>

      {/* Controls Card */}
      <div className="card space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Toggle Switch */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit border border-gray-200">
            <button
              onClick={() => setShowMyStudents(false)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                !showMyStudents ? "bg-white text-tfi-pink shadow-md" : "text-tfi-muted hover:text-tfi-dark"
              )}
            >
              All Students
            </button>
            <button
              onClick={() => setShowMyStudents(true)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                showMyStudents ? "bg-white text-tfi-pink shadow-md" : "text-tfi-muted hover:text-tfi-dark"
              )}
            >
              My Students
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              className="input pl-11 py-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-tfi-muted uppercase tracking-wider px-1">School</label>
            <select 
              className="input text-sm bg-gray-50/50"
              value={filters.school}
              onChange={(e) => setFilters(f => ({ ...f, school: e.target.value }))}
            >
              <option value="">All Schools</option>
              {filterOptions.schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-tfi-muted uppercase tracking-wider px-1">Batch</label>
            <select 
              className="input text-sm bg-gray-50/50"
              value={filters.batch}
              onChange={(e) => setFilters(f => ({ ...f, batch: e.target.value }))}
            >
              <option value="">All Batches</option>
              {filterOptions.batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-tfi-muted uppercase tracking-wider px-1">Admission Category</label>
            <select 
              className="input text-sm bg-gray-50/50"
              value={filters.admission_category}
              onChange={(e) => setFilters(f => ({ ...f, admission_category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {filterOptions.admission_categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-tfi-muted uppercase tracking-wider px-1">Student Category</label>
            <select 
              className="input text-sm bg-gray-50/50"
              value={filters.student_category}
              onChange={(e) => setFilters(f => ({ ...f, student_category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {filterOptions.student_categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border-none ring-1 ring-gray-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider">Batch & School</th>
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider">Advisor</th>
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider">Admission Status</th>
                <th className="px-6 py-4 text-xs font-bold text-tfi-muted uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-20 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-tfi-muted">
                      <Search size={48} className="opacity-20" />
                      <p className="font-medium">No students found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-tfi-pink/10 text-tfi-pink flex items-center justify-center font-bold text-sm">
                          {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-tfi-dark group-hover:text-tfi-pink transition-colors">{student.name}</p>
                          <p className="text-[11px] text-tfi-muted font-mono uppercase">{student.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-tfi-dark">
                          <Calendar size={12} className="text-tfi-cyan" />
                          Batch {student.batch}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-tfi-muted">
                          <School size={12} />
                          {student.school}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-tfi-dark">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
                          <User size={12} />
                        </div>
                        {student.advisor?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "badge text-white shadow-sm",
                        CATEGORY_COLORS[student.student_category] || "bg-gray-400"
                      )}>
                        {student.student_category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-tfi-dark max-w-[200px] truncate">{student.admission_status}</p>
                        <p className="text-[10px] text-tfi-muted italic truncate max-w-[200px]">{student.college_name || 'No college specified'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-tfi-dark">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-tfi-muted font-medium">
            Showing <span className="text-tfi-dark font-bold">{filteredStudents.length}</span> of <span className="text-tfi-dark font-bold">{students.length}</span> students
          </p>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 text-xs font-bold text-tfi-muted border border-gray-200 rounded-md bg-white disabled:opacity-50">Prev</button>
            <button disabled className="px-3 py-1 text-xs font-bold text-tfi-pink border border-tfi-pink/20 rounded-md bg-tfi-pink/5">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentListPage;
