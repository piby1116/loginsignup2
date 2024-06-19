const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();

app.use(cors());

// 인증서 파일 경로 설정
const keyPath = path.resolve(__dirname, 'certs/privkey.pem');
const certPath = path.resolve(__dirname, 'certs/fullchain.pem');

// 인증서 파일 읽기
let key, cert;
try {
    console.log(`인증서 파일 경로: ${keyPath}, ${certPath}`);
    key = fs.readFileSync(keyPath);
    cert = fs.readFileSync(certPath);
    console.log('SSL 인증서 파일을 성공적으로 읽었습니다.');
} catch (error) {
    console.error('SSL 인증서 파일을 읽는 중 오류가 발생했습니다:', error);
    process.exit(1); // 오류 발생 시 프로세스를 종료합니다.
}

// HTTPS 서버 설정
const options = {
    key: key,
    cert: cert,
};

const server = https.createServer(options, app);

// 정적 파일 제공을 위해 public 폴더 설정
app.use(express.static(path.join(__dirname, 'public')));

// 모델 파일 제공을 위해 models 폴더 설정
app.use('/models', express.static(path.join(__dirname, 'models')));

// 기본 경로에 대한 핸들러 추가
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('클라이언트 연결됨');

    ws.on('message', (message) => {
        const messageStr = message.toString('utf8');
        console.log('받은 메시지:', messageStr);
        ws.send(`서버에서 받은 메시지: ${messageStr}`);
    });

    ws.on('close', () => {
        console.log('클라이언트 연결 종료됨');
    });

    ws.onerror = function (error) {
        console.error('WebSocket error observed:', error);
    };
});

// 필요한 다른 라우트 추가
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signUp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signUp.html'));
});

app.get('/signUpMobile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signUpMobile.html'));
});

server.listen(8443, () => {
    console.log('Server running at https://localhost:8443/');
    console.log('Server also accessible at https://givernance.p-e.kr:8443/');
});
