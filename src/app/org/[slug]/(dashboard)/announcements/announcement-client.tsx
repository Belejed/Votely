'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  Plus, 
  Trash, 
  Calendar, 
  Info,
  Check,
  Send
} from 'lucide-react';
import { createAnnouncementAction, deleteAnnouncementAction } from './actions';

interface AnnouncementProps {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
}

interface AnnouncementClientProps {
  announcements: AnnouncementProps[];
  slug: string;
  orgId: string;
}

function FormattedDate({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = useState('');
  useEffect(() => {
    setFormatted(new Date(dateString).toLocaleString());
  }, [dateString]);
  return <span>{formatted}</span>;
}

export default function AnnouncementClientPage({ announcements, slug, orgId }: AnnouncementClientProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setStatusMsg(null);
    startTransition(async () => {
      const res = await createAnnouncementAction(slug, title, content);
      if (res?.error) {
        setStatusMsg({ type: 'danger', text: res.error });
      } else if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Announcement published successfully!' });
        setTitle('');
        setContent('');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id, orgId, slug);
      if (res?.success) {
        setStatusMsg({ type: 'success', text: 'Announcement deleted.' });
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h3 className="text-3xl font-display font-extrabold text-text-main">Broadcast Announcements</h3>
        <p className="text-sm text-text-muted mt-1">Publish bulletins and notification alerts for your organization\'s voter portal.</p>
      </div>

      {statusMsg && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className={`p-3.5 border rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            statusMsg.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'
          }`}
        >
          {statusMsg.type === 'success' ? <Check className="w-4.5 h-4.5" /> : <Info className="w-4.5 h-4.5" />}
          <span>{statusMsg.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form to Write Announcement (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="p-6">
            <h4 className="text-base font-extrabold text-text-main border-b border-border-main pb-3 mb-6 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-primary" /> Create Bulletin
            </h4>

            <form onSubmit={handlePublish} className="space-y-4">
              <Input
                label="Announcement Title"
                placeholder="e.g. Vote count verification procedures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isPending}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Content / body</label>
                <textarea
                  rows={6}
                  className="flex w-full rounded-xl border border-border-main bg-background px-4 py-2 text-sm text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:border-brand-primary/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  placeholder="Type announcement message details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <Button type="submit" className="w-full h-11 button-gradient mt-2 gap-1.5" disabled={isPending}>
                <Send className="w-4 h-4" />
                <span>{isPending ? 'Publishing...' : 'Publish Announcement'}
                </span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: List of published announcements (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block pl-1">Recent Broadcasts ({announcements.length})</span>
          
          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((item: any) => (
                <Card key={item.id} hoverLift className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h5 className="font-bold text-base text-text-main leading-snug">{item.title}</h5>
                      <span className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <FormattedDate dateString={item.createdAt} />
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-danger hover:bg-danger/5 px-2 py-1.5" disabled={isPending}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-text-muted whitespace-pre-line leading-relaxed">
                    {item.content}
                  </p>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-xs text-text-muted">
                No announcements published yet. Fill in the form on the left to broadcast updates.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
