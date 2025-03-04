CREATE TABLE IF NOT EXISTS tblUsers (
    id INTEGER  PRIMARY KEY,
    user_name VARCHAR(40) NOT NULL,
    eser_email VARCHAR(50) NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    user_type VARCHAR(6) NOT NULL CHECK('parent', 'driver', 'admin'),
    user_password VARCHAR(100) NOT NULL
);

CREATE IF NOT EXISTS tblStudents (
    id INTEGER PRIMARY KEY,
    admin_no VARCHAR(10) NOT NULL,
    student_name VARCHAR(40) NOT NULL,
    student_parent INTEGER NOT NULL,
    student_location INTEGER NOT NULL,

    FOREIGN KEY student_parent REFERENCES tblUsers (id) 
    FOREIGN KEY student_location REFERENCES tblLocations (id) 
);

CREATE IF NOT EXISTS tblRoutes (
    id INTEGER PRIMARY KEY,
    route_name VARCHAR(10) NOT NULL,
    start_point VARCHAR(10) NOT NULL,
    end_point VARCHAR(10) NOT NULL
);

CREATE IF NOT EXISTS tblLocations (
    id INTEGER PRIMARY KEY,
    location_name VARCHAR(20) NOT NULL,
    route_id INTEGER,

    FOREIGN KEY route_id REFERENCES tblRoutes (id)
);

CREATE IF NOT EXISTS tblBuses (
    id INTEGER PRIMARY KEY,
    number_plate VARCHAR(20) NOT NULL
);

CREATE IF NOT EXISTS tblRides (
    id INTEGER PRIMARY KEY,
    ride_date DATE  NOT NULL,
    route_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    ride_status BOOLEAN DEFAULT FALSE,
    ride_session VARCHAR(100) NOT NULL,
    bus_id INTEGER NOT NULL,

    FOREIGN KEY route_id REFERENCES tblRoutes (id)
    FOREIGN KEY driver_id REFERENCES tblUsers (id)
    FOREIGN KEY admin_id REFERENCES tblUsers (id)
    FOREIGN KEY bus_id REFERENCES tblBuses (id)
)

CREATE TABLE IF NOT EXISTS tblSessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES tblUsers (id)
);