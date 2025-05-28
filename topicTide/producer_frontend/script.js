let producerSocket = new WebSocket('wss://topictide.onrender.com/producer');

console.log("Attempting to connect to WebSocket..."); 

producerSocket.onopen = () => {
    console.log("Producer-Broker connection opened!");
};

producerSocket.onerror = (error) => {
    console.error("Producer-Broker websocket error: ", error);
};

producerSocket.onclose = (event) => {
    console.log("Producer-Broker connection closed:", event);
};

function createJSON(event) {
    event.preventDefault();
    let topic = document.getElementById("i1").value;
    let content = document.getElementById("i2").value;
    let producerMsg = {
        "Topic": topic,
        "Content": content
    };
    let jsonMessage = JSON.stringify(producerMsg);
    console.log("Sending message:", jsonMessage);
    if (producerSocket.readyState === WebSocket.OPEN) {
        producerSocket.send(jsonMessage);
        producerSocket.onmessage = (event) => {
            console.log("Received data from broker:", event.data); 
            alert("Your message has been received!");
        };
    } else {
        console.error("WebSocket is not open. Current state:", producerSocket.readyState);
    }
}

document.getElementById("f1").addEventListener("submit", (event) => {
    createJSON(event);
});
