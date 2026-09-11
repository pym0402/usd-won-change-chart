const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 정적 파일 서빙
app.use(express.static('public'));

// CSV 파일 읽기 및 파싱
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const data = [];
  
  // 헤더 스킵
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const rate = parseFloat(parts[1].trim());
      
      // 결측치(0값) 필터링
      if (!isNaN(rate) && rate > 0) {
        data.push({
          date: date,
          rate: rate
        });
      }
    }
  }
  
  return data;
}

// API 엔드포인트: 환율 데이터
app.get('/api/exchange-rates', (req, res) => {
  const csvPath = path.join(__dirname, 'docs', 'usd2won.csv');
  
  fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
      console.error('CSV 파일 읽기 오류:', err);
      res.status(500).json({ error: 'CSV 파일을 읽을 수 없습니다.' });
      return;
    }
    
    const parsedData = parseCSV(data);
    res.json(parsedData);
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
