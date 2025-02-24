package handler

import "net/http"

func AuthHandler(w http.ResponseWriter, r *http.Request) {
	var data Data
	if r.Method == http.MethodGet {
		data.Title = "auth"
		Tmpl.ExecuteTemplate(w, "base.html", data)
		return
	}
}
