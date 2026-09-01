import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvvabdtgomzbyzjgkgiw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dmFiZHRnb216Ynl6amdrZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDQ4NDEsImV4cCI6MjA5ODIyMDg0MX0.-KCJNeNmahvdRTxn59jw2jml7ez3mPtW62stvwqqz38';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Helper: Convert camelCase keys to snake_case for Supabase PostgreSQL
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Helper: Convert snake_case keys to camelCase for Next.js app
function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function objectToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectToSnake);
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[toSnakeCase(k)] = objectToSnake(v);
    }
    return res;
  }
  return obj;
}

const TABLES_WITH_CREATED_AT = new Set([
  'announcements', 'audit_logs', 'candidates', 'events', 'organizations', 'users', 'voters'
]);

const TABLES_WITH_UPDATED_AT = new Set([
  'candidates', 'events', 'organizations', 'users', 'voters'
]);

const DATE_FIELDS = new Set(['createdAt', 'updatedAt', 'startDate', 'endDate', 'votedAt', 'timestamp']);

function objectToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectToCamel);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const camelKey = toCamelCase(k);
      if (DATE_FIELDS.has(camelKey) && typeof v === 'string') {
        res[camelKey] = new Date(v);
      } else {
        res[camelKey] = objectToCamel(v);
      }
    }
    return res;
  }
  return obj;
}

// Supabase Model Adapter for Prisma API compatibility
class SupabaseModelAdapter {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private applyWhere(query: any, where?: any) {
    if (!where) return query;
    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;
      const snakeKey = toSnakeCase(key);

      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        const ops = val as any;
        if ('equals' in ops) {
          query = query.eq(snakeKey, ops.equals);
        } else if ('not' in ops) {
          query = query.neq(snakeKey, ops.not);
        } else if ('in' in ops && Array.isArray(ops.in)) {
          query = query.in(snakeKey, ops.in);
        } else if ('notIn' in ops && Array.isArray(ops.notIn)) {
          query = query.not('in', `(${ops.notIn.join(',')})`);
        } else if ('gt' in ops) {
          query = query.gt(snakeKey, ops.gt instanceof Date ? ops.gt.toISOString() : ops.gt);
        } else if ('gte' in ops) {
          query = query.gte(snakeKey, ops.gte instanceof Date ? ops.gte.toISOString() : ops.gte);
        } else if ('lt' in ops) {
          query = query.lt(snakeKey, ops.lt instanceof Date ? ops.lt.toISOString() : ops.lt);
        } else if ('lte' in ops) {
          query = query.lte(snakeKey, ops.lte instanceof Date ? ops.lte.toISOString() : ops.lte);
        } else if ('contains' in ops) {
          query = ops.mode === 'insensitive' 
            ? query.ilike(snakeKey, `%${ops.contains}%`)
            : query.like(snakeKey, `%${ops.contains}%`);
        }
      } else {
        query = query.eq(snakeKey, val instanceof Date ? val.toISOString() : val);
      }
    }
    return query;
  }

  async findUnique(args: { where: any; include?: any }) {
    return this.findFirst(args);
  }

  async findFirst(args: { where: any; orderBy?: any; include?: any }) {
    const { where, orderBy, include } = args;
    let query = supabase.from(this.tableName).select('*');
    query = this.applyWhere(query, where);

    if (orderBy) {
      const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
      for (const [field, direction] of Object.entries(order)) {
        query = query.order(toSnakeCase(field), { ascending: direction === 'asc' });
      }
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.error(`Supabase findFirst error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    if (!data) return null;

    const camelData = objectToCamel(data);
    return this.resolveIncludes(camelData, include);
  }

  async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
    const { where, orderBy, include } = args || {};
    let query = supabase.from(this.tableName).select('*');
    query = this.applyWhere(query, where);

    if (orderBy) {
      const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
      for (const [field, direction] of Object.entries(order)) {
        query = query.order(toSnakeCase(field), { ascending: direction === 'asc' });
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Supabase findMany error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }

    const camelList = objectToCamel(data || []);
    if (include) {
      return Promise.all(camelList.map((item: any) => this.resolveIncludes(item, include)));
    }
    return camelList;
  }

  async create(args: { data: any }) {
    const id = args.data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const payload: any = {
      ...args.data,
      id,
    };

    if (TABLES_WITH_CREATED_AT.has(this.tableName)) {
      payload.createdAt = args.data.createdAt ? new Date(args.data.createdAt).toISOString() : now;
    }
    if (TABLES_WITH_UPDATED_AT.has(this.tableName)) {
      payload.updatedAt = args.data.updatedAt ? new Date(args.data.updatedAt).toISOString() : now;
    }
    if (this.tableName === 'votes') {
      payload.timestamp = args.data.timestamp ? new Date(args.data.timestamp).toISOString() : now;
    }
    if (this.tableName === 'event_voter_participations') {
      payload.votedAt = args.data.votedAt ? new Date(args.data.votedAt).toISOString() : now;
    }

    const snakePayload = objectToSnake(payload);
    const { data, error } = await supabase.from(this.tableName).insert(snakePayload).select().single();
    if (error) {
      console.error(`Supabase create error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return objectToCamel(data);
  }

  async createMany(args: { data: any[] }) {
    const now = new Date().toISOString();
    const payloads = args.data.map(item => {
      const p: any = {
        ...item,
        id: item.id || crypto.randomUUID(),
      };
      if (TABLES_WITH_CREATED_AT.has(this.tableName)) {
        p.createdAt = item.createdAt ? new Date(item.createdAt).toISOString() : now;
      }
      if (TABLES_WITH_UPDATED_AT.has(this.tableName)) {
        p.updatedAt = item.updatedAt ? new Date(item.updatedAt).toISOString() : now;
      }
      return p;
    });

    const snakePayloads = objectToSnake(payloads);
    const { data, error } = await supabase.from(this.tableName).insert(snakePayloads).select();
    if (error) {
      console.error(`Supabase createMany error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return { count: (data || []).length };
  }

  async update(args: { where: any; data: any }) {
    const now = new Date().toISOString();
    const payload: any = { ...args.data };
    if (TABLES_WITH_UPDATED_AT.has(this.tableName)) {
      payload.updatedAt = now;
    }

    const snakePayload = objectToSnake(payload);
    let query = supabase.from(this.tableName).update(snakePayload);
    query = this.applyWhere(query, args.where);

    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.error(`Supabase update error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return objectToCamel(data);
  }

  async updateMany(args: { where?: any; data: any }) {
    const now = new Date().toISOString();
    const payload: any = { ...args.data };
    if (TABLES_WITH_UPDATED_AT.has(this.tableName)) {
      payload.updatedAt = now;
    }

    const snakePayload = objectToSnake(payload);
    let query = supabase.from(this.tableName).update(snakePayload);
    query = this.applyWhere(query, args.where);

    const { data, error } = await query.select();
    if (error) {
      console.error(`Supabase updateMany error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return { count: (data || []).length };
  }

  async upsert(args: { where: any; create: any; update: any }) {
    const existing = await this.findFirst({ where: args.where });
    if (existing) {
      return this.update({ where: args.where, data: args.update });
    } else {
      return this.create({ data: { ...args.create, ...args.where } });
    }
  }

  async delete(args: { where: any }) {
    let query = supabase.from(this.tableName).delete();
    query = this.applyWhere(query, args.where);

    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.error(`Supabase delete error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return objectToCamel(data);
  }

  async deleteMany(args?: { where?: any }) {
    let query = supabase.from(this.tableName).delete();
    query = this.applyWhere(query, args?.where);

    const { data, error } = await query.select();
    if (error) {
      console.error(`Supabase deleteMany error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return { count: (data || []).length };
  }

  async count(args?: { where?: any }) {
    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });
    query = this.applyWhere(query, args?.where);

    const { count, error } = await query;
    if (error) {
      console.error(`Supabase count error on ${this.tableName}:`, error);
      throw new Error(error.message);
    }
    return count || 0;
  }

  private async resolveIncludes(item: any, include?: any) {
    if (!item || !include) return item;
    const res = { ...item };

    for (const [rel, val] of Object.entries(include)) {
      if (!val) continue;

      if (rel === 'organization' && res.organizationId) {
        const { data } = await supabase.from('organizations').select('*').eq('id', res.organizationId).maybeSingle();
        res.organization = objectToCamel(data);
      } else if (rel === 'candidates' && res.id) {
        const { data } = await supabase.from('candidates').select('*').eq('event_id', res.id).order('number', { ascending: true });
        let candidates = objectToCamel(data || []);
        
        // Populate vote counts for each candidate
        candidates = await Promise.all(candidates.map(async (c: any) => {
          const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('candidate_id', c.id);
          return { ...c, _count: { votes: count || 0 }, votes: [] };
        }));
        res.candidates = candidates;
      } else if (rel === 'boothSetting' && res.id) {
        const { data } = await supabase.from('offline_booth_settings').select('*').eq('event_id', res.id).maybeSingle();
        res.boothSetting = objectToCamel(data);
      } else if (rel === 'participations' && res.id) {
        const { data } = await supabase.from('event_voter_participations').select('*').or(`event_id.eq.${res.id},voter_id.eq.${res.id}`);
        res.participations = objectToCamel(data || []);
      } else if (rel === 'votes' && res.id) {
        const { data } = await supabase.from('votes').select('*').or(`event_id.eq.${res.id},candidate_id.eq.${res.id},voter_id.eq.${res.id}`);
        res.votes = objectToCamel(data || []);
      } else if (rel === '_count') {
        const select = (val as any).select || {};
        res._count = {};
        if (select.votes && res.id) {
          const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).or(`event_id.eq.${res.id},candidate_id.eq.${res.id}`);
          res._count.votes = count || 0;
        }
        if (select.candidates && res.id) {
          const { count } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('event_id', res.id);
          res._count.candidates = count || 0;
        }
        if (select.voters && res.id) {
          const { count } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('organization_id', res.id);
          res._count.voters = count || 0;
        }
      }
    }
    return res;
  }
}

// Unified Database Client directly connected to Supabase Cloud over HTTPS
export const db: any = {
  $transaction: async (fn: (tx: any) => any) => fn(db),
  organization: new SupabaseModelAdapter('organizations'),
  user: new SupabaseModelAdapter('users'),
  voter: new SupabaseModelAdapter('voters'),
  event: new SupabaseModelAdapter('events'),
  offlineBoothSetting: new SupabaseModelAdapter('offline_booth_settings'),
  candidate: new SupabaseModelAdapter('candidates'),
  vote: new SupabaseModelAdapter('votes'),
  eventVoterParticipation: new SupabaseModelAdapter('event_voter_participations'),
  announcement: new SupabaseModelAdapter('announcements'),
  auditLog: new SupabaseModelAdapter('audit_logs'),
};

export default db;
