package handler

import "net/http"

func ParentHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/parent" {
		ErrorHandler(w, "Page Not Found", http.StatusNotFound)
		return
	}

	var data Data
	data.Title = "parent"

	err := Tmpl.ExecuteTemplate(w, "base.html", data)
	if err != nil {
		ErrorHandler(w, "Unexpected Error Occured. Try again later", http.StatusInternalServerError)
		return
	}
}
