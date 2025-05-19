package broker

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
	"log"
	"os"
	"sync"
)

var mutex sync.Mutex

// Define encryptionKey
var key = []byte("2@asdlk7dsjf!AS*") // 16 bytes for AES-128

// AES-128 encryption function
func encryptData(data []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	ciphertext := make([]byte, aes.BlockSize+len(data))
	iv := ciphertext[:aes.BlockSize]

	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], data)

	return ciphertext, nil
}

// AES-128 decryption function
func DecryptData(encryptedData []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	if len(encryptedData) < aes.BlockSize {
		return nil, err
	}

	iv := encryptedData[:aes.BlockSize]
	encryptedData = encryptedData[aes.BlockSize:]

	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(encryptedData, encryptedData)

	return encryptedData, nil
}

// Write encrypted data to file, base64 encoded
func WriteToFile(filePath string, data []byte) error {

	mutex.Lock()
	defer mutex.Unlock()

	encryptedData, err := encryptData(data)
	if err != nil {
		log.Println("Error encrypting data:", err)
		return err
	}

	encoded := base64.StdEncoding.EncodeToString(encryptedData)

	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err := file.WriteString(encoded + "\n"); err != nil {
		return err
	}

	log.Println("Encrypted message written to file successfully.")
	return nil
}
