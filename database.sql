-- =============================================================================
-- Votely Election Kiosk - Complete PostgreSQL / MySQL Database Schema & Seed Data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (IF EXISTS)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS event_voter_participations CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS offline_booth_settings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS voters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- -----------------------------------------------------------------------------
-- 2. CREATE SCHEMAS & TABLES (DDL)
-- -----------------------------------------------------------------------------

-- Organizations Table
CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan VARCHAR(32) DEFAULT 'FREE',
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(32) DEFAULT '#7C3AED',
    secondary_color VARCHAR(32) DEFAULT '#A78BFA',
    custom_domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Administrative Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) DEFAULT 'ADMIN',
    organization_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Registered Voters Roster Table
CREATE TABLE voters (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    student_id VARCHAR(64),
    class VARCHAR(64),
    department VARCHAR(255),
    phone VARCHAR(64),
    email VARCHAR(255),
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    voting_pass VARCHAR(64) NOT NULL,
    invitation_num VARCHAR(64) NOT NULL,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_voter_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT unique_voter_org_student UNIQUE (organization_id, student_id)
);

-- Elections / Events Table
CREATE TABLE events (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    logo TEXT,
    banner TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    voting_mode VARCHAR(32) DEFAULT 'ONLINE',
    auth_method VARCHAR(32) DEFAULT 'QR_ONLY',
    allow_live_result BOOLEAN DEFAULT TRUE,
    hide_running_result BOOLEAN DEFAULT FALSE,
    vote_confirmation BOOLEAN DEFAULT TRUE,
    anonymous_vote BOOLEAN DEFAULT TRUE,
    multiple_candidate BOOLEAN DEFAULT FALSE,
    max_votes INT DEFAULT 1,
    auto_close BOOLEAN DEFAULT TRUE,
    status VARCHAR(32) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Offline Kiosk / Booth Settings Table
CREATE TABLE offline_booth_settings (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    enable_booth_mode BOOLEAN DEFAULT TRUE,
    enable_kiosk_mode BOOLEAN DEFAULT FALSE,
    fullscreen BOOLEAN DEFAULT FALSE,
    auto_logout BOOLEAN DEFAULT TRUE,
    auto_return BOOLEAN DEFAULT TRUE,
    idle_timeout INT DEFAULT 60,
    session_timeout INT DEFAULT 300,
    camera_scan BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_booth_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Candidate Roster Table
CREATE TABLE candidates (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    social_media JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Votes Cast Table (Anonymous Ballots)
CREATE TABLE votes (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    candidate_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(255),
    browser VARCHAR(255),
    ip_address VARCHAR(64),
    CONSTRAINT fk_vote_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_vote_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- Event Voter Participation Table (Prevents Double Voting)
CREATE TABLE event_voter_participations (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    voter_id VARCHAR(64) NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(255),
    browser VARCHAR(255),
    ip_address VARCHAR(64),
    CONSTRAINT fk_participation_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_participation_voter FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
    CONSTRAINT unique_event_voter UNIQUE (event_id, voter_id)
);

-- Announcements Table
CREATE TABLE announcements (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcement_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 3. SEED INITIAL DATA (DML)
-- -----------------------------------------------------------------------------

-- Insert Organization
INSERT INTO organizations (id, name, slug, primary_color, secondary_color)
VALUES ('school-a-id', 'Greenwood High School', 'school-a', '#7C3AED', '#A78BFA');

-- Insert Admin User (Password: admin123)
INSERT INTO users (id, name, email, password_hash, role, organization_id)
VALUES (
    'admin-user-id', 
    'Admin Greenwood', 
    'admin@gwh.edu', 
    '$2a$12$R.S2hV48C0c6aL0N42F/5.pP.k1F1hN2zXyN4aL3S1eG4V5kF5O/G', 
    'ADMIN', 
    'school-a-id'
);

-- Insert Voters Roster
INSERT INTO voters (id, organization_id, name, student_id, class, department, phone, email, qr_token, voting_pass, invitation_num)
VALUES 
('voter-1-id', 'school-a-id', 'Alice Johnson', 'GW-001', '12-A', '12th Grade', '08123456789', 'alice@gwh.edu', 'VTLY-7S8T2U9V4W5', '889977', 'INV-10001'),
('voter-2-id', 'school-a-id', 'Bob Miller', 'GW-002', '12-A', '12th Grade', '08123456790', 'bob@gwh.edu', 'VTLY-1Y7A9Z5E2K3', '112233', 'INV-10002'),
('voter-3-id', 'school-a-id', 'Carol Smith', 'GW-003', '11-B', '11th Grade', '08123456791', 'carol@gwh.edu', 'VTLY-9A2B3C4D5E6', '445566', 'INV-10003'),
('voter-4-id', 'school-a-id', 'David Jones', 'GW-004', '11-B', '11th Grade', '08123456792', 'david@gwh.edu', 'VTLY-3X4Y5Z6A7B8', '556677', 'INV-10004'),
('voter-5-id', 'school-a-id', 'Eva Davis', 'GW-005', '10-C', '10th Grade', '08123456793', 'eva@gwh.edu', 'VTLY-1M2N3P4Q5R6', '667788', 'INV-10005');

-- Insert Elections / Events
INSERT INTO events (id, organization_id, name, description, start_date, end_date, voting_mode, auth_method, status)
VALUES 
(
    'event-1-id', 
    'school-a-id', 
    'Student Council Election 2026', 
    'Annual election to choose the student president and vice president of Greenwood High.', 
    CURRENT_TIMESTAMP - INTERVAL '2 days', 
    CURRENT_TIMESTAMP + INTERVAL '5 days', 
    'ONLINE', 
    'QR_ONLY', 
    'PUBLISHED'
),
(
    'event-2-id', 
    'school-a-id', 
    'Prom King & Queen 2026', 
    'Electronic voting booth election during the Prom Night 2026.', 
    CURRENT_TIMESTAMP - INTERVAL '1 hour', 
    CURRENT_TIMESTAMP + INTERVAL '4 hours', 
    'OFFLINE', 
    'QR_ONLY', 
    'PUBLISHED'
);

-- Insert Offline Booth Setting for Event 2
INSERT INTO offline_booth_settings (id, event_id, enable_booth_mode, enable_kiosk_mode, fullscreen, auto_logout, auto_return, idle_timeout, session_timeout, camera_scan)
VALUES ('booth-setting-event-2-id', 'event-2-id', TRUE, TRUE, TRUE, TRUE, TRUE, 30, 120, TRUE);

-- Insert Candidates for Event 1 (Student Council Election)
INSERT INTO candidates (id, event_id, number, name, vision, mission, social_media)
VALUES 
(
    'cand-1-id', 
    'event-1-id', 
    1, 
    'Jane Doe', 
    'Empowered Student Body & Inclusivity', 
    'Create interactive clubs, host monthly open-mic nights, and establish feedback loops.', 
    '{"instagram": "@greenwood_inst"}'
),
(
    'cand-2-id', 
    'event-1-id', 
    2, 
    'John Smith', 
    'Innovative & Tech-Driven Campus', 
    'Upgrade computer lab stations, introduce free campus Wi-Fi expansion, and start esports.', 
    '{"instagram": "@greenwood_inst"}'
),
(
    'cand-3-id', 
    'event-1-id', 
    3, 
    'Alice Cooper', 
    'Green Campus & Healthy Lifestyle', 
    'Build an organic greenhouse, organize cycle-to-school weeks, and upgrade cafeteria.', 
    '{"instagram": "@greenwood_inst"}'
);

-- Insert Candidates for Event 2 (Prom King & Queen)
INSERT INTO candidates (id, event_id, number, name, vision, mission, social_media)
VALUES 
(
    'cand-4-id', 
    'event-2-id', 
    1, 
    'Robert Downey', 
    'Bring Hollywood glamour to Prom', 
    'Design a glamorous red-carpet entry and curate premium food and beverage bars.', 
    '{"instagram": "@prom_royal"}'
),
(
    'cand-5-id', 
    'event-2-id', 
    2, 
    'Scarlett Johansson', 
    'An unforgettable, elegant prom night', 
    'Install a 360-degree slow-motion photo booth and extend voting access hours.', 
    '{"instagram": "@prom_royal"}'
);

-- =============================================================================
-- End of SQL Export File
-- =============================================================================
