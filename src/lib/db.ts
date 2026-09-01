import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'votely_db.json');

// 1. Setup Prisma Client with global singleton for Next.js
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = null;

// Normalize Supabase database URL (fix port 6543 to direct port 5432 if using db.* host)
function getNormalizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes('supabase.co:6543')) {
    url = url.replace(':6543', ':5432')
      .replace('&pgbouncer=true', '')
      .replace('?pgbouncer=true&', '?')
      .replace('?pgbouncer=true', '');
  }
  return url;
}

try {
  const normalizedUrl = getNormalizedDatabaseUrl();
  if (normalizedUrl) {
    process.env.DATABASE_URL = normalizedUrl;
    prismaInstance = globalForPrisma.prisma || new PrismaClient({
      datasources: {
        db: { url: normalizedUrl }
      },
      log: ['error'],
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
  }
} catch (e) {
  console.warn('Prisma initialization fallback to local DB:', e);
}

// 2. Local JSON Database Fallback
function getInitialData() {
  return {
    organizations: [],
    users: [],
    voters: [],
    events: [],
    offline_booth_settings: [],
    candidates: [],
    votes: [],
    event_voter_participations: [],
    announcements: [],
    audit_logs: []
  };
}

let inMemoryData: any = null;

function loadDatabase(): any {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      inMemoryData = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf-8');
      return inMemoryData;
    }

    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    inMemoryData = JSON.parse(content);
    return inMemoryData;
  } catch (err) {
    if (!inMemoryData) inMemoryData = getInitialData();
    return inMemoryData;
  }
}

function saveDatabase() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local database:', err);
  }
}

const DATE_FIELDS = new Set(['createdAt', 'updatedAt', 'startDate', 'endDate', 'timestamp', 'votedAt']);

function deserializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deserializeDates);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (DATE_FIELDS.has(k) && typeof v === 'string') {
        res[k] = new Date(v);
      } else {
        res[k] = deserializeDates(v);
      }
    }
    return res;
  }
  return obj;
}

function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeDates);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = serializeDates(v);
    }
    return res;
  }
  return obj;
}

function matchesWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key.includes('_') && typeof val === 'object' && val !== null && !('equals' in val) && !('in' in val) && !('not' in val)) {
      for (const [subK, subV] of Object.entries(val)) {
        if (item[subK] !== subV) return false;
      }
      continue;
    }

    if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      const ops = val as any;
      if ('not' in ops) {
        if (item[key] === ops.not) return false;
        continue;
      }
      if ('in' in ops && Array.isArray(ops.in)) {
        if (!ops.in.includes(item[key])) return false;
        continue;
      }
      if ('notIn' in ops && Array.isArray(ops.notIn)) {
        if (ops.notIn.includes(item[key])) return false;
        continue;
      }
      if ('equals' in ops) {
        if (item[key] !== ops.equals) return false;
        continue;
      }
      if ('gt' in ops) {
        if (!(item[key] > ops.gt)) return false;
        continue;
      }
      if ('gte' in ops) {
        if (!(item[key] >= ops.gte)) return false;
        continue;
      }
      if ('lt' in ops) {
        if (!(item[key] < ops.lt)) return false;
        continue;
      }
      if ('lte' in ops) {
        if (!(item[key] <= ops.lte)) return false;
        continue;
      }
      if ('contains' in ops) {
        const itemStr = String(item[key] || '');
        const targetStr = String(ops.contains || '');
        const match = ops.mode === 'insensitive' 
          ? itemStr.toLowerCase().includes(targetStr.toLowerCase())
          : itemStr.includes(targetStr);
        if (!match) return false;
        continue;
      }
    }

    if (item[key] !== val) return false;
  }
  return true;
}

async function resolveIncludes(collectionName: string, data: any, includeClause?: any): Promise<any> {
  if (!data) return data;
  if (Array.isArray(data)) {
    return Promise.all(data.map(item => resolveIncludes(collectionName, item, includeClause)));
  }

  const dbData = loadDatabase();
  const result = { ...data };

  if (includeClause) {
    for (const [relation, value] of Object.entries(includeClause)) {
      if (!value) continue;

      if (relation === 'organization') {
        const orgs = dbData.organizations || [];
        result.organization = deserializeDates(orgs.find((o: any) => o.id === result.organizationId)) || null;
      }
      else if (relation === 'user') {
        const users = dbData.users || [];
        result.user = deserializeDates(users.find((u: any) => u.id === result.userId || u.id === result.id)) || null;
      }
      else if (relation === 'voter') {
        const voters = dbData.voters || [];
        result.voter = deserializeDates(voters.find((v: any) => v.id === result.voterId)) || null;
      }
      else if (relation === 'event') {
        const events = dbData.events || [];
        result.event = deserializeDates(events.find((e: any) => e.id === result.eventId)) || null;
      }
      else if (relation === 'candidate') {
        const candidates = dbData.candidates || [];
        result.candidate = deserializeDates(candidates.find((c: any) => c.id === result.candidateId)) || null;
      }
      else if (relation === 'candidates') {
        let candidates = (dbData.candidates || []).filter((c: any) => c.eventId === result.id);
        candidates.sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
        candidates = candidates.map((c: any) => {
          const cCopy = { ...c };
          const voteList = (dbData.votes || []).filter((v: any) => v.candidateId === c.id);
          cCopy._count = { votes: voteList.length };
          cCopy.votes = voteList;
          return cCopy;
        });
        result.candidates = deserializeDates(candidates);
      }
      else if (relation === 'votes') {
        let votes: any[] = [];
        if (collectionName === 'events') {
          votes = (dbData.votes || []).filter((v: any) => v.eventId === result.id);
        } else if (collectionName === 'candidates') {
          votes = (dbData.votes || []).filter((v: any) => v.candidateId === result.id);
        } else if (collectionName === 'voters') {
          votes = (dbData.votes || []).filter((v: any) => v.voterId === result.id);
        } else {
          votes = (dbData.votes || []).filter((v: any) => v.eventId === result.id);
        }
        result.votes = deserializeDates(votes);
      }
      else if (relation === 'events') {
        const events = (dbData.events || []).filter((e: any) => e.organizationId === result.id);
        result.events = deserializeDates(events);
      }
      else if (relation === 'voters') {
        const voters = (dbData.voters || []).filter((v: any) => v.organizationId === result.id);
        result.voters = deserializeDates(voters);
      }
      else if (relation === 'boothSetting') {
        const settings = (dbData.offline_booth_settings || []).find((s: any) => s.eventId === result.id);
        result.boothSetting = deserializeDates(settings) || null;
      }
      else if (relation === 'participations') {
        let participations = (dbData.event_voter_participations || []).filter((p: any) => p.eventId === result.id || p.voterId === result.id);
        result.participations = deserializeDates(participations);
      }
      else if (relation === '_count') {
        const select = (value as any).select || {};
        result._count = {};
        if (select.votes) {
          if (collectionName === 'events') {
            result._count.votes = (dbData.votes || []).filter((v: any) => v.eventId === result.id).length;
          } else if (collectionName === 'candidates') {
            result._count.votes = (dbData.votes || []).filter((v: any) => v.candidateId === result.id).length;
          }
        }
        if (select.candidates) {
          result._count.candidates = (dbData.candidates || []).filter((c: any) => c.eventId === result.id).length;
        }
        if (select.voters) {
          result._count.voters = (dbData.voters || []).filter((v: any) => v.organizationId === result.id).length;
        }
      }
    }
  }

  return result;
}

class LocalModelAdapter {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getCollection(): any[] {
    const data = loadDatabase();
    if (!data[this.collectionName]) {
      data[this.collectionName] = [];
    }
    return data[this.collectionName];
  }

  async findUnique(args: { where: any; include?: any }) {
    const { where, include } = args;
    const items = this.getCollection();
    const found = items.find(item => matchesWhere(item, where));
    if (!found) return null;
    return resolveIncludes(this.collectionName, deserializeDates(found), include);
  }

  async findFirst(args: { where: any; orderBy?: any; include?: any }) {
    const { where, orderBy, include } = args;
    let items = this.getCollection().filter(item => matchesWhere(item, where));
    if (items.length === 0) return null;

    if (orderBy) {
      const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
      for (const [field, direction] of Object.entries(order)) {
        items.sort((a: any, b: any) => {
          const aVal = a[field];
          const bVal = b[field];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return direction === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          }
          return direction === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });
      }
    }

    return resolveIncludes(this.collectionName, deserializeDates(items[0]), include);
  }

  async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
    const { where, orderBy, include } = args || {};
    let items = this.getCollection().filter(item => matchesWhere(item, where));

    if (orderBy) {
      const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
      for (const [field, direction] of Object.entries(order)) {
        items.sort((a: any, b: any) => {
          const aVal = a[field];
          const bVal = b[field];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return direction === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          }
          return direction === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });
      }
    }

    return resolveIncludes(this.collectionName, deserializeDates(items), include);
  }

  async createMany(args: { data: any[] }) {
    const { data } = args;
    const items = this.getCollection();
    const now = new Date().toISOString();
    const createdItems: any[] = [];

    for (const item of data) {
      const id = item.id || crypto.randomUUID();
      const newDoc = {
        ...serializeDates(item),
        id,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : now,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : now
      };
      items.push(newDoc);
      createdItems.push(deserializeDates(newDoc));
    }

    saveDatabase();
    return { count: createdItems.length };
  }

  async updateMany(args: { where?: any; data: any }) {
    const { where, data } = args;
    const items = this.getCollection();
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
      if (matchesWhere(items[i], where)) {
        items[i] = {
          ...items[i],
          ...serializeDates(data),
          updatedAt: now
        };
        updatedCount++;
      }
    }

    saveDatabase();
    return { count: updatedCount };
  }

  async upsert(args: { where: any; create: any; update: any }) {
    const { where, create, update } = args;
    const items = this.getCollection();
    const index = items.findIndex(item => matchesWhere(item, where));

    if (index !== -1) {
      return this.update({ where, data: update });
    } else {
      return this.create({ data: create });
    }
  }

  async create(args: { data: any }) {
    const { data } = args;
    const items = this.getCollection();
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newDoc = {
      ...serializeDates(data),
      id,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
      updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : now
    };

    items.push(newDoc);
    saveDatabase();
    return deserializeDates(newDoc);
  }

  async update(args: { where: any; data: any }) {
    const { where, data } = args;
    const items = this.getCollection();
    const index = items.findIndex(item => matchesWhere(item, where));
    if (index === -1) {
      throw new Error(`Record to update not found in ${this.collectionName}`);
    }

    const updated = {
      ...items[index],
      ...serializeDates(data),
      updatedAt: new Date().toISOString()
    };

    items[index] = updated;
    saveDatabase();
    return deserializeDates(updated);
  }

  async delete(args: { where: any }) {
    const { where } = args;
    const items = this.getCollection();
    const index = items.findIndex(item => matchesWhere(item, where));
    if (index === -1) {
      throw new Error(`Record to delete not found in ${this.collectionName}`);
    }

    const deleted = items.splice(index, 1)[0];
    saveDatabase();
    return deserializeDates(deleted);
  }

  async deleteMany(args?: { where?: any }) {
    const { where } = args || {};
    const items = this.getCollection();
    const initialLen = items.length;
    const filtered = items.filter(item => !matchesWhere(item, where));
    
    inMemoryData[this.collectionName] = filtered;
    saveDatabase();
    return { count: initialLen - filtered.length };
  }

  async count(args?: { where?: any }) {
    const { where } = args || {};
    const items = this.getCollection().filter(item => matchesWhere(item, where));
    return items.length;
  }
}

// Local Database Adapter Instance
const localDb: any = {
  $transaction: async (fn: (tx: any) => any) => fn(localDb),
  organization: new LocalModelAdapter('organizations'),
  user: new LocalModelAdapter('users'),
  voter: new LocalModelAdapter('voters'),
  event: new LocalModelAdapter('events'),
  offlineBoothSetting: new LocalModelAdapter('offline_booth_settings'),
  candidate: new LocalModelAdapter('candidates'),
  vote: new LocalModelAdapter('votes'),
  eventVoterParticipation: new LocalModelAdapter('event_voter_participations'),
  announcement: new LocalModelAdapter('announcements'),
  auditLog: new LocalModelAdapter('audit_logs'),
};

// Export unified db: uses Prisma (Supabase PostgreSQL) when DATABASE_URL is configured, else localDb
export const db: any = prismaInstance || localDb;
export default db;
