-- Users table for authentication
CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    Email TEXT NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL,
    UserType TEXT NOT NULL CHECK(UserType IN ('admin', 'parent', 'driver')),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastLogin DATETIME,
    IsActive BOOLEAN DEFAULT 1
);

-- Parent's table with enhanced contact information
CREATE TABLE IF NOT EXISTS Parents (
    ParentID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    PhoneNumber TEXT NOT NULL,
    Address TEXT,
    IsActive BOOLEAN DEFAULT 1,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Students table
CREATE TABLE IF NOT EXISTS Students (
    StudentID INTEGER PRIMARY KEY AUTOINCREMENT,
    ParentID INTEGER NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    Grade TEXT NOT NULL,
    AdmNumber TEXT NOT NULL UNIQUE,
    PickupPoint TEXT NOT NULL,
    DropoffPoint TEXT NOT NULL,
    EmergencyContact TEXT,
    IsActive BOOLEAN DEFAULT 1,
    FOREIGN KEY (ParentID) REFERENCES Parents(ParentID)
);

-- Drivers table
CREATE TABLE IF NOT EXISTS Drivers (
    DriverID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL,
    PhoneNumber TEXT NOT NULL,
    IsActive BOOLEAN DEFAULT 1,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Routes table
CREATE TABLE IF NOT EXISTS Routes (
    RouteID INTEGER PRIMARY KEY AUTOINCREMENT,
    RouteName TEXT NOT NULL,
    Description TEXT,
    IsActive BOOLEAN DEFAULT 1
);

-- Buses table
CREATE TABLE IF NOT EXISTS Buses (
    BusID INTEGER PRIMARY KEY AUTOINCREMENT,
    NumberPlate TEXT NOT NULL UNIQUE,
    RouteID INTEGER NOT NULL,
    DriverID INTEGER NOT NULL,
    IsActive BOOLEAN DEFAULT 1,
    FOREIGN KEY (RouteID) REFERENCES Routes(RouteID),
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID)
);

-- Trips table
CREATE TABLE IF NOT EXISTS Trips (
    TripID INTEGER PRIMARY KEY AUTOINCREMENT,
    DriverID INTEGER NOT NULL,
    BusID INTEGER NOT NULL,
    RouteID INTEGER NOT NULL,
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID),
    FOREIGN KEY (BusID) REFERENCES Buses(BusID),
    FOREIGN KEY (RouteID) REFERENCES Routes(RouteID)
);

-- LocationUpdates table
CREATE TABLE IF NOT EXISTS LocationUpdates (
    LocationID INTEGER PRIMARY KEY AUTOINCREMENT,
    TripID INTEGER NOT NULL,
    Latitude REAL NOT NULL,
    Longitude REAL NOT NULL,
    Speed REAL COMMENT 'Speed in km/h',
    FOREIGN KEY (TripID) REFERENCES Trips(TripID)
);

-- Create necessary indexes
CREATE INDEX idx_users_email ON Users(Email);
CREATE INDEX idx_users_username ON Users(Username);
CREATE INDEX idx_students_admission ON Students(AdmNumber);
