package main

import (
	"log"
	"net/http"
	"time"

	"github.com/jesee-kuya/hakikaride/backend/route"
	"github.com/jesee-kuya/hakikaride/backend/util"
)

func main() {
	go util.Init()
	defer util.DB.Close()

	port, err := util.ValidatePort()
	if err != nil {
		log.Fatalf("Error validating port: %v", err)
		return
	}
	router := route.InitRoutes()

	server := &http.Server{
		Addr:         port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Server started at http://localhost%s\n", port)
	if err = server.ListenAndServe(); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
