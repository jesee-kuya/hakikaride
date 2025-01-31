package handler

type Boarding struct {
	Title string
	Data  any
}

type Details struct {
	School    string
	BusDetail any
	Students  []Student
}

type Student struct {
	Name        string
	Grade       string
	School      string
	ID          int
	Route       BuuDetail
	PickUpPoint string
}

type BuuDetail struct {
	RouteName string
	ID        string
	Number    string
	Driver    string
}

type Error struct {
	StatusCode int
	ErrMsg     string
}

type Parent struct {
	ParentInitial string
	ParentName    string
	ParentEmail   string
}

type School struct {
	Name          string
	Email         string
	TotalBuses    int
	ActiveRoutes  []BuuDetail
	TotalStudents []Student
}
