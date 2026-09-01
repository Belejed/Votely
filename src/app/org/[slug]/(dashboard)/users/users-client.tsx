'use client';

import React, { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Lock, 
  UsersRound,
  CheckCircle2,
  ShieldAlert,
  Eye,
  User
} from 'lucide-react';
import { createStaffUserAction, deleteStaffUserAction } from './actions';

interface StaffUserProps {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'STAFF' | 'OBSERVER';
  createdAt: string;
}

interface UsersClientPageProps {
  users: StaffUserProps[];
  slug: string;
  currentUserId: string;
  orgName: string;
}

export default function UsersClientPage({ users: initialUsers, slug, currentUserId, orgName }: UsersClientPageProps) {
  const [users, setUsers] = useState<StaffUserProps[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'OBSERVER'>('STAFF');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setStatusMsg({ type: 'danger', text: 'Harap lengkapi semua kolom form.' });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await createStaffUserAction(slug, { name, username, password, role });
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else if (res?.success && res.user) {
        setStatusMsg({ type: 'success', text: `Akun panitia "${res.user.name}" (${res.user.username}) berhasil dibuat!` });
        setUsers(prev => [...prev, res.user as any]);
        setName('');
        setUsername('');
        setPassword('');
        setShowAddForm(false);
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun panitia "${userName}"?`)) return;

    setStatusMsg(null);
    startTransition(async () => {
      const res = await deleteStaffUserAction(slug, userId);
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else if (res?.success) {
        setStatusMsg({ type: 'success', text: `Akun panitia "${userName}" berhasil dihapus.` });
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-display font-extrabold text-text-main">Panitia & Staff</h3>
            <Badge variant="info" className="font-extrabold text-[10px] uppercase">
              {users.length} Akun Aktif
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Kelola akun panitia pemilihan, operator bilik suara, dan saksi untuk {orgName}.
          </p>
        </div>

        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="button-gradient gap-2 h-11 px-5 shadow-md shadow-brand-primary/10 font-bold"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>{showAddForm ? 'Tutup Form' : 'Tambah Panitia Baru'}</span>
        </Button>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
            statusMsg.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </motion.div>
      )}

      {/* Add Committee Member Drawer Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-2 border-brand-primary/20 bg-card shadow-xl rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-main">Buat Akun Panitia Baru</h4>
                  <p className="text-xs text-text-muted">Panitia dapat login ke sistem menggunakan Username dan Password.</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Input
                    label="Nama Lengkap / Jabatan Petugas"
                    placeholder="e.g. Ahmad (Petugas Bilik 1)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="Username Login"
                    placeholder="e.g. bilik1 / operator"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />

                  <Input
                    label="Password (min 6 karakter)"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Hak Akses & Peran (*Role*)</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      {
                        roleKey: 'STAFF',
                        title: 'Panitia',
                        icon: UserCheck,
                        desc: 'Akses khusus untuk mengelola DPT pemilih (Voters Importer) dan cetak kartu QR. Tidak bisa mengubah atau menghapus pemilihan.'
                      },
                      {
                        roleKey: 'ADMIN',
                        title: 'Administrator',
                        icon: ShieldCheck,
                        desc: 'Akses penuh untuk mengelola pemilihan, paslon, tema, dan pengaturan sistem.'
                      },
                      {
                        roleKey: 'OBSERVER',
                        title: 'Saksi / Pengawas',
                        icon: Eye,
                        desc: 'Khusus melihat layar Live Result Count secara real-time. Tidak dapat melihat DPT, pengaturan, atau menu lainnya.'
                      }
                    ].map((item) => (
                      <button
                        key={item.roleKey}
                        type="button"
                        onClick={() => setRole(item.roleKey as any)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          role === item.roleKey 
                            ? 'bg-brand-primary/10 border-brand-primary shadow-xs' 
                            : 'bg-background border-border-main hover:bg-brand-primary/5'
                        }`}
                      >
                        <item.icon className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-text-main block">{item.title}</span>
                          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} disabled={isPending}>
                    Batal
                  </Button>
                  <Button type="submit" className="button-gradient px-6 font-bold" disabled={isPending}>
                    {isPending ? 'Menyimpan...' : 'Simpan Akun Panitia'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Committee Members Table */}
      <Card className="overflow-hidden border-border-main p-0 shadow-xs rounded-3xl">
        <div className="p-4 border-b border-border-main bg-background/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-brand-primary" /> Daftar Akun Panitia Aktif ({users.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-main bg-background/50 text-[10px] uppercase tracking-wider text-text-muted font-bold">
                <th className="py-3.5 px-6">Nama & Jabatan</th>
                <th className="py-3.5 px-6">Username Login</th>
                <th className="py-3.5 px-6">Hak Akses / Peran</th>
                <th className="py-3.5 px-6">Tanggal Dibuat</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 font-medium">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-text-main block">{user.name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] text-brand-primary font-extrabold uppercase tracking-wider block">
                              (Akun Anda)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border-main rounded-lg font-mono font-bold text-brand-primary text-xs">
                        <User className="w-3 h-3 text-text-muted" />
                        {user.username}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={
                        user.role === 'ADMIN' ? 'default' : 
                        user.role === 'STAFF' ? 'info' : 'warning'
                      } className="font-extrabold text-[9px] uppercase tracking-wider">
                        {user.role === 'ADMIN' ? '🛡️ Administrator' : user.role === 'STAFF' ? '🎫 Panitia' : '👁️ Saksi Pemilihan'}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {isCurrentUser ? (
                        <span className="text-[10px] text-text-muted italic">Sesi Aktif</span>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-danger hover:bg-danger/10 p-2 h-8"
                          title="Hapus Akun Panitia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
