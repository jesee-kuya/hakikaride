package handler

import (
	"fmt"
	"html/template"
	"net/http"
)

type Data struct {
	Title string
	Info  any
}

var Temp, Err = template.ParseGlob("template/*.html")

func HandleHome(w http.ResponseWriter, r *http.Request) {
	if Err != nil {
		fmt.Println(Err)
		return
	}
	var data Data
	if r.Method != http.MethodGet {
		http.Error(w, "Method not Allowed", http.StatusMethodNotAllowed)
	}
	data.Title = "home"
	Temp.ExecuteTemplate(w, "base.html", data)
}
