# แก้จาก 1.21 เป็น 1.23
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Stage 2 (ส่วนที่เหลือเหมือนเดิม)
FROM alpine:latest
WORKDIR /root/
RUN apk add --no-cache docker-cli
COPY --from=builder /app/main .
CMD ["./main"]