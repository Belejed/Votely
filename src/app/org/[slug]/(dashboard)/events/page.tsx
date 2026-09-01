export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Archive, 
  Calendar, 
  Monitor, 
  Smartphone, 
  Layers,
  Lock,
  QrCode,
  UsersRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { archiveEventAction, deleteEventAction } from './actions';

export default async function EventsListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch organization details
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch events
  const events = await db.event.findMany({
    where: { 
      organizationId: org.id,
      status: { not: 'ARCHIVED' } // hide archived by default
    },
    include: {
      candidates: true,
      votes: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Server actions wrapper
  const handleArchive = async (formData: FormData) => {
    'use server';
    const eventId = formData.get('eventId') as string;
    await archiveEventAction(eventId, org.id, slug);
  };

  const handleDelete = async (formData: FormData) => {
    'use server';
    const eventId = formData.get('eventId') as string;
    await deleteEventAction(eventId, org.id, slug);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-display font-extrabold text-text-main">Elections</h3>
          <p className="text-sm text-text-muted mt-1">Manage, deploy, and monitor your organization\'s voting events.</p>
        </div>
        <Link href={`/org/${slug}/events/new`}>
          <Button className="button-gradient gap-2 h-11 px-5 shadow-md shadow-brand-primary/10">
            <Plus className="w-5 h-5" />
            <span>New Election</span>
          </Button>
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event: any) => {
            const votesCount = event.votes.length;
            const candidatesCount = event.candidates.length;

            return (
              <Card key={event.id} hoverLift className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <Badge variant={
                      event.status === 'PUBLISHED' ? 'success' : 
                      event.status === 'CLOSED' ? 'danger' : 'default'
                    }>
                      {event.status}
                    </Badge>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      {event.votingMode} Ballots
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-text-main leading-tight mb-2">
                    {event.name}
                  </h4>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-6">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3 bg-background/50 border border-border-main p-3 rounded-xl text-center text-xs font-semibold text-text-muted mb-6">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Candidates</span>
                      <span className="text-text-main font-extrabold mt-0.5 block">{candidatesCount}</span>
                    </div>
                    <div className="border-x border-border-main/50">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Votes</span>
                      <span className="text-brand-primary font-extrabold mt-0.5 block">{votesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block font-bold">Auth Method</span>
                      <span className="text-text-main font-extrabold mt-0.5 block truncate max-w-full px-1">{event.authMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-main pt-4">
                  <div className="flex items-center gap-2">
                    {event.votingMode === 'OFFLINE' && (
                      <Link href={`/org/${slug}/booth/${event.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="gap-1.5 py-1.5">
                          <Monitor className="w-4 h-4" />
                          <span>Launch Booth</span>
                        </Button>
                      </Link>
                    )}
                    {event.votingMode === 'ONLINE' && (
                      <Link href={`/org/${slug}/vote/${event.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="gap-1.5 py-1.5">
                          <Smartphone className="w-4 h-4" />
                          <span>Online Ballot</span>
                        </Button>
                      </Link>
                    )}
                    {event.votingMode === 'HYBRID' && (
                      <>
                        <Link href={`/org/${slug}/booth/${event.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="gap-1.5 py-1.5">
                            <Monitor className="w-4 h-4" />
                            <span>Launch Booth</span>
                          </Button>
                        </Link>
                        <Link href={`/org/${slug}/vote/${event.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="gap-1.5 py-1.5">
                            <Smartphone className="w-4 h-4" />
                            <span>Online Ballot</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <form action={handleArchive}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-text-muted hover:text-brand-primary py-1.5 px-2">
                        <Archive className="w-4 h-4" />
                      </Button>
                    </form>

                    <form action={handleDelete}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-text-muted hover:text-danger py-1.5 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-2 border-brand-primary/20 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-text-main">No Elections Registered</h4>
            <p className="text-sm text-text-muted max-w-sm mt-1">Get started by launching a multi-step election wizard to define candidates, configure voting modes, rules, and launch.</p>
          </div>
          <Link href={`/org/${slug}/events/new`}>
            <Button className="button-gradient gap-1.5 h-11 px-5">
              <Plus className="w-4.5 h-4.5" />
              <span>Create First Election</span>
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
