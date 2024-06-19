document.addEventListener('DOMContentLoaded', async function () {
    console.log("DOM fully loaded and parsed");

    if (typeof faceapi !== 'undefined') {
        console.log('face-api.min.js successfully loaded');
    } else {
        console.error('face-api.min.js failed to load');
    }

    const video = document.getElementById("video");
    const signupButton = document.getElementById("signup");
    const ws = new WebSocket('wss://givernance.p-e.kr:8443/');

    ws.onopen = function () {
        console.log('WebSocket connection established');
    };

    ws.onmessage = function (event) {
        console.log('Message from server: ' + event.data);
        let receivedMessages = JSON.parse(localStorage.getItem('receivedMessages')) || [];
        receivedMessages.push(event.data);
        localStorage.setItem('receivedMessages', JSON.stringify(receivedMessages));
        updateReceivedMessages();
    };

    signupButton.addEventListener('click', function() {
        console.log("Capture & Send button clicked");
        captureAndSend();
    });

    // 카메라 초기화
    await initializeCamera();

    // 모델 로드 및 얼굴 인식 초기화
    loadModels().then(initializeFaceDetection).catch(error => console.error("Error loading models:", error));

    async function initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                console.log("Camera initialized and video is playing");
            };
        } catch (error) {
            console.error("Webcam access error:", error);
            alert("Camera access is required to sign up. Please enable camera permissions.");
        }
    }

    async function loadModels() {
        console.log("Loading models...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log("Models loaded successfully");
    }

    function initializeFaceDetection() {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        canvas.style.position = 'absolute';
        canvas.style.top = video.offsetTop + 'px';
        canvas.style.left = video.offsetLeft + 'px';
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const FRAME_BUFFER_SIZE = 10;
        let frameBuffer = [];

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (detections.length > 0) {
                console.log("Face detected");
                const faceDescriptor = detections[0].descriptor;
                frameBuffer.push(faceDescriptor);

                if (frameBuffer.length > FRAME_BUFFER_SIZE) {
                    frameBuffer.shift();
                }

                const averagedDescriptor = averageDescriptors(frameBuffer);
                const stringForQR = calculateAndStoreAverageAsString(averagedDescriptor);
                console.log("String for QR:", stringForQR);

                localStorage.setItem("savedDescriptor", JSON.stringify(averagedDescriptor));
                window.saveddDescriptor = stringForQR;
            } else {
                console.log("No face detected");
            }
        }, 5000);
    }

    function averageDescriptors(descriptors) {
        const descriptorSize = descriptors[0].length;
        const averagedDescriptor = new Float32Array(descriptorSize).fill(0);
        descriptors.forEach((descriptor) => {
            for (let i = 0; i < descriptorSize; i++) {
                averagedDescriptor[i] += descriptor[i];
            }
        });
        for (let i = 0; i < descriptorSize; i++) {
            averagedDescriptor[i] /= descriptors.length;
        }
        return averagedDescriptor;
    }

    function captureAndSend() {
        const savedDescriptor = localStorage.getItem("savedDescriptor");
        if (savedDescriptor) {
            console.log('Sending saved descriptor:', savedDescriptor);
            ws.send(savedDescriptor);
            updateReceivedMessages();
        } else {
            console.log('No descriptor to send');
        }
    }

    function updateReceivedMessages() {
        const receivedMessages = JSON.parse(localStorage.getItem('receivedMessages')) || [];
        const receivedMessagesDiv = document.getElementById('receivedMessages');
        receivedMessagesDiv.innerHTML = '';
        receivedMessages.forEach((msg, index) => {
            const messageElement = document.createElement('div');
            messageElement.textContent = `${index + 1}: ${msg}`;
            receivedMessagesDiv.appendChild(messageElement);
        });
    }

    window.addEventListener('storage', function (e) {
        if (e.key === 'savedDescriptor') {
            console.log('New savedDescriptor received:', e.newValue);
            ws.send(e.newValue);
        }
    });
});

function calculateAndStoreAverageAsString(averagedDescriptor) {
    let sum = 0;
    const length = averagedDescriptor.length;
    averagedDescriptor.forEach(value => {
        sum += value;
    });
    const average = (sum / length);
    return Math.abs(average);
}
