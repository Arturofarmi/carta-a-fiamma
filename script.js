// 1. Crear la escena
const scene = new THREE.Scene();

// First create the texture loader (moved from line 104)
const textureLoader = new THREE.TextureLoader();

// Then load the background
textureLoader.load('assets/paisaje.jpg', function(texture) {
    scene.background = texture;
    console.log('Background texture loaded successfully');
}, undefined, function(error) {
    console.error('Error loading background texture:', error);
});

// 2. Crear la cámara centrada
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5); // Centrada en la carta

// 3. Renderizador
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("cartaCanvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 4. Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 5. Crear la base de la carta (rectángulo)
const cartaBaseGeometry = new THREE.BoxGeometry(5, 3, 0.05); // Aumentamos el tamaño
const cartaMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffc0cb,
    metalness: 0.5, // Añade un ligero efecto metálico
    roughness: 0.5, // Hace el reflejo más difuso
    emissive: 0xffc0cb, // Color base para un efecto más cálido
    emissiveIntensity: 0.1 // Intensidad del color base
});
const cartaBase = new THREE.Mesh(cartaBaseGeometry, cartaMaterial);
scene.add(cartaBase);

// 6. Crear la solapa (triángulo plano) con un tamaño proporcional
const solapaGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
    -2.5, 0, 0,   // Esquina izquierda
    2.5, 0, 0,    // Esquina derecha
    0, 2, 0       // Punta superior
]);
solapaGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
solapaGeometry.computeVertexNormals();
const solapaMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffc0cb,
    metalness: 0.5,
    roughness: 0.5,
    side: THREE.DoubleSide,
    emissive: 0xffc0cb,
    emissiveIntensity: 0.1
});
const solapa = new THREE.Mesh(solapaGeometry, solapaMaterial);
solapa.position.set(0, 1.5, 0.025); // Ajustamos la posición de la solapa
solapa.rotation.x = Math.PI; // Inicia cerrada
scene.add(solapa);

// Agregar un borde a la geometría de la solapa
const edges = new THREE.EdgesGeometry(solapaGeometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcc8899, linewidth: 2 });
const solapaBorde = new THREE.LineSegments(edges, lineMaterial);
solapa.add(solapaBorde);

// 7. Crear el sello de cera
const selloGeometry = new THREE.CircleGeometry(0.4, 29);
const selloMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b0000,
    metalness: 0.8, // Un poco más reflectante
    roughness: 0.6,
    emissive: 0x8b0000,
    emissiveIntensity: 0.05
});
const sello = new THREE.Mesh(selloGeometry, selloMaterial);
sello.position.set(-0.023, -0.3, 0.1);
scene.add(sello);

// 7.1 Crear el papel con mensaje (inicialmente invisible)
// Crear una forma con bordes redondeados
const shape = new THREE.Shape();
const width = 4;
const height = 2;
const radius = 0.3;

shape.moveTo(-width/2 + radius, -height/2);
shape.lineTo(width/2 - radius, -height/2);
shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
shape.lineTo(width/2, height/2 - radius);
shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
shape.lineTo(-width/2 + radius, height/2);
shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
shape.lineTo(-width/2, -height/2 + radius);
shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

// Crear la geometría
const papelGeometry = new THREE.ShapeGeometry(shape);

// Cargar la textura
const papelTexture = textureLoader.load('assets/tarjeta.png', 
    function(texture) {
        console.log('Textura cargada exitosamente');
        // Configurar la textura correctamente
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.repeat.set(0.25, 0.5);
        texture.offset.set(0.5, 0.5);
        texture.needsUpdate = true;
        papelMaterial.needsUpdate = true;
    },
    undefined,
    function(error) {
        console.error('Error cargando la textura:', error);
    }
);

// Crear el material
const papelMaterial = new THREE.MeshBasicMaterial({ 
    map: papelTexture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
});

// Crear el mesh
const papel = new THREE.Mesh(papelGeometry, papelMaterial);
papel.position.set(0, 0, 1.1);
scene.add(papel);

// 8. Agrupar la carta y la solapa
const cartaGrupo = new THREE.Group();
cartaGrupo.add(cartaBase);
cartaGrupo.add(solapa);
scene.add(cartaGrupo);

// 9. Animación de apertura con GSAP
let cartaAbierta = false;

function abrirCarta() {
    if (!cartaAbierta) {
        cartaAbierta = true;

        // Animación del sello desapareciendo
        gsap.to(sello.scale, { x: 0, y: 0, duration: 0.2, ease: "power2.inOut", onComplete: () => scene.remove(sello) });

        // Animación de la solapa abriéndose
        gsap.to(solapa.rotation, { x: 0, duration: 1, ease: "power2.inOut" });
        // Animación de la cámara: mueve la cámara hacia arriba y hace un zoom
        gsap.to(camera.position, {
            y: 3,     // Mover la cámara hacia arriba (ajustar el valor a tu gusto)
            z: 3.5,     // Acercar la cámara
            duration: 1, 
            ease: "power2.inOut"
        });

        // Mostrar el papel con mensaje
        gsap.to(papelMaterial, {
            opacity: 1,
            duration: 1,
            delay: 0.5,
            ease: "power2.inOut"
        });

        // Mostrar el texto solo cuando se hace clic
        if (window.textMaterial) {
            gsap.to(window.textMaterial, {
                opacity: 1,
                duration: 1,
                delay: 0.5,
                ease: "power2.inOut"
            });
        }
    }
}

// 10. Detectar clic para abrir la carta
window.addEventListener("click", abrirCarta);

// Agregar movimiento de cámara con el puntero
const mouse = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

// Configurar la sensibilidad del movimiento
const sensitivity = 0.1;

window.addEventListener('mousemove', (event) => {
    // Calcular la posición normalizada del mouse (-1 a 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Crear el sistema de partículas
const particlesCount = 100;
const positions = new Float32Array(particlesCount * 3);
const particles = new THREE.BufferGeometry();

// Crear textura de partícula programáticamente
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');    // Centro dorado
    gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)'); // Dorado medio
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');    // Borde transparente
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Usar esta textura en lugar de cargar un archivo
const particleTexture = createParticleTexture();

// Crear las posiciones aleatorias para las partículas
for (let i = 0; i < particlesCount * 3; i += 3) {
    positions[i] = Math.random() * 20 - 10;     // X entre -10 y 10
    positions[i + 1] = Math.random() * 20 + 10; // Y entre 10 y 30
    positions[i + 2] = Math.random() * 10 - 5;  // Z entre -5 y 5
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Material para las partículas con efecto de brillo
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.5,
    map: particleTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: false,
    color: 0xffd700, // Color dorado
    opacity: 0.1
});

// Crear el sistema de partículas
const particleSystem = new THREE.Points(particles, particlesMaterial);
particleSystem.frustumCulled = false; // Desactivar el frustum culling
scene.add(particleSystem);

function animate() {
    requestAnimationFrame(animate);
    
    // Movimiento existente de la cámara
    camera.position.x = mouse.x * sensitivity * 5;
    camera.position.y = mouse.y * sensitivity * 5;
    
    // Hacer que el sistema de partículas siga parcialmente a la cámara
    particleSystem.position.y = camera.position.y * 0.3;
    
    // Efecto parallax del fondo
    if (scene.background) {
        const offsetX = mouse.x * 0.0015;
        const offsetY = mouse.y * 0.0015;
        scene.background.offset.set(offsetX, offsetY);
    }
    
    // Animar partículas
    const positions = particles.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        // Aumentar la velocidad de caída de 0.01 a 0.03
        positions[i + 1] -= 0.02;
        
        // Si la partícula llega muy abajo, resetear su posición arriba
        if (positions[i + 1] < -10) {
            positions[i + 1] = 20;
            positions[i] = Math.random() * 20 - 10;
            positions[i + 2] = Math.random() * 10 - 5;
        }
    }
    particles.attributes.position.needsUpdate = true;
    
    // Rotar suavemente el sistema de partículas
    particleSystem.rotation.y += 0.0001;
    
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
}
animate();

// 12. Ajuste al cambiar tamaño de ventana
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
