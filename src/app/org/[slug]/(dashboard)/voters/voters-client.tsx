'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Search, 
  Trash, 
  RefreshCcw, 
  Printer, 
  UserPlus, 
  Download, 
  Check, 
  X, 
  Info,
  QrCode,
  Lock,
  ArrowRight,
  Vote
} from 'lucide-react';
import { 
  createSingleVoterAction,
  importVotersAction, 
  resetVoterStatusAction, 
  regenerateVoterPassAction, 
  deleteVoterAction 
} from './actions';

interface VoterProps {
  id: string;
  name: string;
  studentId: string | null;
  class: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  qrToken: string;
  votingPass: string;
  invitationNum: string;
  hasVoted: boolean;
  createdAt: string;
}

interface ClientPageProps {
  initialVoters: VoterProps[];
  slug: string;
  activeEventName: string | null;
}

export default function VotersClientPage({ initialVoters, slug, activeEventName }: ClientPageProps) {
  const [voters, setVoters] = useState<VoterProps[]>(initialVoters);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'class_asc' | 'id_asc' | 'recent'>('class_asc');
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Extract unique classes dynamically
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    voters.forEach(v => {
      if (v.class && v.class.trim()) set.add(v.class.trim());
    });
    return Array.from(set).sort();
  }, [voters]);

  // Invitation Card Preview Modal State
  const [selectedVoter, setSelectedVoter] = useState<VoterProps | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [printLayout, setPrintLayout] = useState<'2' | '4' | '8'>('4');

  // Manual Add Voter State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualClass, setManualClass] = useState('');
  const [manualDept, setManualDept] = useState('');

  const handleManualAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setStatusMsg({ type: 'danger', text: 'Nama pemilih wajib diisi.' });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await createSingleVoterAction(slug, {
        name: manualName,
        studentId: manualStudentId,
        class: manualClass,
        department: manualDept,
      });

      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else if (res?.success && res.voter) {
        setStatusMsg({ 
          type: 'success', 
          text: `Pemilih "${res.voter.name}" (PIN: ${res.voter.votingPass}) berhasil ditambahkan ke DPT!` 
        });
        setVoters(prev => [res.voter as any, ...prev]);
        setManualName('');
        setManualStudentId('');
        setManualClass('');
        setManualDept('');
        setShowManualForm(false);
      }
    });
  };

  // Sync initialVoters if server updates
  useEffect(() => {
    setVoters(initialVoters);
  }, [initialVoters]);

  // Generate QR Code URL when selectedVoter changes
  useEffect(() => {
    if (selectedVoter) {
      QRCode.toDataURL(selectedVoter.qrToken, { margin: 1, width: 200 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [selectedVoter]);

  // Search, Class Filter, and Sort
  const filteredVoters = useMemo(() => {
    let list = voters.filter((v: any) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || (
        v.name.toLowerCase().includes(q) ||
        (v.studentId && v.studentId.toLowerCase().includes(q)) ||
        (v.class && v.class.toLowerCase().includes(q)) ||
        (v.department && v.department.toLowerCase().includes(q)) ||
        (v.votingPass && v.votingPass.includes(q)) ||
        (v.invitationNum && v.invitationNum.toLowerCase().includes(q))
      );

      const matchClass = selectedClass === 'ALL' || (v.class && v.class.trim() === selectedClass);
      return matchSearch && matchClass;
    });

    // Apply Sorting
    return list.sort((a: any, b: any) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'class_asc') {
        const classComp = (a.class || '').localeCompare(b.class || '');
        if (classComp !== 0) return classComp;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'id_asc') return (a.studentId || '').localeCompare(b.studentId || '');
      return (new Date(b.createdAt).getTime()) - (new Date(a.createdAt).getTime());
    });
  }, [voters, search, selectedClass, sortBy]);

  // Excel Template Download Handler
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Fauzi',
        'NIS / NIK': '212210001',
        'Kelas': '12 MIPA 1',
        'Jurusan': 'MIPA'
      },
      {
        'Nama Lengkap': 'Siti Nurhaliza',
        'NIS / NIK': '212210002',
        'Kelas': '12 IPS 2',
        'Jurusan': 'IPS'
      },
      {
        'Nama Lengkap': 'Budi Santoso',
        'NIS / NIK': '212210003',
        'Kelas': '11 MIPA 2',
        'Jurusan': 'MIPA'
      }
    ];

    try {
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Auto-size column widths for professional feel
      ws['!cols'] = [
        { wch: 25 }, // Nama
        { wch: 18 }, // NIS / NIK
        { wch: 15 }, // Kelas
        { wch: 18 }  // Jurusan
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Voters Roster Template');
      XLSX.writeFile(wb, 'votely_voters_template.xlsx');
      setStatusMsg({ type: 'success', text: 'Excel template downloaded successfully.' });
    } catch (err) {
      console.error('Error generating template:', err);
      setStatusMsg({ type: 'danger', text: 'Failed to generate Excel template.' });
    }
  };

  // Excel upload handler
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (rawJson.length === 0) {
          setStatusMsg({ type: 'danger', text: 'Excel sheet is empty.' });
          return;
        }

        // Map columns dynamically with robust keyword recognition
        const mappedList = rawJson.map((row: any) => {
          const keys = Object.keys(row);
          
          // Name detection
          const nameKey = keys.find((k: any) => {
            const lk = k.toLowerCase().trim();
            return lk === 'nama' || lk === 'name' || lk.includes('nama lengkap') || lk.includes('full name') || lk.includes('nama');
          }) || '';

          // Student ID / NIS / NIK detection
          const idKey = keys.find((k: any) => {
            const lk = k.toLowerCase().trim();
            return lk.includes('nis') || lk.includes('nik') || lk.includes('induk') || lk.includes('student') || lk.includes('nomor') || lk === 'id';
          }) || '';

          // Class detection
          const classKey = keys.find((k: any) => {
            const lk = k.toLowerCase().trim();
            return lk === 'kelas' || lk === 'class' || lk.includes('kelas') || lk.includes('tingkat') || lk.includes('rombel');
          }) || '';

          // Department / Jurusan detection
          const deptKey = keys.find((k: any) => {
            const lk = k.toLowerCase().trim();
            return lk === 'jurusan' || lk.includes('jurusan') || lk.includes('dept') || lk.includes('department') || lk.includes('kategori') || lk.includes('prodi');
          }) || '';

          const rawName = row[nameKey] ? String(row[nameKey]).trim() : '';
          const rawId = row[idKey] ? String(row[idKey]).trim() : null;
          const rawClass = row[classKey] ? String(row[classKey]).trim() : null;
          const rawDept = row[deptKey] ? String(row[deptKey]).trim() : null;

          return {
            name: rawName || 'Pemilih Terdaftar',
            studentId: rawId || null,
            class: rawClass || null,
            department: rawDept || null,
            customFields: {},
          };
        }).filter((item: any) => item.name && item.name !== 'Pemilih Terdaftar' || item.studentId);

        // Trigger Server Action
        startTransition(async () => {
          const res = await importVotersAction(slug, mappedList);
          if (res?.error) {
            setStatusMsg({ type: 'danger', text: res.error });
          } else if (res?.success) {
            setStatusMsg({ 
              type: 'success', 
              text: `Successfully imported ${res.importedCount} voters. (Skipped ${res.skippedCount} duplicates)` 
            });
            // Re-fetch handled automatically via Server Actions revalidatePath
          }
        });
      } catch (err) {
        console.error(err);
        setStatusMsg({ type: 'danger', text: 'Failed to parse Excel file. Make sure file formatting is correct.' });
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  // Voter action triggers
  const handleResetStatus = async (id: string) => {
    startTransition(async () => {
      const res = await resetVoterStatusAction(id, slug);
      if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Voter participation status reset.' });
      }
    });
  };

  const handleRegenCredentials = async (id: string) => {
    startTransition(async () => {
      const res = await regenerateVoterPassAction(id, slug);
      if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Voter QR and passcode regenerated.' });
      }
    });
  };

  const handleDeleteVoter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voter?')) return;
    startTransition(async () => {
      const res = await deleteVoterAction(id, slug);
      if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Voter registration deleted.' });
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-display font-extrabold text-text-main">Voters Directory</h3>
          <p className="text-sm text-text-muted mt-1">Manage voter credentials, print printable invitations, and import roster files.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            onClick={() => setShowManualForm(!showManualForm)}
            className="button-gradient gap-1.5 h-11 px-4 shadow-md shadow-brand-primary/15 font-bold"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span>{showManualForm ? 'Tutup Form' : 'Tambah Pemilih Manual'}</span>
          </Button>

          <div className="relative">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <Button 
              onClick={() => document.getElementById('excel-upload')?.click()}
              variant="outline"
              className="gap-1.5 h-11 px-4 border-border-main font-bold hover:bg-brand-primary/5"
              disabled={isPending}
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-success" />
              <span>Import Excel</span>
            </Button>
          </div>

          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="border-border-main text-text-muted hover:text-brand-primary hover:bg-brand-primary/5 gap-1.5 h-11 px-3.5 font-bold text-xs"
            disabled={isPending}
          >
            <Download className="w-4 h-4" />
            <span>Template Excel</span>
          </Button>

          <Link href={`/org/${slug}/voters/print?layout=${printLayout}`} target="_blank">
            <Button variant="outline" className="gap-1.5 h-11 px-3.5 border-border-main font-bold text-xs">
              <Printer className="w-4 h-4 text-brand-primary" />
              <span>Cetak Undangan QR</span>
            </Button>
          </Link>
        </div>
      </div>

      {statusMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 border rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            statusMsg.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
          }`}
        >
          {statusMsg.type === 'success' ? <Check className="w-4.5 h-4.5 shrink-0" /> : <Info className="w-4.5 h-4.5 shrink-0" />}
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="ml-auto hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Manual Voter Add Drawer Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <Card className="p-6 border-2 border-brand-primary/20 bg-card shadow-xl rounded-3xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-main">Tambah Pemilih Baru Secara Manual</h4>
                  <p className="text-xs text-text-muted">Sistem akan secara otomatis membuatkan Kode QR dan PIN 6 Digit untuk pemilih ini.</p>
                </div>
              </div>

              <form onSubmit={handleManualAddVoter} className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Nama Lengkap Pemilih *"
                    placeholder="e.g. Siti Nurhaliza"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />

                  <Input
                    label="Nomor Induk Siswa (NIS / NIK)"
                    placeholder="e.g. 212210045"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                  />

                  <Input
                    label="Kelas / Rombel"
                    placeholder="e.g. 12 MIPA 1"
                    value={manualClass}
                    onChange={(e) => setManualClass(e.target.value)}
                  />

                  <Input
                    label="Jurusan / Departemen"
                    placeholder="e.g. MIPA / IPS"
                    value={manualDept}
                    onChange={(e) => setManualDept(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-main">
                  <Button type="button" variant="secondary" onClick={() => setShowManualForm(false)} disabled={isPending}>
                    Batal
                  </Button>
                  <Button type="submit" className="button-gradient px-6 font-bold shadow-md shadow-brand-primary/15" disabled={isPending}>
                    {isPending ? 'Menyimpan...' : 'Simpan & Buat PIN Pemilih'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Roster Panel */}
      <Card className="overflow-hidden border-border-main p-0 shadow-xs">
        {/* Table Filter Search Header */}
        <div className="p-3 sm:p-4 border-b border-border-main flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-background/30">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-text-muted/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voters by name, class, department, or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border-main rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/50 text-text-main"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted shrink-0">
            <span>Layout:</span>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value as any)}
              className="bg-card border border-border-main rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="2">2 Cards / A4</option>
              <option value="4">4 Cards / A4</option>
              <option value="8">8 Cards / A4</option>
            </select>
          </div>
        </div>

        {/* Voters List Table */}
        <div className="overflow-x-auto">
          {filteredVoters.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-background/50 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                  <th className="py-3 px-6">Voter Details</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Class / Dept</th>
                  <th className="py-3 px-4">Passcode</th>
                  <th className="py-3 px-4">Active Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/55 text-sm">
                {filteredVoters.map((voter: any) => (
                  <tr key={voter.id} className="hover:bg-background/25 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-text-main leading-tight">{voter.name}</div>
                      <span className="text-[10px] text-text-muted mt-0.5 block leading-none font-medium">
                        Invitation: {voter.invitationNum}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-text-muted">
                      {voter.studentId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-text-muted leading-tight">
                      <div>{voter.class || '—'}</div>
                      <span className="text-[10px] text-text-muted/75 font-normal block mt-0.5">{voter.department || ''}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand-primary">
                      {voter.votingPass}
                    </td>
                    <td className="py-3.5 px-4">
                      {activeEventName ? (
                        voter.hasVoted ? (
                          <Badge variant="success">Voted</Badge>
                        ) : (
                          <Badge variant="default">Eligible</Badge>
                        )
                      ) : (
                        <Badge variant="info">Ready</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right flex items-center justify-end gap-1.5 mt-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVoter(voter)}
                        className="text-brand-primary hover:bg-brand-primary/5 px-2 py-1.5"
                        title="Preview Card"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>

                      {voter.hasVoted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetStatus(voter.id)}
                          className="text-warning hover:bg-warning/5 px-2 py-1.5"
                          title="Reset Vote status"
                          disabled={isPending}
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenCredentials(voter.id)}
                        className="text-text-muted hover:text-brand-primary px-2 py-1.5"
                        title="Regenerate Credentials"
                        disabled={isPending}
                      >
                        <RefreshCcw className="w-4 h-4 text-text-muted/60" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVoter(voter.id)}
                        className="text-danger hover:bg-danger/5 px-2 py-1.5"
                        title="Delete Voter"
                        disabled={isPending}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-text-muted">
              No voters registered matching search criteria. Upload an Excel roster to begin.
            </div>
          )}
        </div>
      </Card>

      {/* Roster Template Instructions Card */}
      <Card className="p-6 bg-brand-primary/5 border-brand-primary/10">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text-main">Excel Importer Template Guidelines</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              For best results, upload an Excel file (`.xlsx`, `.xls`) with columns containing the headers: <strong>Name</strong> (or <em>Nama</em>), <strong>Student ID</strong> (or <em>NIM/NIS</em>), <strong>Class</strong> (or <em>Kelas</em>), and <strong>Department</strong> (or <em>Jurusan</em>). The system automatically generates unique QR Code tokens (`VTLY-XXXX`), secure random 6-digit voting passes, and invitation PDF sheets for every entry.
            </p>
          </div>
        </div>
      </Card>

      {/* INVITATION CARD PREVIEW DRAWER MODAL */}
      <AnimatePresence>
        {selectedVoter && (
          <div className="fixed inset-0 bg-text-main/30 backdrop-blur-xs flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border-main rounded-3xl p-6 shadow-2xl max-w-sm w-full relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedVoter(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background text-text-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4 pt-2">
                <Badge variant="info">INVITATION CARD PREVIEW</Badge>
                
                {/* Visual Card Frame */}
                <div className="border-2 border-brand-primary/20 rounded-2xl p-5 bg-background text-left relative overflow-hidden space-y-4">
                  {/* Card Branding header */}
                  <div className="flex items-center justify-between border-b border-border-main/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-brand-primary" />
                      <span className="font-display font-extrabold text-xs text-text-main">Votely Ballots</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                      Inv: {selectedVoter.invitationNum}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Voter Roster</span>
                    <h5 className="font-bold text-text-main text-base leading-tight">{selectedVoter.name}</h5>
                    <p className="text-xs text-text-muted">Student ID: {selectedVoter.studentId || 'N/A'}</p>
                    <p className="text-[10px] text-text-muted/75 font-semibold uppercase">{selectedVoter.class || ''} • {selectedVoter.department || ''}</p>
                  </div>

                  {/* Generated QR Code Image */}
                  <div className="flex justify-center py-2 bg-white rounded-xl border border-border-main/50">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="Voter QR Code" className="w-32 h-32" />
                    ) : (
                      <div className="w-32 h-32 bg-background flex items-center justify-center text-xs text-text-muted">Loading QR...</div>
                    )}
                  </div>

                  {/* Code Pass credentials */}
                  <div className="flex items-center justify-between gap-3 bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-3 text-xs leading-none">
                    <div className="flex items-center gap-1.5 font-semibold text-text-main">
                      <Lock className="w-4 h-4 text-brand-primary" />
                      <span>Voting Pass:</span>
                    </div>
                    <span className="font-mono font-extrabold text-brand-primary tracking-wider text-sm">
                      {selectedVoter.votingPass}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/org/${slug}/voters/print?layout=${printLayout}&voterId=${selectedVoter.id}`} target="_blank" className="flex-1">
                    <Button className="w-full button-gradient gap-1.5 h-11">
                      <Printer className="w-4.5 h-4.5" />
                      <span>Print Card</span>
                    </Button>
                  </Link>
                  <Button variant="secondary" onClick={() => setSelectedVoter(null)} className="w-24">
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}