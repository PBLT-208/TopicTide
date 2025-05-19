package broker

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"topicTide/communication_protocol"

	"github.com/gorilla/websocket"
)

// upgrade http connection to websocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		fmt.Printf("Incoming request Origin: %s\n", r.Header.Get("Origin"))
		return true
	},
}

// sanitizeFilename removes characters not allowed in filenames from topic name
func sanitizeFilename(name string) string {
	fmt.Print(name)
	re := regexp.MustCompile(`[^\w\-.]`)
	return re.ReplaceAllString(name, "_")
}

// handling producer request
func HandleProducer(w http.ResponseWriter, r *http.Request) {
	fmt.Println("handleProducer function called!")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket Upgrade Error:", err)
		return
	}
	defer conn.Close()
	fmt.Println("WebSocket connection established in handleProducer!")

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read Error:", err)
			break
		}

		var msg communication_protocol.Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Println("JSON Unmarshal Error:", err)
			continue
		}

		// Use sanitized topic name as file name
		sanitizedTopic := sanitizeFilename(msg.Topic)

		// Change data type of content
		content := []byte(msg.Content)

		filePath := filepath.Join("topicFiles", sanitizedTopic+".txt")

		// Create the file if it doesn't exist
		file, err := os.OpenFile(filePath, os.O_CREATE, 0644)
		if err != nil {
			log.Println("Error creating file:", err)
			continue
		}
		file.Close()

		// Call message handler with raw message
		if err := HandleMessage(filePath, content); err != nil {
			log.Println("Error in handling message:", err)
			continue
		}

		// Send acknowledgement to user for received message
		ackMsg := fmt.Sprintf("Message received: %s", message)
		err = conn.WriteMessage(messageType, []byte(ackMsg))
		if err != nil {
			log.Println("Write Error (Acknowledgement):", err)
			break
		}
	}
	fmt.Println("Exiting handleProducer for this connection.")
}

func HandleConsumer(w http.ResponseWriter, r *http.Request) {
	// Handle CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Println("Consumer HTTP Request received!")

	// Get topic from query parameter
	topic := r.URL.Query().Get("topic")
	if topic == "" {
		http.Error(w, "Missing topic parameter", http.StatusBadRequest)
		return
	}

	topicFile := filepath.Join("topicFiles", sanitizeFilename(topic)+".txt")
	file, err := os.Open(topicFile)
	if err != nil {
		log.Println("Error opening topic file:", err)
		http.Error(w, "Topic file not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// Read entire file content
	// Prepare plain message array
	var messages []string

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}

		// Decode Base64
		encryptedData, err := base64.StdEncoding.DecodeString(line)
		if err != nil {
			log.Println("Base64 decoding error:", err)
			continue
		}

		// Decrypt
		decrypted, err := DecryptData(encryptedData)
		if err != nil {
			log.Println("Decryption error:", err)
			continue
		}

		messages = append(messages, string(decrypted))
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// ListTopics handles listing all available topic names
func ListTopics(w http.ResponseWriter, r *http.Request) {
	// Handle CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	files, err := os.ReadDir("topicFiles")
	if err != nil {
		http.Error(w, "Failed to read topics", http.StatusInternalServerError)
		return
	}

	var topics []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".txt") {
			topic := strings.TrimSuffix(file.Name(), ".txt")
			topics = append(topics, topic)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(topics)
}

func Broker() {
	http.HandleFunc("/producer", HandleProducer)
	fmt.Println("Broker is running at http://localhost:8080/producer")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
