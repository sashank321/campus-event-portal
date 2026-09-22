const bcrypt = require('bcryptjs');

const { connectDB } = require('../config/db');
const { env } = require('../config/env');
const {
  User,
  Club,
  Venue,
  Event,
  Registration,
  Announcement,
} = require('../models');

const SEED_PASSWORDS = {
  admin: 'Admin@123',
  organizer: 'Organizer@123',
  student: 'Student@123',
};

function daysFromNow(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function upsertUser(userData, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const { email } = userData;
  return User.updateOne(
    { email },
    { $set: { ...userData, email }, $setOnInsert: { passwordHash } },
    { upsert: true }
  );
}

async function seed() {
  const { connected, error } = await connectDB();
  if (!connected) {
    console.error(`[seed] aborted: ${error}`);
    process.exit(1);
  }

  try {
    const results = {};

    // --- Users (deterministic emails; password never overwritten on reseed) ---
    results.admin = await upsertUser(
      {
        name: 'Portal Admin',
        email: 'admin@campus.edu',
        role: 'admin',
        profile: { department: 'CSE' },
        isActive: true,
      },
      SEED_PASSWORDS.admin
    );
    results.organizer = await upsertUser(
      {
        name: 'Faculty Organizer',
        email: 'organizer@campus.edu',
        role: 'organizer',
        profile: { department: 'CSE', phone: '9000000001' },
        isActive: true,
      },
      SEED_PASSWORDS.organizer
    );
    results.student = await upsertUser(
      {
        name: 'Sample Student',
        email: 'student@campus.edu',
        role: 'student',
        profile: { rollNo: '21CSE001', department: 'CSE', year: 2, phone: '9000000002' },
        isActive: true,
      },
      SEED_PASSWORDS.student
    );

    const organizer = await User.findOne({ email: 'organizer@campus.edu' });
    const admin = await User.findOne({ email: 'admin@campus.edu' });

    // --- Clubs ---
    const clubs = [
      {
        name: 'Coding Club',
        slug: 'coding-club',
        description: 'Programming contests, hackathons and open-source sprints.',
        coordinators: [{ user: organizer._id, role: 'Faculty Coordinator' }],
      },
      {
        name: 'Cultural Club',
        slug: 'cultural-club',
        description: 'Music, dance and drama events across the campus calendar.',
      },
      {
        name: 'Sports Club',
        slug: 'sports-club',
        description: 'Inter-college tournaments, tryouts and fitness drives.',
      },
      {
        name: 'Robotics Club',
        slug: 'robotics-club',
        description: 'Build sessions, line-follower races and drone workshops.',
      },
    ];
    for (const club of clubs) {
      await Club.updateOne({ slug: club.slug }, { $set: club }, { upsert: true });
    }

    // --- Venues ---
    const venues = [
      { name: 'Main Auditorium', building: 'Central Block', capacity: 500, facilities: ['AV system', 'AC', 'stage'] },
      { name: 'Seminar Hall A', building: 'CSE Block', capacity: 120, facilities: ['projector', 'AC'] },
      { name: 'Sports Complex', building: 'East Campus', capacity: 1000, facilities: ['grounds', 'floodlights'] },
      { name: 'Open Air Stage', building: 'Quadrangle', capacity: 800, facilities: ['stage', 'sound system'] },
    ];
    for (const venue of venues) {
      await Venue.updateOne({ name: venue.name }, { $set: venue }, { upsert: true });
    }

    const [codingClub, culturalClub, sportsClub, roboticsClub] = await Club.find()
      .sort({ slug: 1 });
    const [auditorium, seminarHall, sportsComplex, openAirStage] = await Venue.find()
      .sort({ name: 1 });

    // --- Events (upsert by slug; registeredCount only set on insert to avoid counter desync) ---
    const events = [
      {
        title: 'HackThe Campus 24-Hour Hackathon',
        slug: 'hackthe-campus-24-hour-hackathon',
        description: 'A 24-hour hackathon open to all departments. Teams of up to 4. Themes revealed at kickoff.',
        category: 'hackathon',
        club: codingClub._id,
        organizers: [organizer._id],
        venue: seminarHall._id,
        status: 'approved',
        startAt: daysFromNow(14, 9),
        endAt: daysFromNow(15, 9),
        registrationDeadline: daysFromNow(12, 23),
        capacity: 100,
        bannerUrl: '/uploads/hackathon-banner.jpg',
        rules: ['Teams of 2-4', 'Open to all departments', 'Bring your own laptop'],
        tags: ['coding', 'hackathon', '24hours'],
        isFeatured: true,
        createdBy: admin._id,
      },
      {
        title: 'Intro to React Workshop',
        slug: 'intro-to-react-workshop',
        description: 'Hands-on workshop covering components, hooks and state. Beginner friendly.',
        category: 'workshop',
        club: codingClub._id,
        organizers: [organizer._id],
        venue: seminarHall._id,
        status: 'approved',
        startAt: daysFromNow(7, 11),
        endAt: daysFromNow(7, 14),
        registrationDeadline: daysFromNow(5, 23),
        capacity: 60,
        rules: ['Basic JS required'],
        tags: ['react', 'frontend', 'workshop'],
        createdBy: admin._id,
      },
      {
        title: 'Annual Cultural Fest - Rhythm Nights',
        slug: 'annual-cultural-fest-rhythm-nights',
        description: 'The flagship cultural night: band performances, dance battles and celebrity guests.',
        category: 'fest',
        club: culturalClub._id,
        organizers: [organizer._id],
        venue: openAirStage._id,
        status: 'approved',
        startAt: daysFromNow(30, 17),
        endAt: daysFromNow(30, 22),
        registrationDeadline: daysFromNow(25, 23),
        capacity: 800,
        tags: ['cultural', 'music', 'fest'],
        isFeatured: true,
        createdBy: admin._id,
      },
      {
        title: 'Inter-College Football Tournament',
        slug: 'inter-college-football-tournament',
        description: 'Knockout football tournament between department teams. Referees provided.',
        category: 'sports',
        club: sportsClub._id,
        organizers: [organizer._id],
        venue: sportsComplex._id,
        status: 'approved',
        startAt: daysFromNow(21, 8),
        endAt: daysFromNow(22, 16),
        registrationDeadline: daysFromNow(18, 23),
        capacity: 200,
        tags: ['football', 'sports', 'tournament'],
        createdBy: admin._id,
      },
      {
        title: 'AI in Healthcare Seminar',
        slug: 'ai-in-healthcare-seminar',
        description: 'Guest lecture on applied machine learning in medical diagnostics and imaging.',
        category: 'seminar',
        club: roboticsClub._id,
        organizers: [organizer._id],
        venue: auditorium._id,
        status: 'approved',
        startAt: daysFromNow(10, 15),
        endAt: daysFromNow(10, 17),
        registrationDeadline: daysFromNow(8, 23),
        capacity: 300,
        tags: ['ai', 'ml', 'healthcare'],
        createdBy: admin._id,
      },
      {
        title: 'RoboRace Line Follower Challenge',
        slug: 'roborace-line-follower-challenge',
        description: 'Build and race autonomous line-follower bots. Kits available on request.',
        category: 'competition',
        club: roboticsClub._id,
        organizers: [organizer._id],
        venue: seminarHall._id,
        status: 'pending',
        startAt: daysFromNow(45, 10),
        endAt: daysFromNow(45, 16),
        registrationDeadline: daysFromNow(40, 23),
        capacity: 50,
        tags: ['robotics', 'competition'],
        createdBy: admin._id,
      },
    ];
    for (const event of events) {
      await Event.updateOne(
        { slug: event.slug },
        { $set: { ...event, slug: event.slug }, $setOnInsert: { registeredCount: 0 } },
        { upsert: true }
      );
    }

    // --- Global announcement ---
    await Announcement.updateOne(
      { title: 'Welcome to the Campus Event Portal' },
      {
        $set: {
          title: 'Welcome to the Campus Event Portal',
          body: 'Discover events, workshops and fests across campus. Register early - seats are limited!',
          scope: 'global',
          createdBy: admin._id,
          isPinned: true,
        },
      },
      { upsert: true }
    );

    const counts = {
      users: await User.countDocuments(),
      clubs: await Club.countDocuments(),
      venues: await Venue.countDocuments(),
      events: await Event.countDocuments(),
      registrations: await Registration.countDocuments(),
      announcements: await Announcement.countDocuments(),
    };

    console.log('[seed] completed:', JSON.stringify(counts, null, 2));
  } finally {
    await require('mongoose').disconnect();
    console.log(`[seed] disconnected (${env.nodeEnv})`);
  }
}

seed().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
