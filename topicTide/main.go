package main

import (
	"fmt"
	"log"
	"net/http"
	"topicTide/broker"
)

func main() {
	http.HandleFunc("/producer", broker.HandleProducer)
	http.HandleFunc("/consumer", broker.HandleConsumer)
	http.HandleFunc("/topics", broker.ListTopics)
	fmt.Println("Broker running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
