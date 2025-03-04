package route

import (
	"net/http"

	handler "github.com/jesee-kuya/hakikaride/backend/handlers"
	"github.com/jesee-kuya/hakikaride/backend/middleware"
)

func InitRoutes() *http.ServeMux {
	r := http.NewServeMux()

	fs := http.FileServer(http.Dir("./frontend"))
	r.Handle("/frontend/", http.StripPrefix("/frontend/", fs))

	r.HandleFunc("/", handler.IndexHandler)
	r.HandleFunc("/auth", handler.AuthHandler)
	r.HandleFunc("/parent", middleware.Authenticate(handler.ParentHandler))
	r.HandleFunc("/school", middleware.Authenticate(handler.SchoolHandler))
	r.HandleFunc("/boarding", middleware.Authenticate(handler.BoardingHandler))
	return r
}
