package handler

import (
	"net/http"
	"strconv"
)

type Message struct {
	StatusCode string
	ErrMsg     string
}

func ErrorHandler(w http.ResponseWriter, errval string, statusCode int) {
	code := strconv.Itoa(statusCode)
	var data Data

	info := Message{
		StatusCode: code,
		ErrMsg:     errval,
	}

	data.Title = "error"
	data.Details = info

	Tmpl.ExecuteTemplate(w, "base.html", data)
}
