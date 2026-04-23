FROM node:20-alpine

WORKDIR /app

# 1. ติดตั้ง Dependencies (ใช้ --legacy-peer-deps เพราะเรามี React 19 กับ Tremor ที่งอแงกัน)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 2. Copy โค้ดทั้งหมดเข้าเครื่อง
COPY . .

# 3. สร้าง Production Build (ขั้นตอนนี้จะใช้เวลาสักพัก เพราะ Next.js จะ Optimize กราฟและโค้ดให้เล็กลง)
RUN npm run build

# 4. เปลี่ยนโหมดการรันเป็น Production
ENV NODE_ENV=production

# 5. รันด้วย next start แทน next dev
CMD ["npm", "start"]