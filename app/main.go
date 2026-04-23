package main

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	_ "github.com/lib/pq"
)

// --- 🧠 1. ฟังก์ชันวิเคราะห์เจตนาด้วย AI (Ollama) ---
func analyzeWithAI(command string) string {
	ollamaHost := os.Getenv("OLLAMA_HOST") // เช่น http://ollama:11434

	modelName := os.Getenv("AI_MODEL")
	if modelName == "" {
		modelName = "gemma4:e2b" // Fallback
	}

	if ollamaHost == "" {
		return "AI Engine not configured"
	}

	url := ollamaHost + "/api/generate"
	// แยก System Prompt ออกมาเพื่อกำหนดพฤติกรรมหลัก
	systemPrompt := "คุณคือผู้เชี่ยวชาญด้าน Cybersecurity หน้าที่ของคุณคือวิเคราะห์คำสั่ง SSH และอธิบายจุดประสงค์ของการโจมตีเป็นภาษาไทยสั้นๆ เพียงประโยคเดียว"
	// ออกแบบ Prompt ให้ AI สรุปสั้นๆ
	userPrompt := fmt.Sprintf("วิเคราะห์คำสั่งจากsshที่ได้มา: '%s'", command)

	payload := map[string]interface{}{
		"model":  modelName,
		"system": systemPrompt,
		"prompt": userPrompt,
		"stream": false,
	}

	jsonData, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "AI Analysis Offline"
	}
	defer resp.Body.Close()

	var result struct {
		Response string `json:"response"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return strings.TrimSpace(result.Response)
}

// --- 📱 2. ฟังก์ชันส่งแจ้งเตือนผ่าน Telegram ---
func sendTelegram(message string) {
	token := os.Getenv("TELEGRAM_TOKEN")
	chatID := os.Getenv("TELEGRAM_CHAT_ID")
	if token == "" || chatID == "" {
		return
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload := map[string]string{
		"chat_id":    chatID,
		"text":       "🛰️ *NebulaGuard Alert*\n" + message,
		"parse_mode": "Markdown",
	}

	jsonData, _ := json.Marshal(payload)
	http.Post(url, "application/json", bytes.NewBuffer(jsonData))
}

func main() {
	// 3. เชื่อมต่อ Database
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("เชื่อมต่อ Database ไม่สำเร็จ:", err)
	}
	defer db.Close()

	// 4. เตรียม Schema (Best Practice)
	createTable := `
	CREATE TABLE IF NOT EXISTS intruder_logs (
		id SERIAL PRIMARY KEY,
		ip_address TEXT,
		event_type TEXT,
		details TEXT,
		ai_analysis TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = db.Exec(createTable)
	if err != nil {
		log.Fatal("สร้าง Table ไม่สำเร็จ:", err)
	}

	// 5. เริ่มดึง Log จาก Docker
	cmd := exec.Command("docker", "logs", "-f", "-n", "0", "cowrie")
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()
	multi := io.MultiReader(stdout, stderr)

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("🛰️  NebulaGuard: AI-Powered Engine Engaged...")

	scanner := bufio.NewScanner(multi)
	for scanner.Scan() {
		line := scanner.Text()
		var eventType, details, ipAddr string

		// --- 🔍 Logic: แงะ IP Address ---
		if strings.Contains(line, "[") && strings.Contains(line, "]") {
			start := strings.Index(line, "[") + 1
			end := strings.Index(line, "]")
			content := line[start:end]
			parts := strings.Split(content, ",")
			if len(parts) > 0 {
				ipAddr = strings.TrimSpace(parts[len(parts)-1])
			}
		}

		// --- 🔍 Logic: แยกประเภท Event ---
		if strings.Contains(line, "login attempt") {
			eventType = "LOGIN"
			details = line[strings.Index(line, "login attempt"):]
		} else if strings.Contains(line, "CMD:") {
			parts := strings.Split(line, "CMD: ")
			if len(parts) > 1 {
				eventType = "COMMAND"
				details = parts[1]
			}
		}

		// --- ⚡ ประมวลผลและแจ้งเตือน ---
		if eventType != "" {
			var aiInsight string

			// ถ้าเป็นคำสั่ง ให้ AI ช่วยวิเคราะห์
			if eventType == "COMMAND" {
				fmt.Printf("🧠 AI is analyzing command: %s\n", details)
				aiInsight = analyzeWithAI(details)
				fmt.Printf("🤖 AI Insight: %s\n", aiInsight)
			}

			// บันทึกลง Database
			query := "INSERT INTO intruder_logs (ip_address, event_type, details, ai_analysis) VALUES ($1, $2, $3, $4)"
			_, err = db.Exec(query, ipAddr, eventType, details, aiInsight)
			if err != nil {
				log.Println("DB Save Error:", err)
			}

			// แจ้งเตือน Telegram (ใช้ Goroutine เพื่อความเร็ว)
			go func(ip, etype, dtl, ai string) {
				msg := fmt.Sprintf("*Event:* %s\n*From:* `%s`\n*Action:* `%s`", etype, ip, dtl)
				if ai != "" {
					msg += fmt.Sprintf("\n*AI Insight:* _%s_", ai)
				}

				// ส่งแจ้งเตือนเฉพาะ COMMAND หรือ LOGIN ที่สำเร็จ
				if etype == "COMMAND" || strings.Contains(dtl, "succeeded") {
					sendTelegram(msg)
				}
			}(ipAddr, eventType, details, aiInsight)

			fmt.Printf("🚨 [%s] From %s: %s\n", eventType, ipAddr, details)
		}
	}
}
