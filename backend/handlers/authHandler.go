package handler

import "net/http"

func AuthHandler(w http.ResponseWriter, r *http.Request) {
	var data Data
	if r.Method == http.MethodGet {
		data.Title = "auth"
		err := Tmpl.ExecuteTemplate(w, "base.html", data)
		if err != nil {
			ErrorHandler(w, "Unexpected Error Occured. Try again later", http.StatusInternalServerError)
			return
		}
	} else if r.Method == http.MethodPost {
		if r.FormValue("action") == "signup" {
			SignupHandler(w, r)
		} else if r.FormValue("action") == "login" {
			LoginHandler(w, r)
		} else {
			ErrorHandler(w, "Bad Request", http.StatusBadRequest)
		}
	} else {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}
