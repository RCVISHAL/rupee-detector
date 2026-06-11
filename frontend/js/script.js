const videoElement = document.getElementById('videoElement');
const openCameraBtn = document.getElementById('openCameraBtn');
const captureBtn = document.getElementById('captureBtn');

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const imagePreview = document.getElementById('imagePreview');

const detectCurrencyBtn = document.getElementById('detectCurrencyBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const predictionResult = document.getElementById('predictionResult');
const currencyValue = document.getElementById('currencyValue');
const confidenceScore = document.getElementById('confidenceScore');

let currentStream = null;
let selectedImageFile = null;

// Camera setup
openCameraBtn.addEventListener('click', async () => {
    if (currentStream) {
        stopMediaTracks(currentStream);
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoElement.srcObject = stream;
        currentStream = stream;
        captureBtn.disabled = false;
        openCameraBtn.textContent = 'Restart Camera';
    } catch (err) {
        console.error("Error accessing the camera: ", err);
        alert("Camera access denied or unavailable.");
    }
});

function stopMediaTracks(stream) {
    stream.getTracks().forEach(track => track.stop());
}

captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
        selectedImageFile = new File([blob], "captured_image.png", { type: "image/png" });
        imagePreview.src = URL.createObjectURL(selectedImageFile);
        imagePreview.style.display = 'block';
        detectCurrencyBtn.disabled = false;
        
        // Visual feedback
        captureBtn.textContent = 'Captured!';
        setTimeout(() => captureBtn.textContent = 'Capture Image', 2000);
    }, 'image/png');
});

// Upload setup
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

uploadArea.addEventListener('click', (e) => {
    if (e.target.tagName !== 'IMG') {
        fileInput.click();
    }
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            selectedImageFile = file;
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
            detectCurrencyBtn.disabled = false;
        } else {
            alert("Please select an image file.");
        }
    }
}

// Teachable Machine Model Setup
let model;
async function initModel() {
    const modelURL = "../model/model.json";
    const metadataURL = "../model/metadata.json";
    try {
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Model loaded successfully");
    } catch (e) {
        console.error("Failed to load model. Ensure model files exist in the '../model' directory.", e);
    }
}
window.addEventListener('load', initModel);

// Prediction Logic
detectCurrencyBtn.addEventListener('click', async () => {
    if (!selectedImageFile) return;
    if (!model) {
        alert("Model is still loading or failed to load. Please make sure the model files exist.");
        return;
    }

    predictionResult.style.display = 'none';
    loadingSpinner.style.display = 'block';
    detectCurrencyBtn.disabled = true;

    try {
        await predictCurrency();
    } catch (error) {
        console.error("Prediction Error:", error);
        alert("An error occurred during prediction.");
    } finally {
        loadingSpinner.style.display = 'none';
        detectCurrencyBtn.disabled = false;
    }
});

async function predictCurrency() {
    // Simulate a brief loading time for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Teachable Machine can predict directly from the image preview element
    const predictions = await model.predict(imagePreview);
    
    // Find the highest probability
    let highestPrediction = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
        if (predictions[i].probability > highestPrediction.probability) {
            highestPrediction = predictions[i];
        }
    }

    // Animate result presentation
    predictionResult.style.display = 'block';
    predictionResult.style.animation = 'fadeIn 0.5s ease';
    
    currencyValue.textContent = `₹${highestPrediction.className}`;
    confidenceScore.textContent = `${(highestPrediction.probability * 100).toFixed(1)}%`;
}
