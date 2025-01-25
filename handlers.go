package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"text/template"
)

var Temp, Err = template.ParseGlob("template/*.html")

type Details struct {
	Title string
	Data  any
}

// ErrorModel defines the structure for error data to pass to the template
type ErrorModel struct {
	Title      string
	ErrMsg     string
	StatusCode int
}

type Route struct {
	School      string
	RouteName   string
	NumberPlate string
	Route       string
	Driver      string
	Status      string
}

type Student struct {
	School      string
	RouteName   string
	IndexNumber string
	Grade       string
	Name        string
	PickUp      string
}

type Parent struct {
	RouteName   string
	StudentName string
	Grade       string
	School      string
	PickUp      string
	IndexNumber string
}

type Boarding struct {
	School    string
	BusDetail Route
	Students  []Student
}

type School struct {
	Name        string
	SBoarding   []Boarding
	AllStudents []Student
	AllRoutes   []Route
	AllParents  []Parent
}

func handleAuth(w http.ResponseWriter, r *http.Request) {
	var Data Details
	if r.Method == http.MethodGet {
		Data.Title = "auth"
		Temp.ExecuteTemplate(w, "base.html", Data)
		return
	}
	if r.Method != http.MethodPost {
		HandleError(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Get form action (login or signup) and user type (school or parent)
	action := r.FormValue("action")     // "login" or "signup"
	userType := r.FormValue("userType") // "school" or "parent"

	if action == "" || userType == "" {
		HandleError(w, "Missing form action or user type", http.StatusBadRequest)
		return
	}

	switch action {
	case "login":
		handleLogin(w, r, userType)
	case "signup":
		handleSignup(w, r, userType)
	default:
		HandleError(w, "Invalid action", http.StatusBadRequest)
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request, userType string) {
	db, err := sql.Open("sqlite", "./transport.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()
	userModel := &UserModel{DB: db}
	var email, password string

	if userType == "school" {
		email = r.FormValue("schoolEmail")
		password = r.FormValue("schoolPassword")
	} else if userType == "parent" {
		email = r.FormValue("parentEmail")
		password = r.FormValue("parentPassword")
	} else {
		HandleError(w, "Invalid user type", http.StatusBadRequest)
		return
	}
	exist, err := userModel.CheckCredentials(email, password, userType)
	if err != nil {
		HandleError(w, "Error checking creddentials", http.StatusInternalServerError)
		return
	}
	if exist {
		if userType == "school" {
			http.Redirect(w, r, "/schooldashboard", http.StatusSeeOther)
			return
		} else {
			http.Redirect(w, r, "/parentsdashboard", http.StatusSeeOther)
			return
		}
	} else {
		HandleError(w, "Wrong username or password", http.StatusBadRequest)
		return
	}
}

func handleSignup(w http.ResponseWriter, r *http.Request, userType string) {
	db, err := sql.Open("sqlite", "./transport.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()
	userModel := &UserModel{DB: db}

	if userType == "school" {
		schoolName := r.FormValue("schoolName")
		email := r.FormValue("signupSchoolEmail")
		password := r.FormValue("signupSchoolPassword")
		confirmPassword := r.FormValue("signupSchoolConfirmPassword")

		if password != confirmPassword {
			HandleError(w, "Passwords do not match", http.StatusBadRequest)
			return
		}
		success, err := userModel.InsertSchool(schoolName, email, password)
		if err != nil {
			fmt.Println(err)
			return
		}
		if success {
			http.Redirect(w, r, "/schooldashboard", http.StatusSeeOther)
			return
		}

		log.Printf("Signup Attempt: SchoolName=%s, Email=%s, Password=%s", schoolName, email, password)
		// fmt.Fprintf(w, "School Signup Successful for %s", schoolName)
	} else if userType == "parent" {
		fullName := r.FormValue("parentFullName")
		email := r.FormValue("parentSignupEmail")
		school := r.FormValue("parentSchool")
		childAdmissionNumber := r.FormValue("childAdmissionNumber")
		password := r.FormValue("signupParentPassword")
		confirmPassword := r.FormValue("signupParentConfirmPassword")

		if password != confirmPassword {
			http.Error(w, "Passwords do not match", http.StatusBadRequest)
			return
		}
		success, err := userModel.InsertParent(fullName, email, school, childAdmissionNumber, password)
		if err != nil {
			HandleError(w, "error inserting entry", http.StatusInternalServerError)
		}
		if success {
			http.Redirect(w, r, "/parentsdashboard", http.StatusSeeOther)
			return
		}

		log.Printf("Signup Attempt: FullName=%s, Email=%s, School=%s, ChildAdmission=%s", fullName, email, school, childAdmissionNumber)
		// fmt.Fprintf(w, "Parent Signup Successful for %s", fullName)
	} else {
		HandleError(w, "Invalid user type", http.StatusBadRequest)
		return
	}
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	var home Details
	home.Title = "home"
	Temp.ExecuteTemplate(w, "base.html", home)
}

func handleDashboardParents(w http.ResponseWriter, r *http.Request) {
	var pDash Details
	var parent Parent
	pDash.Title = "parent"
	parent.School = "Hekima"
	pDash.Data = parent
	Temp.ExecuteTemplate(w, "base.html", pDash)
}

func handleDashboardSchool(w http.ResponseWriter, r *http.Request) {
	var sDash Details
	var school School
	sDash.Title = "school"
	school.Name = "Hekima"
	sDash.Data = school
	Temp.ExecuteTemplate(w, "base.html", sDash)
}

func handleBoarding(w http.ResponseWriter, r *http.Request) {
	var boarding Boarding
	var details Details
	boarding.School = "Hekima"
	details.Title = "boarding"
	details.Data = boarding
	Temp.ExecuteTemplate(w, "base.html", details)
}

// HandleError is a utility to handle errors and render a dynamic error page
func HandleError(w http.ResponseWriter, errMsg string, statusCode int) {
	// Set response headers
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(statusCode)

	// Create the error model with details
	errorData := ErrorModel{
		ErrMsg:     errMsg,
		StatusCode: statusCode,
	}

	var details Details
	details.Title = "error"
	details.Data = errorData

	// Execute the template and write it to the response
	if err := Temp.ExecuteTemplate(w, "base.html", details); err != nil {
		log.Printf("Error executing template: %v\n", err)
		http.Error(w, "500 Internal Server Error", http.StatusInternalServerError)
	}
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if Err != nil {
		HandleError(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if r.URL.Path == "/" || r.URL.Path == "/home" {
		if r.Method == "GET" {
			handleHome(w, r)
			return
		} else {
			HandleError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	} else if r.URL.Path == "/auth" {
		if r.Method == "GET" {
			handleAuth(w, r)
			return
		} else {
			HandleError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	} else if r.URL.Path == "/schooldashboard" {
		if r.Method == "GET" {
			handleDashboardSchool(w, r)
		}
	} else if r.URL.Path == "/parentsdashboard" {
		if r.Method == "GET" {
			handleDashboardParents(w, r)
		}
	} else if r.URL.Path == "/boarding" {
		if r.Method == "GET" {
			handleBoarding(w, r)
		}
	}
}
