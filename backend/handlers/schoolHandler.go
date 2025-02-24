package handler

import "net/http"

func SchoolHandler(w http.ResponseWriter, r *http.Request) {
	var data Data
	if r.Method == "GET" {
		data.Title = "school"
		Tmpl.ExecuteTemplate(w, "base.html", data)
		return
	}
}
