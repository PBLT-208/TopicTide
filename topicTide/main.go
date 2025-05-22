package main

import (
	"fmt"
	"log"
	"net/http"
	"topicTide/broker"
)

func main() {
	// Serve static files for frontend
	http.Handle("/producer_ui/", http.StripPrefix("/producer_ui/", http.FileServer(http.Dir("./producer_frontend"))))
	http.Handle("/consumer_ui/", http.StripPrefix("/consumer_ui/", http.FileServer(http.Dir("./consumer_frontend"))))

	// API endpoints
	http.HandleFunc("/producer", broker.HandleProducer)
	http.HandleFunc("/consumer", broker.HandleConsumer)
	http.HandleFunc("/topics", broker.ListTopics)

	fmt.Println("Broker running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
