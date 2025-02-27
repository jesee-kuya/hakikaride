package handler

import "net/http"

func ParentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	var data Data
	data.Title = "parent"
	Tmpl.ExecuteTemplate(w, "base.html", data)
}
