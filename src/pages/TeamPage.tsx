import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Mail, Plus, AlertCircle, X, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TeamPage: React.FC = () => {
  const { profile } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admission_advisor'
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Fetch profiles and count their students
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*').order('role', { ascending: false });
      if (pError) throw pError;

      const { data: counts, error: cError } = await supabase.from('admission_students').select('advisor_id');
      if (cError) throw cError;

      const studentCounts = (counts || []).reduce((acc: any, curr: any) => {
        if (curr.advisor_id) acc[curr.advisor_id] = (acc[curr.advisor_id] || 0) + 1;
        return acc;
      }, {});

      setTeam(profiles?.map(p => ({ ...p, studentCount: studentCounts[p.id] || 0 })) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);

    try {
      // 1. Save current session
      const { data: { session: oldSession } } = await supabase.auth.getSession();

      // 2. Sign up new user
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      // 3. Restore session
      if (oldSession) {
        await supabase.auth.setSession({
          access_token: oldSession.access_token,
          refresh_token: oldSession.refresh_token
        });
      }

      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'admission_advisor' });
      fetchTeam();
    } catch (err: any) {
      setError(err.message || 'Error adding team member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-tfi-dark tracking-tight">Team Management</h1>
          <p className="text-tfi-muted font-medium">Manage advisor accounts and track their student workload.</p>
        </div>
        {profile?.role === 'program_manager' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary shadow-xl shadow-tfi-pink/20">
            <Plus size={20} />
            Add Team Member
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden ring-1 ring-gray-100 border-none shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-tfi-muted uppercase tracking-widest">Member</th>
              <th className="px-8 py-5 text-xs font-black text-tfi-muted uppercase tracking-widest">Role</th>
              <th className="px-8 py-5 text-xs font-black text-tfi-muted uppercase tracking-widest">Assigned Students</th>
              <th className="px-8 py-5 text-xs font-black text-tfi-muted uppercase tracking-widest">Joined On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse"><td colSpan={4} className="h-20 bg-gray-50/50"></td></tr>
              ))
            ) : team.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-black text-tfi-dark shadow-inner">
                      {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-tfi-dark leading-tight">{member.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-tfi-muted font-medium mt-0.5">
                        <Mail size={12} className="text-tfi-cyan" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "badge px-4 py-1",
                    member.role === 'program_manager' ? "bg-tfi-pink text-white" : "bg-tfi-cyan/10 text-tfi-cyan border border-tfi-cyan/20"
                  )}>
                    {member.role?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-tfi-green" style={{ width: `${Math.min(100, (member.studentCount / 150) * 100)}%` }}></div>
                    </div>
                    <span className="text-sm font-black text-tfi-dark">{member.studentCount}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-tfi-muted">
                  {new Date(member.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-tfi-dark/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="card w-full max-w-lg relative z-10 shadow-2xl animate-fade-in p-8 border-none ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-tfi-pink flex items-center justify-center text-white shadow-lg shadow-tfi-pink/30">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-tfi-dark tracking-tight">New Member</h2>
                  <p className="text-tfi-muted text-sm font-medium tracking-tight">Grant access to the admissions portal.</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tfi-muted uppercase tracking-widest px-1">Full Name</label>
                <input required type="text" className="input" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tfi-muted uppercase tracking-widest px-1">Email Address</label>
                <input required type="email" className="input" placeholder="name@tfi.admissions" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tfi-muted uppercase tracking-widest px-1">Temporary Password</label>
                <input required type="password" minLength={6} className="input" placeholder="••••••••" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tfi-muted uppercase tracking-widest px-1">Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, role: 'admission_advisor' }))}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold transition-all",
                      formData.role === 'admission_advisor' ? "bg-tfi-cyan/5 border-tfi-cyan text-tfi-cyan" : "bg-white border-gray-100 text-tfi-muted"
                    )}
                  >
                    Advisor
                    {formData.role === 'admission_advisor' && <Check size={16} />}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, role: 'program_manager' }))}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold transition-all",
                      formData.role === 'program_manager' ? "bg-tfi-pink/5 border-tfi-pink text-tfi-pink" : "bg-white border-gray-100 text-tfi-muted"
                    )}
                  >
                    Manager
                    {formData.role === 'program_manager' && <Check size={16} />}
                  </button>
                </div>
              </div>

              <button disabled={adding} type="submit" className="w-full btn btn-primary py-4 text-lg mt-4">
                {adding ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserCheck size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
