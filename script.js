let scene, camera, renderer, controls, model, audioListener, backgroundMusic;
const loadingScreen = document.getElementById('loading-screen');
let isDragging = false, previousMousePosition = { x: 0, y: 0 };
let stars;
let starRotationAngle = 0;
// Add these variables for music control
let isMusicPlaying = false;
let musicVolume = 0.5;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const loader = new THREE.GLTFLoader();
    loader.load(
        'asset/model/astro_core.glb',
        function (gltf) {
            model = gltf.scene;
            model.scale.set(5, 5, 5);
            model.position.set(5.6, -0.5, -1.5);
            scene.add(model);
            loadingScreen.style.display = 'none';
        },
        undefined,
        function (error) {
            console.error('An error happened', error);
        }
    );

    setupMusicControls();
    addStars();
    addAudio();
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);

    document.getElementById('view-front').addEventListener('click', () => setModelRotation('front'));
    document.getElementById('view-side').addEventListener('click', () => setModelRotation('side'));
    document.getElementById('view-back').addEventListener('click', () => setModelRotation('back'));

    animate();
}

function setupMusicControls() {
    // Create music control container
    const musicControls = document.createElement('div');
    musicControls.id = 'music-controls';
    musicControls.style.position = 'fixed'; // Fixed position so it stays in place when scrolling
    musicControls.style.bottom = '20px';
    musicControls.style.right = '20px'; // Changed from left to right
    musicControls.style.display = 'none'; // Hide until audio is loaded
    musicControls.style.flexDirection = 'column';
    musicControls.style.gap = '10px';
    musicControls.style.zIndex = '1000'; // Ensure it's above other elements
    
    // Create play/pause button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-music';
    toggleButton.textContent = 'Play Music';
    toggleButton.style.padding = '8px 16px';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = 'white';
    toggleButton.style.border = '1px solid #555';
    toggleButton.addEventListener('click', toggleMusic);
    
    // Create volume controls
    const volumeContainer = document.createElement('div');
    volumeContainer.style.display = 'flex';
    volumeContainer.style.alignItems = 'center';
    volumeContainer.style.justifyContent = 'center'; // Center the volume controls
    volumeContainer.style.gap = '10px';
    
    const volumeDown = document.createElement('button');
    volumeDown.textContent = '-';
    volumeDown.style.padding = '5px 10px';
    volumeDown.style.borderRadius = '4px';
    volumeDown.style.cursor = 'pointer';
    volumeDown.style.backgroundColor = '#333';
    volumeDown.style.color = 'white';
    volumeDown.style.border = '1px solid #555';
    volumeDown.addEventListener('click', () => adjustVolume(-0.1));
    
    const volumeLevel = document.createElement('span');
    volumeLevel.id = 'volume-level';
    volumeLevel.textContent = '50%';
    volumeLevel.style.color = 'white';
    volumeLevel.style.minWidth = '40px';
    volumeLevel.style.textAlign = 'center';
    
    const volumeUp = document.createElement('button');
    volumeUp.textContent = '+';
    volumeUp.style.padding = '5px 10px';
    volumeUp.style.borderRadius = '4px';
    volumeUp.style.cursor = 'pointer';
    volumeUp.style.backgroundColor = '#333';
    volumeUp.style.color = 'white';
    volumeUp.style.border = '1px solid #555';
    volumeUp.addEventListener('click', () => adjustVolume(0.1));
    
    volumeContainer.appendChild(volumeDown);
    volumeContainer.appendChild(volumeLevel);
    volumeContainer.appendChild(volumeUp);
    
    musicControls.appendChild(toggleButton);
    musicControls.appendChild(volumeContainer);
    
    document.body.appendChild(musicControls);
}

function toggleMusic() {
    if (!backgroundMusic || !backgroundMusic.buffer) return;
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        document.getElementById('toggle-music').textContent = "Play Music";
    } else {
        backgroundMusic.play();
        document.getElementById('toggle-music').textContent = "Pause Music";
    }
    isMusicPlaying = !isMusicPlaying;
}

function adjustVolume(amount) {
    if (!backgroundMusic) return;
    
    musicVolume = Math.max(0, Math.min(1, musicVolume + amount));
    backgroundMusic.setVolume(musicVolume);
    document.getElementById('volume-level').textContent = Math.round(musicVolume * 100) + '%';
}

function setModelRotation(view) {
    if (!model) return;

    let targetRotationY;
    switch (view) {
        case 'front':
            targetRotationY = 0;
            break;
        case 'side':
            targetRotationY = Math.PI / 2;
            break;
        case 'back':
            targetRotationY = Math.PI;
            break;
    }

    new TWEEN.Tween(model.rotation)
        .to({ y: targetRotationY }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

function addAudio() {
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    backgroundMusic = new THREE.Audio(audioListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('asset/musik/backsound.mp3', function (buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(musicVolume);
        // Don't auto-play, let the user control it
        // backgroundMusic.play();
        
        // Enable buttons once audio is loaded
        document.getElementById('music-controls').style.display = 'flex';
    });
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function onMouseMove(event) {
    if (!isDragging || !model) return;
    
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    
    model.rotation.y += deltaX * 0.01;
    model.rotation.x += deltaY * 0.01;
    
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function onMouseUp() {
    isDragging = false;
}

function onKeyDown(event) {
    if (!model) return;
    const speed = 0.2;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            model.position.z -= speed;
            break;
        case 'ArrowDown':
        case 's':
            model.position.z += speed;
            break;
        case 'ArrowLeft':
        case 'a':
            model.position.x -= speed;
            break;
        case 'ArrowRight':
        case 'd':
            model.position.x += speed;
            break;
    }
}

function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5 });
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function animateStars() {
    if (stars) {
        stars.position.z += 0.2;
        if (stars.position.z > 100) {
            stars.position.z = -100;
        }
        
        starRotationAngle += 0.002;
        stars.rotation.y = starRotationAngle;
        stars.rotation.x = starRotationAngle / 2;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    animateStars();
    TWEEN.update();
    renderer.render(scene, camera);
}

const tweenScript = document.createElement('script');
tweenScript.src = "https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.min.js";
tweenScript.onload = () => console.log("TWEEN.js loaded");
document.head.appendChild(tweenScript);

window.onload = init;