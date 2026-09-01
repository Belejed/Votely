import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession, clearAdminSession } from '@/lib/session';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  Vote, 
  Plus, 
  Trash2, 
  LogOut,
  ShieldCheck,
  CalendarRange,
  Database,
  Info
} from 'lucide-react';
import { 
  createOrganizationAction, 
  deleteOrganizationAction 
} from './actions';

export default async function SuperAdminConsolePage() {
  // 1. Verify session is Super Admin
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // 2. Fetch system analytics
  const organizations = await db.organization.findMany({
    include: {
      voters: true,
      events: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrgs = organizations.length;
  const totalElections = await db.event.count();
  const totalGlobalVoters = await db.voter.count();
  const totalGlobalVotes = await db.vote.count();

  // 3. Server Actions Form Handlers
  const handleCreateOrg = async (formData: FormData) => {
    'use server';
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    
    // Always default to PRO so they have all features unlocked internally in DB
    await createOrganizationAction(name, slug, 'PRO');
  };

  const handleDeleteOrg = async (formData: FormData) => {
    'use server';
    const orgId = formData.get('orgId') as string;
    await deleteOrganizationAction(orgId);
  };

  const handleLogout = async () => {
    'use server';
    await clearAdminSession();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between">
      {/* Header */}
      <header className="h-18 bg-card border-b border-border-main flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight block leading-none text-text-main">
              Votely Monitor
            </span>
            <span className="text-[9px] text-text-muted font-bold uppercase mt-0.5 tracking-wider block">
              System Admin Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-brand-primary text-white border-0 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 fill-white" /> Platform Controller
          </Badge>
          <div className="h-5 w-[1px] bg-border-main" />
          <form action={handleLogout}>
            <Button type="submit" variant="ghost" size="sm" className="text-text-muted hover:text-danger hover:bg-danger/5 gap-1.5 py-1.5 px-3">
              <LogOut className="w-4.5 h-4.5" />
              <span>Log out</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-8 space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-primary/15 via-brand-secondary/5 to-transparent border border-brand-primary/25 p-8">
          <div className="space-y-1.5">
            <Badge variant="info" className="px-3 py-1 font-bold">GLOBAL MONITOR</Badge>
            <h3 className="text-3xl font-display font-extrabold text-text-main">
              Platform Registry
            </h3>
            <p className="text-sm text-text-muted max-w-3xl leading-relaxed">
              Overview of active workspaces, globally configured elections, registered voters, and system databases in real-time.
            </p>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverLift className="flex items-center gap-5 p-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Workspaces</span>
              <span className="text-3xl font-display font-extrabold text-text-main">{totalOrgs} Active</span>
            </div>
          </Card>

          <Card hoverLift className="flex items-center gap-5 p-5">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Total Elections</span>
              <span className="text-3xl font-display font-extrabold text-text-main">{totalElections} Setups</span>
            </div>
          </Card>

          <Card hoverLift className="flex items-center gap-5 p-5">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Ballots Cast</span>
              <span className="text-3xl font-display font-extrabold text-text-main">{totalGlobalVotes} Votes</span>
            </div>
          </Card>

          <Card hoverLift className="flex items-center gap-5 p-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/15 flex items-center justify-center text-brand-secondary shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Global Roster</span>
              <span className="text-3xl font-display font-extrabold text-text-main">{totalGlobalVoters} Voters</span>
            </div>
          </Card>
        </div>

        {/* Console Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Organization Table (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            <Card className="overflow-hidden border-border-main p-0 shadow-xs">
              <div className="p-4 border-b border-border-main bg-background/30 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-main">Workspace Directories</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-main bg-background/50 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                      <th className="py-3 px-6">Organization</th>
                      <th className="py-3 px-4">Workspace Path</th>
                      <th className="py-3 px-4">Voters / Events</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/55 text-xs">
                    {organizations.map((org: any) => (
                      <tr key={org.id} className="hover:bg-background/25 transition-colors">
                        <td className="py-3.5 px-6">
                          <span className="font-bold text-text-main block leading-tight">{org.name}</span>
                          <span className="text-[10px] text-text-muted block mt-1">ID: {org.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-text-muted">
                          {org.slug}.votely.app
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-text-muted">
                          {org.voters.length} Voters • {org.events.length} Elections
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <Badge variant="success" className="font-bold">
                            Active
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-right flex items-center justify-end gap-1.5 mt-1">
                          <form action={handleDeleteOrg}>
                            <input type="hidden" name="orgId" value={org.id} />
                            <Button type="submit" variant="ghost" size="sm" className="h-8 text-danger hover:bg-danger/5 px-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column: Register New Tenant Organization (4 cols) */}
          <div className="xl:col-span-4">
            <Card className="p-6">
              <h4 className="text-base font-extrabold text-text-main border-b border-border-main pb-3 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" /> Create Directory
              </h4>

              <form action={handleCreateOrg} className="space-y-4">
                <Input
                  name="name"
                  label="Workspace Name"
                  placeholder="e.g. Greenwood High School"
                  required
                />

                <Input
                  name="slug"
                  label="Dedicated Slug / Path"
                  placeholder="e.g. school-a"
                  required
                />

                <Button type="submit" className="w-full h-11 button-gradient mt-4">
                  Create Workspace
                </Button>
              </form>

              {/* Developer credentials info */}
              <div className="mt-6 p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl text-[10px] text-text-muted leading-relaxed">
                <Info className="w-4.5 h-4.5 text-brand-primary mb-1 block" />
                Creating a new directory automatically generates a default administrator login:
                <div className="font-mono bg-background p-1.5 rounded-lg border border-border-main mt-1.5 text-[9px] text-text-main">
                  Email: admin-[slug]@votely.app<br />
                  Password: AdminPass123!
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-border-main bg-card flex items-center justify-center text-[10px] text-text-muted uppercase tracking-wider font-semibold">
        <span>Global Controller Console v1.0 • secure node</span>
      </footer>
    </div>
  );
}
