let map;
let vehicleMarkers = []; // Array para almacenar los marcadores de los vehículos
const vehicleSpeed = 500; // Velocidad del vehículo en milisegundos por paso
let directionsService;
let directionsRenderer = []; // Para cada vehículo
let pedestrianMarker; // Marcador para el peatón
const vehicleIcons = [
    "assets/icon-vehiculo1.png",
    "assets/icon-vehiculo2.png",
    "assets/icon-vehiculo3.png",
    "assets/icon-vehiculo4.png",
    "assets/icon-vehiculo5.png",
];

// Definir rutas para los vehículos, ajustadas a calles principales
const vehicleRoutes = [
    [ // Ruta para el Vehículo 1: 
        { lat: -15.8351, lng: -70.0236 }, 
        { lat: -15.8365, lng: -70.0200 }, 
        { lat: -15.8434, lng: -70.0222 }, 
        { lat: -15.8450, lng: -70.0210 }, 
        { lat: -15.8351, lng: -70.0236 }, 
    ],
    [ // Ruta para el Vehículo 2: 
        { lat: -15.8348, lng: -70.0167 }, 
        { lat: -15.8365, lng: -70.0173 }, 
        { lat: -15.8415, lng: -70.0203 }, 
        { lat: -15.8433, lng: -70.0214 }, 
        { lat: -15.8348, lng: -70.0167 }, 
    ],
    [ // Ruta para el Vehículo 3:
        { lat: -15.8480, lng: -70.0225 },
        { lat: -15.8465, lng: -70.0240 },
        { lat: -15.8400, lng: -70.0275 },
        { lat: -15.8480, lng: -70.0225 },
    ],
    [ // Ruta para el Vehículo 4:
        { lat: -15.8390, lng: -70.0250 },
        { lat: -15.8408, lng: -70.0240 },
        { lat: -15.8435, lng: -70.0205 },
        { lat: -15.8390, lng: -70.0250 },
    ],
    [ // Ruta para el Vehículo 5:
        { lat: -15.8385, lng: -70.0270 },
        { lat: -15.8370, lng: -70.0260 },
        { lat: -15.8340, lng: -70.0240 },
        { lat: -15.8385, lng: -70.0270 },
    ],
];

// Límites de Puno para generar coordenadas aleatorias
const punoBounds = {
    north: -15.8300,
    south: -15.8500,
    east: -70.0100,
    west: -70.0300,
};

// Función para inicializar el mapa
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -15.8404, lng: -70.0214 }, // Coordenadas de Puno
        zoom: 13,
        disableDefaultUI: true,
    });

    directionsService = new google.maps.DirectionsService();

    // Crear marcadores de vehículos en posiciones iniciales
    for (let i = 0; i < vehicleRoutes.length; i++) {
        addVehicleMarker(i); // Agregar un marcador de vehículo
    }

    // Añadir la capa de tráfico
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    // Agregar peatón aleatorio
    addRandomPedestrian();
}

// Función para agregar un marcador de vehículo
function addVehicleMarker(index) {
    const marker = new google.maps.Marker({
        position: vehicleRoutes[index][0],
        map: map,
        title: `Vehículo ${index + 1}`,
        icon: {
            url: vehicleIcons[index],
            scaledSize: new google.maps.Size(30, 30),
        },
    });
    vehicleMarkers.push(marker); // Agregar el marcador al array
    directionsRenderer[index] = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        preserveViewport: true,
    });

    // Iniciar el movimiento del vehículo
    moveVehicle(marker, index, 0); // Comenzar el movimiento del vehículo
}

// Función para agregar un peatón aleatorio en el mapa
function addRandomPedestrian() {
    const randomLat = Math.random() * (punoBounds.north - punoBounds.south) + punoBounds.south;
    const randomLng = Math.random() * (punoBounds.east - punoBounds.west) + punoBounds.west;

    pedestrianMarker = new google.maps.Marker({
        position: { lat: randomLat, lng: randomLng },
        map: map,
        title: "Peatón",
        icon: {
            url: "assets/icon-peaton.png",
            scaledSize: new google.maps.Size(25, 25),
        },
    });

    // Dirigir el vehículo más cercano al peatón
    const closestVehicle = findClosestVehicle(pedestrianMarker.getPosition());
    if (closestVehicle !== null) {
        moveVehicleToPedestrian(closestVehicle);
    }
}

// Función para encontrar el vehículo más cercano al peatón
function findClosestVehicle(pedestrianPosition) {
    let closestVehicle = null;
    let closestDistance = Infinity;

    vehicleMarkers.forEach((vehicle, index) => {
        const vehiclePosition = vehicle.getPosition();
        const distance = google.maps.geometry.spherical.computeDistanceBetween(vehiclePosition, pedestrianPosition);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestVehicle = { vehicle, index };
        }
    });

    return closestVehicle;
}

// Función para mover el vehículo más cercano al peatón
function moveVehicleToPedestrian({ vehicle, index }) {
    const pedestrianPosition = pedestrianMarker.getPosition();

    const request = {
        origin: vehicle.getPosition(),
        destination: pedestrianPosition,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer[index].setDirections(result);

            const routePath = result.routes[0].overview_path;
            let currentStep = 0;

            function moveStep() {
                if (currentStep < routePath.length) {
                    vehicle.setPosition(routePath[currentStep]);
                    currentStep++;
                    setTimeout(moveStep, vehicleSpeed);
                }
            }

            moveStep(); // Comenzar el movimiento hacia el peatón
        }
    });
}

// Función para mover el vehículo a lo largo de su ruta cíclica
function moveVehicle(vehicle, index, step) {
    const route = vehicleRoutes[index];

    const request = {
        origin: route[step],
        destination: route[(step + 1) % route.length],
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer[index].setDirections(result);
            const routePath = result.routes[0].overview_path;
            let currentStep = 0;

            function moveStep() {
                if (currentStep < routePath.length) {
                    vehicle.setPosition(routePath[currentStep]);
                    currentStep++;
                    setTimeout(moveStep, vehicleSpeed);
                } else {
                    moveVehicle(vehicle, index, (step + 1) % route.length); // Mover al siguiente segmento
                }
            }

            moveStep();
        }
    });
}

// Función para calcular la heurística (distancia estimada)
function heuristic(a, b) {
    return google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(a.lat, a.lng),
        new google.maps.LatLng(b.lat, b.lng)
    );
}

// Nodo para el algoritmo A*
class Node {
    constructor(position, parent = null) {
        this.position = position;
        this.parent = parent;
        this.g = 0; // Costo desde el inicio
        this.h = 0; // Heurística
        this.f = 0; // Costo total
    }
}
// Función para encontrar el camino usando el algoritmo A*
function aStar(start, goal) {
    const openList = [];
    const closedList = [];
    const startNode = new Node(start);
    const goalNode = new Node(goal);
    openList.push(startNode);

    while (openList.length > 0) {
        let lowestIndex = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].f < openList[lowestIndex].f) {
                lowestIndex = i;
            }
        }

        const currentNode = openList[lowestIndex];

        // Si hemos llegado al objetivo, construimos el camino
        if (currentNode.position.lat === goalNode.position.lat && currentNode.position.lng === goalNode.position.lng) {
            return constructPath(currentNode);
        }

        openList.splice(lowestIndex, 1);
        closedList.push(currentNode);

        // Obtener los vecinos
        const neighbors = getNeighbors(currentNode.position);

        for (const neighbor of neighbors) {
            const neighborNode = new Node(neighbor, currentNode);
            if (closedList.find(node => node.position.lat === neighborNode.position.lat && node.position.lng === neighborNode.position.lng)) {
                continue; // Este vecino ya fue evaluado
            }

            const gCost = currentNode.g + heuristic(currentNode.position, neighborNode.position);
            let gScoreIsBest = false;

            if (!openList.find(node => node.position.lat === neighborNode.position.lat && node.position.lng === neighborNode.position.lng)) {
                gScoreIsBest = true;
                neighborNode.g = gCost;
                openList.push(neighborNode);
            } else if (gCost < neighborNode.g) {
                gScoreIsBest = true;
                neighborNode.g = gCost;
            }

            if (gScoreIsBest) {
                neighborNode.h = heuristic(neighborNode.position, goalNode.position);
                neighborNode.f = neighborNode.g + neighborNode.h;
            }
        }
    }

    return []; // No hay camino
}

// Función para construir el camino
function constructPath(node) {
    const path = [];
    let currentNode = node;
    while (currentNode) {
        path.push(currentNode.position);
        currentNode = currentNode.parent;
    }
    return path.reverse(); // Regresar el camino desde el inicio hasta el objetivo
}

// Función para obtener los vecinos del nodo actual
function getNeighbors(position) {
    const neighbors = [];
    const latOffset = 0.001; // Ajustar el tamaño del movimiento
    const lngOffset = 0.001;

    neighbors.push({ lat: position.lat + latOffset, lng: position.lng }); // Arriba
    neighbors.push({ lat: position.lat - latOffset, lng: position.lng }); // Abajo
    neighbors.push({ lat: position.lat, lng: position.lng + lngOffset }); // Derecha
    neighbors.push({ lat: position.lat, lng: position.lng - lngOffset }); // Izquierda

    // Filtrar vecinos fuera de los límites de Puno
    return neighbors.filter(neighbor => {
        return (
            neighbor.lat >= punoBounds.south &&
            neighbor.lat <= punoBounds.north &&
            neighbor.lng >= punoBounds.west &&
            neighbor.lng <= punoBounds.east
        );
    });
}

// Inicializar el mapa al cargar la ventana
window.onload = initMap;
