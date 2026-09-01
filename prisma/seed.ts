import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/crypto.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.announcement.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eventVoterParticipation.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.offlineBoothSetting.deleteMany();
  await prisma.event.deleteMany();
  await prisma.voter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Create organizations
  const schoolA = await prisma.organization.create({
    data: {
      name: 'Greenwood High School',
      slug: 'school-a',
      plan: 'FREE',
      primaryColor: '#7C3AED',
      secondaryColor: '#A78BFA',
    },
  });

  const corpB = await prisma.organization.create({
    data: {
      name: 'Nexus Technology Inc.',
      slug: 'corp-b',
      plan: 'PRO',
      primaryColor: '#2563EB', // Blue for Pro customization demo
      secondaryColor: '#60A5FA',
    },
  });

  console.log('Created organizations.');

  // 3. Create users
  const superPass = await hashPassword('SuperVotelyPass123!');
  const adminPass = await hashPassword('AdminPass123!');

  await prisma.user.create({
    data: {
      name: 'Votely Super Admin',
      email: 'superadmin@votely.app',
      passwordHash: superPass,
      role: 'SUPER_ADMIN',
    },
  });

  const adminSchool = await prisma.user.create({
    data: {
      name: 'Principal Green',
      email: 'admin-a@votely.app',
      passwordHash: adminPass,
      role: 'ADMIN',
      organizationId: schoolA.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'CEO Nexus',
      email: 'admin-b@votely.app',
      passwordHash: adminPass,
      role: 'ADMIN',
      organizationId: corpB.id,
    },
  });

  console.log('Created admin and superadmin users.');

  // 4. Create voters for Greenwood High School
  const voterData = [
    { name: 'Alice Johnson', studentId: 'GW-001', class: '12-A', dept: 'Science', phone: '08123456789', email: 'alice@gwh.edu', qr: 'VTLY-8QP2KD91AX7', pass: '889977', inv: 'INV-10001' },
    { name: 'Bob Miller', studentId: 'GW-002', class: '12-A', dept: 'Science', phone: '08123456790', email: 'bob@gwh.edu', qr: 'VTLY-1Y7A9Z5E2K3', pass: '223344', inv: 'INV-10002' },
    { name: 'Charlie Davis', studentId: 'GW-003', class: '12-B', dept: 'Arts', phone: '08123456791', email: 'charlie@gwh.edu', qr: 'VTLY-3K9X4M2Z8L5', pass: '556677', inv: 'INV-10003' },
    { name: 'Diana Prince', studentId: 'GW-004', class: '12-B', dept: 'Arts', phone: '08123456792', email: 'diana@gwh.edu', qr: 'VTLY-9A2B4C6D8E1', pass: '112233', inv: 'INV-10004' },
    { name: 'Ethan Hunt', studentId: 'GW-005', class: '11-A', dept: 'Science', phone: '08123456793', email: 'ethan@gwh.edu', qr: 'VTLY-6F8G2H4J6K8', pass: '445566', inv: 'INV-10005' },
    { name: 'Fiona Gallagher', studentId: 'GW-006', class: '11-B', dept: 'Commerce', phone: '08123456794', email: 'fiona@gwh.edu', qr: 'VTLY-5M7N2P9Q3R4', pass: '778899', inv: 'INV-10006' },
    { name: 'George Clark', studentId: 'GW-007', class: '11-B', dept: 'Commerce', phone: '08123456795', email: 'george@gwh.edu', qr: 'VTLY-7S8T2U9V4W5', pass: '990011', inv: 'INV-10007' },
    { name: 'Hannah Baker', studentId: 'GW-008', class: '10-A', dept: 'General', phone: '08123456796', email: 'hannah@gwh.edu', qr: 'VTLY-2X3Y9Z4A5B6', pass: '334455', inv: 'INV-10008' },
    { name: 'Ian Curtis', studentId: 'GW-009', class: '10-B', dept: 'General', phone: '08123456797', email: 'ian@gwh.edu', qr: 'VTLY-4C5D9E2F3G4', pass: '667788', inv: 'INV-10009' },
    { name: 'Julia Roberts', studentId: 'GW-010', class: '10-B', dept: 'General', phone: '08123456798', email: 'julia@gwh.edu', qr: 'VTLY-1H2J9K3L4M5', pass: '121212', inv: 'INV-10010' },
  ];

  const voters = [];
  for (const v of voterData) {
    const voter = await prisma.voter.create({
      data: {
        organizationId: schoolA.id,
        name: v.name,
        studentId: v.studentId,
        class: v.class,
        department: v.dept,
        phone: v.phone,
        email: v.email,
        qrToken: v.qr,
        votingPass: v.pass,
        invitationNum: v.inv,
      },
    });
    voters.push(voter);
  }

  console.log(`Created ${voters.length} mock voters.`);

  // 5. Create Events for schoolA
  // Event 1: Student Council Election (Online Mode, QR_ONLY auth)
  const event1 = await prisma.event.create({
    data: {
      organizationId: schoolA.id,
      name: 'Student Council Election 2026',
      description: 'Annual election to choose the student president and vice president of Greenwood High.',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // started 2 days ago
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),   // ends in 5 days
      votingMode: 'ONLINE',
      authMethod: 'QR_ONLY',
      status: 'PUBLISHED',
      allowLiveResult: true,
      hideRunningResult: false,
    },
  });

  // Event 2: Prom King & Queen 2026 (Offline Booth Mode)
  const event2 = await prisma.event.create({
    data: {
      organizationId: schoolA.id,
      name: 'Prom King & Queen 2026',
      description: 'Electronic voting booth election during the Prom Night 2026.',
      startDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // started 1 hour ago
      endDate: new Date(Date.now() + 4 * 60 * 60 * 1000),   // ends in 4 hours
      votingMode: 'OFFLINE',
      authMethod: 'QR_ONLY',
      status: 'PUBLISHED',
      allowLiveResult: true,
      hideRunningResult: false,
    },
  });

  // Create Offline Booth settings for Event 2
  await prisma.offlineBoothSetting.create({
    data: {
      eventId: event2.id,
      enableBoothMode: true,
      enableKioskMode: true,
      fullscreen: true,
      autoLogout: true,
      autoReturn: true,
      idleTimeout: 30,
      sessionTimeout: 120,
      cameraScan: true,
    },
  });

  console.log('Created mock events and booth settings.');

  // 6. Create Candidates for Event 1
  const cand1 = await prisma.candidate.create({
    data: {
      eventId: event1.id,
      number: 1,
      name: 'Jane Doe',
      vision: 'Empowered Student Body & Inclusivity',
      mission: 'Create interactive clubs, host monthly open-mic nights, and establish feedback loops between students and administration.',
      socialMedia: { instagram: '@janedoe_gwh', twitter: '@jane_council' },
    },
  });

  const cand2 = await prisma.candidate.create({
    data: {
      eventId: event1.id,
      number: 2,
      name: 'John Smith',
      vision: 'Innovative & Tech-Driven Campus',
      mission: 'Upgrade computer lab stations, introduce free campus Wi-Fi expansion, and start a student e-sports league.',
      socialMedia: { instagram: '@johnsmith_tech', github: 'john-smith-code' },
    },
  });

  const cand3 = await prisma.candidate.create({
    data: {
      eventId: event1.id,
      number: 3,
      name: 'Alice Cooper',
      vision: 'Green Campus & Healthy Lifestyle',
      mission: 'Build an organic greenhouse, organize cycle-to-school weeks, and upgrade cafeteria food choices with healthy options.',
      socialMedia: { instagram: '@alice_greenwood' },
    },
  });

  // Create Candidates for Event 2
  const cand21 = await prisma.candidate.create({
    data: {
      eventId: event2.id,
      number: 1,
      name: 'Kevin Parker & Taylor Swift',
      vision: 'A Magical Night of Indie Rock & Pop',
      mission: 'Ensure the dance floor stays packed all night and organize the best afterparty.',
    },
  });

  const cand22 = await prisma.candidate.create({
    data: {
      eventId: event2.id,
      number: 2,
      name: 'Elon Musk & Grimes',
      vision: 'Interstellar Techno Ballroom',
      mission: 'Bring space-age laser shows and futuristic synth beats to the ballroom.',
    },
  });

  console.log('Created candidates.');

  // 7. Seed initial votes for Event 1 to populate analytics graphs
  // Alice, Bob, Charlie, Diana, Ethan, and Fiona vote.
  const participations = [
    { voter: voters[0], candidate: cand1, device: 'iPhone', browser: 'Safari', ip: '192.168.1.50' },
    { voter: voters[1], candidate: cand1, device: 'Android', browser: 'Chrome', ip: '192.168.1.51' },
    { voter: voters[2], candidate: cand2, device: 'Windows PC', browser: 'Edge', ip: '192.168.1.52' },
    { voter: voters[3], candidate: cand2, device: 'Macbook Pro', browser: 'Chrome', ip: '192.168.1.53' },
    { voter: voters[4], candidate: cand3, device: 'iPad', browser: 'Safari', ip: '192.168.1.54' },
    { voter: voters[5], candidate: cand1, device: 'Windows PC', browser: 'Firefox', ip: '192.168.1.55' },
  ];

  for (const p of participations) {
    // Record Voter Participation (to prevent double-voting)
    await prisma.eventVoterParticipation.create({
      data: {
        eventId: event1.id,
        voterId: p.voter.id,
        device: p.device,
        browser: p.browser,
        ipAddress: p.ip,
      },
    });

    // Record Anonymous Vote
    await prisma.vote.create({
      data: {
        eventId: event1.id,
        candidateId: p.candidate.id,
        device: p.device,
        browser: p.browser,
        ipAddress: p.ip,
      },
    });
  }

  // Seed 2 votes for Event 2 (Offline Booth)
  const boothVotes = [
    { voter: voters[6], candidate: cand21, device: 'Booth-Kiosk-1', browser: 'Chrome Kiosk', ip: '10.0.0.101' },
    { voter: voters[7], candidate: cand22, device: 'Booth-Kiosk-1', browser: 'Chrome Kiosk', ip: '10.0.0.101' },
  ];

  for (const bv of boothVotes) {
    await prisma.eventVoterParticipation.create({
      data: {
        eventId: event2.id,
        voterId: bv.voter.id,
        device: bv.device,
        browser: bv.browser,
        ipAddress: bv.ip,
      },
    });

    await prisma.vote.create({
      data: {
        eventId: event2.id,
        candidateId: bv.candidate.id,
        device: bv.device,
        browser: bv.browser,
        ipAddress: bv.ip,
      },
    });
  }

  // 8. Create some Audit Logs
  await prisma.auditLog.create({
    data: {
      organizationId: schoolA.id,
      userId: adminSchool.id,
      action: 'EVENT_CREATE',
      details: 'Created Student Council Election 2026.',
      ipAddress: '127.0.0.1',
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: schoolA.id,
      userId: adminSchool.id,
      action: 'VOTER_IMPORT',
      details: 'Imported 10 initial students via system seed.',
      ipAddress: '127.0.0.1',
    },
  });

  // 9. Create announcements
  await prisma.announcement.create({
    data: {
      organizationId: schoolA.id,
      title: 'Greenwood High Elections are Live!',
      content: 'Make sure to scan your voter invitation QR code at the library booth or log in online to cast your vote for the 2026 Student President!',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
