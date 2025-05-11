package broker

import (
    "encoding/json"
    "github.com/gorilla/websocket"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "bufio"
    "topicTide/communication_protocol"
)

func HandleConsumer(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("WebSocket Upgrade Error:", err)
        return
    }
    defer conn.Close()

    for {
        _, msgData, err := conn.ReadMessage()
        if err != nil {
            log.Println("Read Error:", err)
            break
        }

        var msg communication_protocol.Message
        if err := json.Unmarshal(msgData, &msg); err != nil {
            log.Println("Unmarshal Error:", err)
            continue
        }

        topicFile := filepath.Join("topicFiles", sanitizeFilename(msg.Topic)+".txt")
        file, err := os.Open(topicFile)
        if err != nil {
            log.Println("Error opening topic file:", err)
            continue
        }
        defer file.Close()

        scanner := bufio.NewScanner(file)
        for scanner.Scan() {
            conn.WriteMessage(websocket.TextMessage, []byte(scanner.Text()))
        }

        if err := scanner.Err(); err != nil {
            log.Println("Scanner error:", err)
        }
    }
}
