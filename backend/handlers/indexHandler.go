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
	if r.URL.Path != "/" {
		ErrorHandler(w, "Page Not Found", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	var data Data
	data.Title = "home"
	err := Tmpl.ExecuteTemplate(w, "base.html", data)
	if err != nil {
		ErrorHandler(w, "Unexpected Error Occured. Try again later", http.StatusInternalServerError)
		return
	}
}
