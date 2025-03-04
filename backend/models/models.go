package models

import (
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"user_name"`
	Email    string `json:"user_email"`
	Phone    string `json:"phone_no"`
	UserType string `json:"user_type"`
	Password string `json:"user_password"`
}

type Student struct {
	ID              int    `json:"id"`
	AdminNo         string `json:"admin_no"`
	StudentName     string `json:"student_name"`
	StudentParent   int    `json:"student_parent"`
	StudentLocation int    `json:"student_location"`
}

type Route struct {
	ID         int    `json:"id"`
	RouteName  string `json:"route_name"`
	StartPoint string `json:"start_point"`
	EndPoint   string `json:"end_point"`
}

type Location struct {
	ID       int    `json:"id"`
	Location string `json:"location_name"`
	RouteId  int    `json:"route_id"`
}

type Buses struct {
	ID          int    `json:"id"`
	NumberPlate string `json:"number_plate"`
}

type Rides struct {
	ID          int       `json:"id"`
	RideDate    time.Time `json:"ride_date"`
	RouteId     int       `json:"route_id"`
	DriverId    int       `json:"driver_id"`
	AdminId     int       `json:"admin_id"`
	RideStatus  bool      `json:"ride_status"`
	RideSession string    `json:"ride_session"`
	BusId       int       `json:"bus_id"`
}
