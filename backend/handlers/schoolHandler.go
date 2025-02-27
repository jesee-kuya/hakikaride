package handler

import "net/http"

func SchoolHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/school" {
		ErrorHandler(w, "Page Not Found", http.StatusNotFound)
		return
	}

	if r.Method != http.MethodGet {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var data Data
	data.Title = "school"
	
	err := Tmpl.ExecuteTemplate(w, "base.html", data)
	if err != nil {
		ErrorHandler(w, "Unexpected Error Occured. Try again later", http.StatusInternalServerError)
		return
	}
}
