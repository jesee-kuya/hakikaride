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
	return r
}
