package handler

import (
	"net/http"
	"text/template"
)

type Data struct {
	Title   string
	Details any
}

var Tmpl, Err = template.ParseGlob("frontend/template/*.html")

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	var data Data
	data.Title = "home"
	Tmpl.ExecuteTemplate(w, "index.html", data)
}
