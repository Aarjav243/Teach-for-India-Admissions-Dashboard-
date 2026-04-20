import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CheckCircle,
  Clock,
  Award,
  XCircle,
  Home,
  ChevronDown,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3 as BarIcon,
  Calendar
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#EF5879', '#B7C930', '#0EC0E2', '#8B5CF6', '#F59E0B', '#1C1C2E', '#6B7280', '#D1D5DB'];

const STUDENT_CATEGORY_COLORS: Record<string, string> = {
  'Green': '#B7C930',
  'Orange': '#F59E0B',
  'Red': '#EF5879',
  'Fee Receipt Pending': '#0EC0E2',
  'With We Care': '#8B5CF6',
};

const InsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [batches, setBatches] = useState<number[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [showMyStudents, setShowMyStudents] = useState(false);

  useEffect(() => {
    fetchData();
  }, [showMyStudents, selectedBatch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admission_students')
        .select(`
          *,
          advisor:profiles(id, name)
        `);

      if (showMyStudents && user) {
        query = query.eq('advisor_id', user.id);
      }

      if (selectedBatch !== 'All') {
        query = query.eq('batch', parseInt(selectedBatch));
      }

      const { data: students, error } = await query;
      if (error) throw error;
      setData(students || []);

      // Extract unique batches once
      if (batches.length === 0) {
        const uniqueBatches = Array.from(new Set((students || []).map(s => s.batch).filter(Boolean))) as number[];
        setBatches(uniqueBatches.sort());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Metric Computations
  const metrics = useMemo(() => {
    const total = data.length;
    const admitted = data.filter(s => s.admission_category === 'Admission Done').length;
    const feePending = data.filter(s => s.student_category === 'Fee Receipt Pending').length;
    const avgMarks = total > 0 ? (data.reduce((acc, s) => acc + (parseFloat(s.marks) || 0), 0) / data.filter(s => s.marks).length || 0).toFixed(1) : 0;
    const notEligible = data.filter(s => s.eligibility?.startsWith('Not Eligible')).length;
    const homeVisitsPending = data.filter(s => s.home_visit_required && !s.home_visit_done).length;

    return [
      { label: 'Total Students', value: total, icon: Users, color: 'text-tfi-dark', bg: 'bg-gray-100' },
      { label: 'Admission Done %', value: total > 0 ? `${Math.round((admitted / total) * 100)}%` : '0%', icon: CheckCircle, color: 'text-tfi-green', bg: 'bg-tfi-green/10' },
      { label: 'Fee Pending', value: feePending, icon: Clock, color: 'text-tfi-cyan', bg: 'bg-tfi-cyan/10' },
      { label: 'Avg Marks', value: `${avgMarks}%`, icon: Award, color: 'text-tfi-pink', bg: 'bg-tfi-pink/10' },
      { label: 'Not Eligible', value: notEligible, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
      { label: 'Home Visits', value: homeVisitsPending, icon: Home, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];
  }, [data]);

  // Chart Data Preparation
  const admissionCategoryData = useMemo(() => {
    const counts: any = {};
    data.forEach(s => {
      const cat = s.admission_category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [data]);

  const studentCategoryData = useMemo(() => {
    const counts: any = {};
    data.forEach(s => {
      const cat = s.student_category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [data]);

  const statusData = useMemo(() => {
    const counts: any = {};
    data.forEach(s => {
      const status = s.admission_status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] })).sort((a,b) => b.value - a.value);
  }, [data]);

  const eligibilityData = useMemo(() => {
    const counts: any = {};
    data.forEach(s => {
      const el = s.eligibility || 'Unknown';
      counts[el] = (counts[el] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] })).sort((a,b) => b.value - a.value);
  }, [data]);

  const schoolRateData = useMemo(() => {
    const schools: any = {};
    data.forEach(s => {
      if (!s.school) return;
      if (!schools[s.school]) schools[s.school] = { name: s.school, total: 0, admitted: 0 };
      schools[s.school].total++;
      if (s.admission_category === 'Admission Done') schools[s.school].admitted++;
    });
    return Object.values(schools).sort((a: any, b: any) => b.total - a.total).slice(0, 8);
  }, [data]);

  const advisorData = useMemo(() => {
    const advisors: any = {};
    data.forEach(s => {
      const name = s.advisor?.name || 'Unassigned';
      if (!advisors[name]) advisors[name] = { name, total: 0, admitted: 0, pending: 0 };
      advisors[name].total++;
      if (s.admission_category === 'Admission Done') advisors[name].admitted++;
      else advisors[name].pending++;
    });
    return Object.values(advisors).sort((a: any, b: any) => b.total - a.total);
  }, [data]);

  const collegeData = useMemo(() => {
    const colleges: any = {};
    data.forEach(s => {
      if (!s.college_name || s.college_name === 'Other') return;
      colleges[s.college_name] = (colleges[s.college_name] || 0) + 1;
    });
    return Object.keys(colleges)
      .map(name => ({ name, value: colleges[name] }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const orgData = useMemo(() => {
    const counts: any = {};
    data.forEach(s => {
      const org = s.org || 'TFI';
      counts[org] = (counts[org] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 ring-1 ring-black/5">
          <p className="text-xs font-black text-tfi-dark mb-1 uppercase tracking-wider">{payload[0].name}</p>
          <p className="text-sm font-bold text-tfi-pink">{payload[0].value} Students</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-tfi-dark tracking-tight leading-none">Insights <span className="text-tfi-pink">Hub</span></h1>
          <p className="text-tfi-muted font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Real-time Admissions Intelligence</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setShowMyStudents(false)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                !showMyStudents ? "bg-white text-tfi-dark shadow-premium" : "text-tfi-muted hover:text-tfi-dark"
              )}
            >
              Everyone
            </button>
            <button
              onClick={() => setShowMyStudents(true)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                showMyStudents ? "bg-white text-tfi-pink shadow-premium" : "text-tfi-muted hover:text-tfi-dark"
              )}
            >
              My Students
            </button>
          </div>

          <div className="relative">
            <select 
              className="appearance-none bg-white border border-gray-200 px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-tfi-dark shadow-sm focus:ring-2 focus:ring-tfi-pink/20 outline-none pr-12"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="All">All Batches</option>
              {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
            </select>
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-tfi-pink" size={16} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-tfi-muted" size={16} />
          </div>

          <button onClick={fetchData} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={18} className={cn("text-tfi-muted", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="card p-6 border-none ring-1 ring-gray-100 shadow-xl hover:-translate-y-1 transition-transform group">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12", m.bg, m.color)}>
              <m.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-tfi-muted uppercase tracking-widest mb-1">{m.label}</p>
            <p className={cn("text-2xl font-black tracking-tighter", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Row 1 */}
        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-pink/10 text-tfi-pink rounded-lg"><PieIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Admission Category</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={admissionCategoryData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {admissionCategoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-green/10 text-tfi-green rounded-lg"><PieIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Student Pipeline</h3>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={studentCategoryData} innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value">
                  {studentCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STUDENT_CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100">
            {[
              { name: 'Green', color: '#B7C930', desc: 'Admission confirmed & fees paid' },
              { name: 'Orange', color: '#F59E0B', desc: 'In progress, needs follow-up' },
              { name: 'Red', color: '#EF5879', desc: 'At risk, critical attention needed' },
              { name: 'Fee Receipt Pending', color: '#0EC0E2', desc: 'Admitted but fee receipt not uploaded' },
              { name: 'With We Care', color: '#8B5CF6', desc: 'Under We Care special support program' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-black text-tfi-dark uppercase tracking-wide w-32 shrink-0">{item.name}</span>
                <span className="text-[11px] text-tfi-muted">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-cyan/10 text-tfi-cyan rounded-lg"><BarIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Admission Status Breakdown</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={statusData} margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
                <Bar dataKey="value" fill="#EF5879" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-dark/10 text-tfi-dark rounded-lg"><BarIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Eligibility Distribution</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={eligibilityData} margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
                <Bar dataKey="value" fill="#B7C930" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3 */}
        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-pink/10 text-tfi-pink rounded-lg"><BarIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">School-wise Admission Rate</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolRateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#6B7280' }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Students" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="admitted" name="Admitted" fill="#B7C930" radius={[4, 4, 0, 0]} barSize={30} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-cyan/10 text-tfi-cyan rounded-lg"><BarIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Advisor Performance</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advisorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="admitted" name="Admitted" stackId="a" fill="#B7C930" barSize={40} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#EF5879" barSize={40} radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4 */}
        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><BarIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Top Target Colleges</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={collegeData} margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f8' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card border-none shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tfi-dark/10 text-tfi-dark rounded-lg"><PieIcon size={20} /></div>
            <h3 className="text-sm font-black text-tfi-dark uppercase tracking-widest">Organization Split</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orgData} innerRadius={0} outerRadius={110} paddingAngle={0} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {orgData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
