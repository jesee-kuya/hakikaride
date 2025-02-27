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
	}
}
