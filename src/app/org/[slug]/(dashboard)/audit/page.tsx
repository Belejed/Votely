export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Shield, Calendar, User, Activity } from 'lucide-react';

export default async function AuditLogsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch organization
  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) {
    notFound();
  }



  // 2. Fetch logs
  const logs = await db.auditLog.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-3xl font-display font-extrabold text-text-main">System Audit Logs</h3>
        <p className="text-sm text-text-muted mt-1">Review trace history of administrative actions, voter imports, and ballot updates.</p>
      </div>

      <Card className="overflow-hidden border-border-main p-0 shadow-xs">
        <div className="p-4 border-b border-border-main bg-background/30 flex items-center gap-2">
          <Badge variant="info" className="font-bold">PRO ARCHIVE SYSTEM</Badge>
          <span className="text-xs font-semibold text-text-muted">Recording active logins and operations securely.</span>
        </div>

        <div className="overflow-x-auto">
          {logs.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-background/50 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Admin Operator</th>
                  <th className="py-3 px-6">Operation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/55 text-xs">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-background/25 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-primary">
                      <Badge variant="default" className="text-[10px] tracking-wide font-bold">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-text-main">
                      {log.user ? log.user.name : 'Votely Core System'}
                    </td>
                    <td className="py-3.5 px-6 text-text-muted leading-relaxed font-semibold">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-text-muted">
              No audit logs captured. Perform administrative actions to start recording history.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
