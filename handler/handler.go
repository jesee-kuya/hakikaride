package handler

import (
	"fmt"
	"html/template"
	"net/http"
)

type Data struct {
	Title string
	Info  any
}

var Temp, Err = template.ParseGlob("template/*.html")

func HandleHome(w http.ResponseWriter, r *http.Request) {
	if Err != nil {
		fmt.Println(Err)
		return
	}
	var data Data
	if r.Method != http.MethodGet {
		http.Error(w, "Method not Allowed", http.StatusMethodNotAllowed)
		return
	}
	data.Title = "home"
	Temp.ExecuteTemplate(w, "base.html", data)
}

func HandleAuth(w http.ResponseWriter, r *http.Request) {
	var data Data
	if r.Method != http.MethodGet {
		http.Error(w, "Method not Allowed", http.StatusMethodNotAllowed)
		return
	} else {
		data.Title = "auth"
		Temp.ExecuteTemplate(w, "base.html", data)
	}
	// 	// Get form action (login or signup) and user type (school or parent)
	// 	action := r.FormValue("action")     // "login" or "signup"
	// 	userType := r.FormValue("userType") // "school" or "parent"

	// 	if action == "" || userType == "" {
	// 		HandleError(w, "Missing form action or user type", http.StatusBadRequest)
	// 		return
	// 	}

	//		switch action {
	//		case "login":
	//			handleLogin(w, r, userType)
	//		case "signup":
	//			handleSignup(w, r, userType)
	//		default:
	//			HandleError(w, "Invalid action", http.StatusBadRequest)
	//		}
}
