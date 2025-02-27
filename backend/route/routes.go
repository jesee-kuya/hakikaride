package route

import (
	"net/http"

	handler "github.com/jesee-kuya/hakikaride/backend/handlers"
)

func InitRoutes() *http.ServeMux {
	r := http.NewServeMux()

	fs := http.FileServer(http.Dir("./frontend"))
	r.Handle("/frontend/", http.StripPrefix("/frontend/", fs))

	r.HandleFunc("/", handler.IndexHandler)
	r.HandleFunc("/auth", handler.AuthHandler)
	r.HandleFunc("/parent", handler.ParentHandler)
	r.HandleFunc("/school", handler.SchoolHandler)
	r.HandleFunc("/boarding", handler.BoardingHandler)
	return r
}
