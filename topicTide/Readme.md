🔍 Detailed Purpose of Each Folder and File
1. broker/
Handles the core backend logic (written in Go):

a. broker.go: Handles socket connections, routing messages.

b. topic_manager.go: Manages writing messages to topic files.

c. file_lock.go: Implements file locking to avoid race conditions.

d. utils/logger.go: Optional logging helper for debugging.

2. producer_frontend/
Light HTML/JS interface for message producers:

a. index.html: Simple form UI for submitting topic & message.

b. script.js: Handles form submission and sends data to the Broker via sockets/WebSocket.

c. styles.css: Basic styling for layout.

3. consumer_frontend/
HTML/JS interface for message consumers:

a. index.html: UI for selecting a topic and offset (start/latest).

b.  script.js: Connects to the broker and displays messages in real time or by offset.

c. styles.css: Page styling.

4. communication_protocol/
message.go: Shared Go struct for standardizing messages exchanged between components. Useful if Producer, Consumer, or test clients are CLI-based and written in Go.

5. test/
Go test files:

a. test_producer.go: Simulates a producer client sending messages.

b. test_consumer.go: Simulates a consumer fetching messages by offset.

6. Root Files
a. README.md: Describe how the system works and how to run it.

b. go.mod: Go module file for managing dependencies.

c. main.go: Entry point of the broker application. Listens for connections.



<<ESTABLISHING BROKER AND PRODUCER CONNECTION>>

1. Broker is running on port 8080.
2. Producers connect via WebSocket.

In main.go:

1. Listen request of producer and forward it to broker.go

In broker.go: 

1. Handle Producer request like unmarshall json content from producer, sanitize topic name to create a file name, sending acknowledgement of message received, etc.

In topic_manager.go:

1. Handle upcoming request from broker.go and transmit it to file_lock.go 

In file_lock.go:

1. Encrypt the content and apply lock to avoid critical conditions and then only write to a file

<<ESTABLISHING BROKER AND CONSUMER CONNECTION>>

1. Broker is running on port 8080.
2. Consumers connect via HTTP.

In main.go:

1. Listen request of Consumer and forward it to broker.go.

In broker.go: 

1. Handle consumer HTTP request, fetch the requested message, decrypt it and return decrypted message. 
2. Send list of topics to consumer front-end to handle subscriptions.

In file_lock.go:

1. Decrypt the requested encrypted content.
