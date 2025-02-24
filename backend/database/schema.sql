-- Users table for authentication
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    UserType ENUM('admin', 'parent', 'Driver') NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastLogin DATETIME,
    IsActive BOOLEAN DEFAULT TRUE
);

-- Parent's table with enhanced contact information
CREATE TABLE IF NOT EXISTS Parents (
    ParentID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR (100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    Address TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE IF NOT EXISTS Students (
    StudentID INT AUTO_INCREMENT PRIMARY KEY,
    ParentID INT NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Grade VARCHAR(50) NOT NULL,
    AdmNumber VARCHAR(50) NOT NULL UNIQUE,
    PickupPoint TEXT NOT NULL,
    DropoffPoint TEXT NOT NULL,
    EmergencyContact VARCHAR(15),
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ParentID) REFERENCES Parents(ParentID)
    FOREIGN KEY (TripID) REFERENCES Trips(TripID)
);

CREATE TABLE IF NOT EXISTS Drivers (
    DriverID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE IF NOT EXISTS Routes (
    RouteID INT AUTO_INCREMENT PRIMARY KEY,
    RouteName VARCHAR(255) NOT NULL,
    Description TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
);

CREATE TABLE IF NOT EXISTS Buses (
    BusID INT AUTOINCREMENT PRIMARY KEY,
    NumberPlate VARCHAR(50) NOT NULL UNIQUE,
    RouteID INT NOT NULL,
    IsActive BOOLEAN TRUE,
    FOREIGN KEY (RouteID) REFERENCES Routes(RouteID)
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID)
);

CREATE TABLE IF NOT EXISTS Trips (
    TripID INT AUTO_INCREMENT PRIMARY KEY,
    DriverID INT NOT NULL,
    BusID INT NOT NULL,
    RouteID INT NOT NULL,
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID),
    FOREIGN KEY (BusID) REFERENCES Buses(BusID),
    FOREIGN KEY (RouteID) REFERENCES Routes(RouteID)

);

CREATE TABLE IF NOT EXISTS LocationUpdates (
    LocationID INT AUTO_INCREMENT PRIMARY KEY,
    TripID INT NOT NULL,
    Latitude DECIMAL(10, 8) NOT NULL,
    Longitude DECIMAL(11, 8) NOT NULL,
    Speed DECIMAL(5, 2) COMMENT 'Speed in km/h',
    FOREIGN KEY (TripID) REFERENCES Trips(TripID)
);

-- Create necessary indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(Username);
CREATE INDEX IF NOT EXISTS idx_children_admission ON Children(AdmissionNumber);