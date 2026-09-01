import { db } from './db';

// Ensure emulator variables are set if executed directly
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}
if (!process.env.GCLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = 'votely-demo';
}

async function seed() {
  console.log("Starting Firebase Firestore Seeding...");
  
  // Clear collections first
  const models = [
    'organization', 'user', 'voter', 'event', 
    'offlineBoothSetting', 'candidate', 'vote', 
    'eventVoterParticipation', 'announcement', 'auditLog'
  ];
  
  for (const model of models) {
    try {
      await db[model].deleteMany({});
      console.log(`Cleared model collection: ${model}`);
    } catch (e) {
      console.error(`Error clearing ${model}:`, e);
    }
  }
  
  // 1. Create Organization
  const org = await db.organization.create({
    data: {
      id: 'school-a-id',
      name: 'Greenwood High School',
      slug: 'school-a',
      primaryColor: '#7C3AED',
      secondaryColor: '#A78BFA',
      logoUrl: null,
      bannerUrl: null,
      customDomain: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`Created Organization: ${org.name}`);
  
  // 2. Create Admin User (Password is: admin123)
  const adminUser = await db.user.create({
    data: {
      id: 'admin-user-id',
      name: 'Admin Greenwood',
      email: 'admin@gwh.edu',
      passwordHash: '$2a$12$R.S2hV48C0c6aL0N42F/5.pP.k1F1hN2zXyN4aL3S1eG4V5kF5O/G',
      role: 'ADMIN',
      organizationId: org.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`Created Admin User: ${adminUser.name}`);

  // 3. Create Voters
  const votersData = [
    { name: 'Alice Johnson', studentId: 'GW-001', pass: '889977', qr: 'VTLY-7S8T2U9V4W5', dept: '12th Grade', phone: '08123456789', email: 'alice@gwh.edu', inv: 'INV-10001' },
    { name: 'Bob Miller', studentId: 'GW-002', pass: '112233', qr: 'VTLY-1Y7A9Z5E2K3', dept: '12th Grade', phone: '08123456790', email: 'bob@gwh.edu', inv: 'INV-10002' },
    { name: 'Carol Smith', studentId: 'GW-003', pass: '445566', qr: 'VTLY-9A2B3C4D5E6', dept: '11th Grade', phone: '08123456791', email: 'carol@gwh.edu', inv: 'INV-10003' },
    { name: 'David Jones', studentId: 'GW-004', pass: '556677', qr: 'VTLY-3X4Y5Z6A7B8', dept: '11th Grade', phone: '08123456792', email: 'david@gwh.edu', inv: 'INV-10004' },
    { name: 'Eva Davis', studentId: 'GW-005', pass: '667788', qr: 'VTLY-1M2N3P4Q5R6', dept: '10th Grade', phone: '08123456793', email: 'eva@gwh.edu', inv: 'INV-10005' }
  ];

  for (const v of votersData) {
    const voter = await db.voter.create({
      data: {
        organizationId: org.id,
        name: v.name,
        studentId: v.studentId,
        class: '12-A',
        department: v.dept,
        phone: v.phone,
        email: v.email,
        qrToken: v.qr,
        votingPass: v.pass,
        invitationNum: v.inv,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`Created Voter: ${voter.name} (${voter.qrToken})`);
  }

  // 4. Create Events
  const event1 = await db.event.create({
    data: {
      id: 'event-1-id',
      organizationId: org.id,
      name: 'Student Council Election 2026',
      description: 'Annual election to choose the student president and vice president of Greenwood High.',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      votingMode: 'ONLINE',
      authMethod: 'QR_ONLY',
      status: 'PUBLISHED',
      allowLiveResult: true,
      hideRunningResult: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`Created Event 1: ${event1.name}`);

  const event2 = await db.event.create({
    data: {
      id: 'event-2-id',
      organizationId: org.id,
      name: 'Prom King & Queen 2026',
      description: 'Electronic voting booth election during the Prom Night 2026.',
      startDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      votingMode: 'OFFLINE',
      authMethod: 'QR_ONLY',
      status: 'PUBLISHED',
      allowLiveResult: true,
      hideRunningResult: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`Created Event 2: ${event2.name}`);

  // Create Offline Booth settings for Event 2
  const setting = await db.offlineBoothSetting.create({
    data: {
      id: 'booth-setting-event-2-id',
      eventId: event2.id,
      enableBoothMode: true,
      enableKioskMode: true,
      fullscreen: true,
      autoLogout: true,
      autoReturn: true,
      idleTimeout: 30,
      sessionTimeout: 120,
      cameraScan: true
    }
  });
  console.log(`Created Offline Booth Settings for Event 2`);

  // 5. Create Candidates for Event 1
  const candidates1 = [
    { number: 1, name: 'Jane Doe', vision: 'Empowered Student Body & Inclusivity', mission: 'Create interactive clubs, host monthly open-mic nights, and establish feedback loops.' },
    { number: 2, name: 'John Smith', vision: 'Innovative & Tech-Driven Campus', mission: 'Upgrade computer lab stations, introduce free campus Wi-Fi expansion, and start esports.' },
    { number: 3, name: 'Alice Cooper', vision: 'Green Campus & Healthy Lifestyle', mission: 'Build an organic greenhouse, organize cycle-to-school weeks, and upgrade cafeteria.' }
  ];

  for (const c of candidates1) {
    const cand = await db.candidate.create({
      data: {
        eventId: event1.id,
        number: c.number,
        name: c.name,
        vision: c.vision,
        mission: c.mission,
        socialMedia: { instagram: '@greenwood_inst' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`Created Event 1 Candidate: ${cand.name}`);
  }

  // Create Candidates for Event 2
  const candidates2 = [
    { number: 1, name: 'Robert Downey', vision: 'Bring Hollywood glamour to Prom', mission: 'Design a glamorous red-carpet entry and curate premium food and beverage bars.' },
    { number: 2, name: 'Scarlett Johansson', vision: 'An unforgettable, elegant prom night', mission: 'Install a 360-degree slow-motion photo booth and extend voting access hours.' }
  ];

  for (const c of candidates2) {
    const cand = await db.candidate.create({
      data: {
        eventId: event2.id,
        number: c.number,
        name: c.name,
        vision: c.vision,
        mission: c.mission,
        socialMedia: { instagram: '@prom_royal' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`Created Event 2 Candidate: ${cand.name}`);
  }

  console.log("Firestore database seeded successfully!");
}

seed().catch(err => {
  console.error("Error seeding Firestore:", err);
  process.exit(1);
});
