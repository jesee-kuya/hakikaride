package handler

import "net/http"

func ParentHandler(w http.ResponseWriter, r *http.Request) {
	var data Data
	if r.Method == http.MethodGet {
		data.Title = "parent"
		Tmpl.ExecuteTemplate(w, "base.html", data)
		return
	}
}
