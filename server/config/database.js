const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const os = require('os');
const isVercel = Boolean(process.env.VERCEL);
const dbDir = isVercel ? os.tmpdir() : path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'campusflow.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance & reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin', 'staff')),
      department TEXT DEFAULT 'General',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('infrastructure', 'academic', 'hostel', 'cafeteria', 'library', 'it_support', 'other')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL CHECK(status IN ('submitted', 'assigned', 'in_progress', 'resolved', 'reopened')),
      location TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      assigned_to_id INTEGER,
      assigned_to_name TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS issue_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      content TEXT NOT NULL,
      status_change TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('academic', 'cultural', 'sports', 'technical', 'workshop', 'career')),
      organizer TEXT NOT NULL,
      location TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 50,
      banner_url TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('study_room', 'lab_equipment', 'sports_gear', 'auditorium', 'hardware_tool')),
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      availability_status TEXT NOT NULL DEFAULT 'available' CHECK(availability_status IN ('available', 'reserved', 'maintenance')),
      max_duration_hours INTEGER DEFAULT 4,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resource_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      resource_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
    CREATE INDEX IF NOT EXISTS idx_issues_student ON issues(student_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON resource_bookings(user_id);
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('🌱 Seeding CampusFlow database with initial data...');

  const passwordHash = bcrypt.hashSync('student123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);
  const staffHash = bcrypt.hashSync('staff123', 10);

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Alex Rivera (Student)', 'student@campusflow.edu', passwordHash, 'student', 'Computer Science', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  insertUser.run('Dr. Marcus Vance (Admin)', 'admin@campusflow.edu', adminHash, 'admin', 'Campus Operations & Dean', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  insertUser.run('Elena Rostova (Staff)', 'staff@campusflow.edu', staffHash, 'staff', 'IT & Infrastructure Support', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
  insertUser.run('Sarah Jenkins (Student)', 'sarah.j@campusflow.edu', passwordHash, 'student', 'Mechanical Engineering', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80');
  insertUser.run('David Kim (Student)', 'david.k@campusflow.edu', passwordHash, 'student', 'Electrical Engineering', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80');

  // Insert Issues across various workflow states
  const insertIssue = db.prepare(`
    INSERT INTO issues (title, description, category, priority, status, location, student_id, student_name, assigned_to_id, assigned_to_name, image_url, created_at, updated_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?)
  `);

  insertIssue.run(
    'Wi-Fi signal drops in Engineering Library Block C',
    'Frequent disconnection during peak study hours between 2 PM and 6 PM. Affects roughly 40+ students on the 3rd floor.',
    'it_support',
    'high',
    'in_progress',
    'Library Building C, 3rd Floor',
    1,
    'Alex Rivera (Student)',
    3,
    'Elena Rostova (Staff)',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80',
    '-3 days',
    '-1 hours',
    null
  );

  insertIssue.run(
    'Broken HVAC Air Filter causing noise in Lab 402',
    'Loud rattling sound coming from ventilation duct above the robotics workbench. Could cause overheating.',
    'infrastructure',
    'urgent',
    'assigned',
    'Turing Hall, Lab 402',
    4,
    'Sarah Jenkins (Student)',
    2,
    'Dr. Marcus Vance (Admin)',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    '-2 days',
    '-5 hours',
    null
  );

  insertIssue.run(
    'Cafeteria Digital Payment Scanner Offline',
    'Counter 2 QR payment scanner keeps timing out resulting in massive lunch queues.',
    'cafeteria',
    'medium',
    'resolved',
    'Central Dining Commons',
    5,
    'David Kim (Student)',
    3,
    'Elena Rostova (Staff)',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    '-5 days',
    '-1 days',
    new Date(Date.now() - 86400000).toISOString()
  );

  insertIssue.run(
    'Hostel B Water Purifier Filter Indicator Flashing Red',
    'Filter replacement alert has been blinking since yesterday morning on the 2nd floor dispenser.',
    'hostel',
    'high',
    'submitted',
    'Hostel Block B, 2nd Floor Corridor',
    1,
    'Alex Rivera (Student)',
    null,
    null,
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=500&auto=format&fit=crop&q=80',
    '-6 hours',
    '-6 hours',
    null
  );

  insertIssue.run(
    'Projector Bulb Flickering in Lecture Hall A1',
    'Color distortion and constant blinking making slides illegible for CS301 classes.',
    'academic',
    'medium',
    'reopened',
    'Science Complex Hall A1',
    4,
    'Sarah Jenkins (Student)',
    3,
    'Elena Rostova (Staff)',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80',
    '-4 days',
    '-3 hours',
    null
  );

  // Insert Comments & Audit Trail
  const insertComment = db.prepare(`
    INSERT INTO issue_comments (issue_id, user_id, user_name, user_role, content, status_change, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertComment.run(1, 1, 'Alex Rivera (Student)', 'student', 'Issue submitted with signal strength test logs.', 'submitted', '-3 days');
  insertComment.run(1, 2, 'Dr. Marcus Vance (Admin)', 'admin', 'Assigned to Elena Rostova (IT infrastructure team).', 'assigned', '-2 days');
  insertComment.run(1, 3, 'Elena Rostova (Staff)', 'staff', 'Diagnosed faulty Cisco AP channel overload. Replacement mesh unit ordered.', 'in_progress', '-1 hours');

  insertComment.run(3, 5, 'David Kim (Student)', 'student', 'Queue reached 50 people during lunch rush.', 'submitted', '-5 days');
  insertComment.run(3, 3, 'Elena Rostova (Staff)', 'staff', 'Replaced ethernet switch and updated POS firmware. Tested OK.', 'resolved', '-1 days');

  insertComment.run(5, 4, 'Sarah Jenkins (Student)', 'student', 'The projector went black again midway through lecture.', 'reopened', '-3 hours');

  // Insert Events
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, category, organizer, location, event_date, start_time, end_time, capacity, banner_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'Annual Campus Hackathon 2026: Build with AI',
    '36-hour sprint with mentorship, sponsored prizes ($5,000 pool), free meals, and keynote talks from industry leads.',
    'technical',
    'Tech & Coding Society',
    'Innovation Hub & Turing Auditorium',
    '2026-10-15',
    '09:00',
    '21:00',
    120,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
    2
  );

  insertEvent.run(
    'Fall Career & Internship Mega-Fair',
    'Connect with 45+ premier tech, engineering, and finance recruiters. Bring 10 copies of your resume.',
    'career',
    'University Career Center',
    'Grand Sports Complex Arena',
    '2026-10-22',
    '10:00',
    '17:00',
    300,
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
    2
  );

  insertEvent.run(
    'Cloud Native & DevOps Workshop',
    'Hands-on workshop covering Docker, Kubernetes, CI/CD pipelines, and microservices architecture.',
    'workshop',
    'Computer Science Department',
    'CS Lab 301',
    '2026-10-05',
    '14:00',
    '18:00',
    40,
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    2
  );

  insertEvent.run(
    'Inter-Department Badminton Championship',
    'Annual singles and doubles tournament. Trophies, medals, and refreshments provided.',
    'sports',
    'Campus Athletics Board',
    'Indoor Gymnasium Court 1-4',
    '2026-10-28',
    '08:30',
    '18:00',
    64,
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
    2
  );

  // Insert Event Registrations
  const insertReg = db.prepare(`
    INSERT INTO event_registrations (event_id, user_id, user_name, user_email)
    VALUES (?, ?, ?, ?)
  `);
  insertReg.run(1, 1, 'Alex Rivera (Student)', 'student@campusflow.edu');
  insertReg.run(1, 4, 'Sarah Jenkins (Student)', 'sarah.j@campusflow.edu');
  insertReg.run(2, 1, 'Alex Rivera (Student)', 'student@campusflow.edu');
  insertReg.run(3, 5, 'David Kim (Student)', 'david.k@campusflow.edu');

  // Insert Resources
  const insertResource = db.prepare(`
    INSERT INTO resources (name, description, category, location, availability_status, max_duration_hours, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertResource.run(
    'Collaborative Pod A (Smart Display + Whiteboard)',
    'Soundproof group study booth equipped with 4K AirPlay presentation screen and markerboard. Seats 6.',
    'study_room',
    'Central Library, 2nd Floor West',
    'available',
    4,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80'
  );

  insertResource.run(
    'Deep Learning Rig (NVIDIA RTX 4090 x 2)',
    'High-compute workstation reserved for ML/AI research, 3D simulation rendering, and CUDA workflows.',
    'lab_equipment',
    'AI Research Center, Room 108',
    'available',
    6,
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=80'
  );

  insertResource.run(
    'Industrial 3D Rapid Prototyping Station (Prusa XL)',
    'Multi-filament dual extruder 3D printer with PLA/PETG materials available on demand.',
    'hardware_tool',
    'Makerspace Workshop B12',
    'available',
    8,
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
  );

  insertResource.run(
    'Main University Amphitheater & Sound Rig',
    '300-seat multi-tier auditorium with dual Laser projection, Shure wireless mic system, and stage lights.',
    'auditorium',
    'Arts & Culture Building Level 1',
    'available',
    12,
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80'
  );

  insertResource.run(
    'Meta Quest 3 VR Development Kit (Pack of 2)',
    'Mixed reality headsets with developer controllers and Unity/Unreal spatial SDK presets.',
    'lab_equipment',
    'Human-Computer Interaction Lab 202',
    'available',
    4,
    'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=500&auto=format&fit=crop&q=80'
  );

  // Insert Initial Bookings
  const insertBooking = db.prepare(`
    INSERT INTO resource_bookings (resource_id, resource_name, user_id, user_name, start_time, end_time, purpose, status, admin_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBooking.run(
    1,
    'Collaborative Pod A (Smart Display + Whiteboard)',
    1,
    'Alex Rivera (Student)',
    '2026-10-02 14:00',
    '2026-10-02 17:00',
    'Senior Capstone Project brainstorming session',
    'approved',
    'Approved. Keycard access assigned to Alex Rivera.'
  );

  insertBooking.run(
    2,
    'Deep Learning Rig (NVIDIA RTX 4090 x 2)',
    4,
    'Sarah Jenkins (Student)',
    '2026-10-04 10:00',
    '2026-10-04 16:00',
    'Training YOLOv8 model on autonomous drone vision dataset',
    'pending',
    null
  );

  console.log('✅ CampusFlow database initialized and seeded successfully.');
}

module.exports = { db, initializeDatabase };
