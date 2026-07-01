// 1. ABRIR EL SOBRE
function abrirPantalla() {
    const pantalla = document.getElementById('pantalla-sobre');
    const musica = document.getElementById('cancion-boda');

    pantalla.classList.add('abierto');
    setTimeout(() => {
        pantalla.classList.add('oculto');
        document.body.classList.add('invitacion-abierta');
    }, 1200);

    if (musica) {
        musica.play()
            .then(() => actualizarBotonMusica(true))
            .catch(() => actualizarBotonMusica(false));
    }
}

// 2. MAGIA DE LA ANIMACIÓN AL BAJAR (FADE-IN)
// Creamos un "observador" que vigila cuándo un elemento entra en la pantalla
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Si el elemento se asoma en la pantalla, le agrega la clase 'active' para que aparezca
        if(entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 }); 

// Le decimos al observador que vigile todos los elementos que tienen la clase "reveal"
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 3. FORMULARIO DE CONFIRMACIÓN DE ASISTENCIA
const formAsistencia = document.getElementById('form-asistencia');
const mensajeConfirmacion = document.getElementById('mensaje-confirmacion');
const boletoGenerado = document.getElementById('boleto-generado');
const botonDescargarBoleto = document.getElementById('btn-descargar-boleto');
const previewPlantilla = document.getElementById('preview-plantilla');
const botonMenu = document.querySelector('.menu-toggle');
const botonMusica = document.getElementById('btn-musica');
const cancionBoda = document.getElementById('cancion-boda');
const inputBoletosAsistencia = document.getElementById('boletos-asistencia');
const grupoBoletos = document.getElementById('grupo-boletos');
const limiteBoletos = document.getElementById('limite-boletos');
const URL_SCRIPT = (window.GOOGLE_SHEETS_WEBAPP_URL || 'AQUI_PEGA_TU_URL_DE_APPS_SCRIPT').trim();

let boletoActual = null;
let boletoCanvasActual = null;
let maxBoletosInvitacion = null;

function llenarOpcionesBoletos(maximo) {
    if (!inputBoletosAsistencia) return;

    inputBoletosAsistencia.innerHTML = '<option value="">Selecciona una opción</option>';

    for (let boleto = 1; boleto <= maximo; boleto += 1) {
        const opcion = document.createElement('option');
        opcion.value = String(boleto);
        opcion.textContent = `${boleto} boleto${boleto === 1 ? '' : 's'}`;
        inputBoletosAsistencia.appendChild(opcion);
    }
}

function actualizarBotonMusica(reproduciendo) {
    if (!botonMusica) return;

    botonMusica.classList.toggle('musica-pausada', !reproduciendo);
    botonMusica.setAttribute('aria-pressed', reproduciendo ? 'true' : 'false');
}

if (botonMenu) {
    botonMenu.addEventListener('click', () => {
        const menuVisible = document.body.classList.toggle('menu-visible');
        botonMenu.setAttribute('aria-expanded', menuVisible ? 'true' : 'false');
    });
}

if (botonMusica && cancionBoda) {
    botonMusica.addEventListener('click', () => {
        if (cancionBoda.paused) {
            cancionBoda.play()
                .then(() => actualizarBotonMusica(true))
                .catch(() => actualizarBotonMusica(false));
        } else {
            cancionBoda.pause();
            actualizarBotonMusica(false);
        }
    });
}

function mostrarMensaje(texto, tipo) {
    if (!mensajeConfirmacion) return;

    mensajeConfirmacion.textContent = texto;
    mensajeConfirmacion.className = `mensaje-confirmacion ${tipo}`;
}

function configurarInvitacionDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    const pases = Number.parseInt(params.get('p'), 10);
    const maximoPermitido = Number.isInteger(pases) && pases > 0 ? pases : 10;

    llenarOpcionesBoletos(maximoPermitido);

    if (Number.isInteger(pases) && pases > 0 && inputBoletosAsistencia) {
        maxBoletosInvitacion = pases;

        if (pases === 1) {
            inputBoletosAsistencia.value = '1';
            if (grupoBoletos) {
                grupoBoletos.classList.add('d-none');
            }
        } else if (limiteBoletos) {
            limiteBoletos.textContent = `Puedes confirmar hasta ${pases} boletos.`;
        }
    }
}

configurarInvitacionDesdeUrl();

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function mostrarBoleto(datos) {
    if (!boletoGenerado) return;

    boletoActual = datos;
    boletoCanvasActual = await generarCanvasBoleto(datos);

    if (previewPlantilla) {
        previewPlantilla.src = boletoCanvasActual.toDataURL('image/png');
    }

    boletoGenerado.classList.remove('d-none');
    boletoGenerado.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cargarPlantillaBoleto() {
    return new Promise((resolve) => {
        const imagen = new Image();
        imagen.onload = () => resolve(imagen);
        imagen.onerror = () => resolve(null);
        imagen.src = 'img/Boleto.png';
    });
}

function ajustarTexto(ctx, texto, anchoMaximo, tamanoInicial, tamanoMinimo, familia, peso = '400') {
    let tamano = tamanoInicial;

    do {
        ctx.font = `${peso} ${tamano}px ${familia}`;
        if (ctx.measureText(texto).width <= anchoMaximo) break;
        tamano -= 2;
    } while (tamano >= tamanoMinimo);
}

async function generarCanvasBoleto(datos) {
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    const plantilla = await cargarPlantillaBoleto();
    const canvas = document.createElement('canvas');
    const ancho = plantilla ? plantilla.naturalWidth || 1000 : 1000;
    const alto = plantilla ? plantilla.naturalHeight || 600 : 600;
    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext('2d');

    if (plantilla) {
        ctx.drawImage(plantilla, 0, 0, ancho, alto);
    } else {
        const gradiente = ctx.createLinearGradient(0, 0, ancho, alto);
        gradiente.addColorStop(0, '#fffdf8');
        gradiente.addColorStop(1, '#f3e5c4');
        ctx.fillStyle = gradiente;
        ctx.fillRect(0, 0, ancho, alto);
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ancho * 0.08, alto * 0.27, ancho * 0.48, alto * 0.49);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2C422E';
    ajustarTexto(ctx, datos.nombre, ancho * 0.30, 34, 22, '"Playfair Display", serif', '600');
    ctx.fillText(datos.nombre, ancho * 0.305, alto * 0.305);

    ctx.fillStyle = '#111111';
    ctx.font = '400 26px "Poppins", sans-serif';
    ctx.fillText('ESTAS INVITADO A LA BODA DE', ancho * 0.305, alto * 0.40);

    ctx.strokeStyle = '#E8B31D';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ancho * 0.112, alto * 0.49);
    ctx.lineTo(ancho * 0.269, alto * 0.49);
    ctx.moveTo(ancho * 0.342, alto * 0.49);
    ctx.lineTo(ancho * 0.499, alto * 0.49);
    ctx.moveTo(ancho * 0.112, alto * 0.575);
    ctx.lineTo(ancho * 0.499, alto * 0.575);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = '400 48px "Playfair Display", serif';
    ctx.fillText('SISSI', ancho * 0.19, alto * 0.535);
    ctx.font = '400 38px "Playfair Display", serif';
    ctx.fillText('L. ANTONIO', ancho * 0.415, alto * 0.535);
    ctx.font = 'italic 34px "Playfair Display", serif';
    ctx.fillText('Y', ancho * 0.305, alto * 0.545);

    ctx.font = '400 28px "Poppins", sans-serif';
    ctx.fillText('17 de Octubre,', ancho * 0.305, alto * 0.63);
    ctx.fillText('2026', ancho * 0.305, alto * 0.685);
    ctx.font = '400 23px "Poppins", sans-serif';
    ctx.fillText('Salon El Bohio, Toluca', ancho * 0.305, alto * 0.735);

    const centroX = ancho * 0.82;

    ctx.fillStyle = '#2C422E';
    ctx.font = '500 24px "Playfair Display", serif';
    if (datos.boletos === '1') {
        ctx.fillText('Boleto', centroX, alto * 0.615);
        ctx.font = '500 32px "Playfair Display", serif';
        ctx.fillText('individual', centroX, alto * 0.68);
    } else {
        ctx.fillText('Boleto para', centroX, alto * 0.615);
        ctx.font = '500 32px "Playfair Display", serif';
        ctx.fillText(`${datos.boletos} invitados`, centroX, alto * 0.68);
    }

    return canvas;
}

async function descargarBoletoPng() {
    if (!boletoActual) return;

    const canvas = boletoCanvasActual || await generarCanvasBoleto(boletoActual);
    const enlace = document.createElement('a');
    enlace.download = `boleto-${boletoActual.nombre.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    enlace.href = canvas.toDataURL('image/png');
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

if (botonDescargarBoleto) {
    botonDescargarBoleto.addEventListener('click', descargarBoletoPng);
}

if (formAsistencia && mensajeConfirmacion) {
    formAsistencia.addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre-asistente').value.trim();
        const respuesta = document.getElementById('respuesta-asistencia').value;
        const boletos = document.getElementById('boletos-asistencia').value.trim();

        if (!nombre || !respuesta || !boletos) {
            mostrarMensaje('Por favor completa tu nombre, respuesta y número de boletos.', 'error');
            return;
        }

        if (maxBoletosInvitacion && Number(boletos) > maxBoletosInvitacion) {
            mostrarMensaje(`Esta invitación permite confirmar máximo ${maxBoletosInvitacion} boleto${maxBoletosInvitacion === 1 ? '' : 's'}.`, 'error');
            return;
        }

        const datos = {
            nombre,
            respuesta,
            boletos,
            maxBoletos: maxBoletosInvitacion || '',
            fecha: new Date().toLocaleString('es-MX')
        };

        if (URL_SCRIPT && URL_SCRIPT !== 'AQUI_PEGA_TU_URL_DE_APPS_SCRIPT') {
            fetch(URL_SCRIPT, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(datos)
            }).catch(() => {});
        }

        formAsistencia.reset();
        mostrarBoleto(datos);
        mostrarMensaje(`Gracias, ${nombre}. Tu confirmación fue registrada y ya puedes descargar tu boleto.`, 'exito');
    });
}

// 4. GALERIA
const fotosGaleria = [
    'img/optimized/foto-6.jpg',
    'img/optimized/foto-15.jpg',
    'img/optimized/foto-31.jpg',
    'img/optimized/foto-60.jpg',
    'img/optimized/foto-72.jpg',
    'img/optimized/foto-73.jpg',
    'img/optimized/foto-86.jpg',
    'img/optimized/foto-91.jpg',
    'img/optimized/foto-108.jpg',
    'img/optimized/foto-112.jpg'
];

const fotoGaleriaIzq = document.querySelector('.galeria-foto-izq');
const fotoGaleriaCentro = document.querySelector('.galeria-foto-centro');
const fotoGaleriaDer = document.querySelector('.galeria-foto-der');
const botonGaleriaPrev = document.querySelector('.galeria-prev');
const botonGaleriaNext = document.querySelector('.galeria-next');
const puntosGaleria = document.querySelector('.galeria-puntos');
let indiceGaleria = 1;

function indiceCircular(indice) {
    return (indice + fotosGaleria.length) % fotosGaleria.length;
}

function renderGaleria() {
    if (!fotoGaleriaIzq || !fotoGaleriaCentro || !fotoGaleriaDer || !puntosGaleria) return;

    const indiceIzq = indiceCircular(indiceGaleria - 1);
    const indiceDer = indiceCircular(indiceGaleria + 1);

    fotoGaleriaIzq.src = fotosGaleria[indiceIzq];
    fotoGaleriaCentro.src = fotosGaleria[indiceGaleria];
    fotoGaleriaDer.src = fotosGaleria[indiceDer];

    puntosGaleria.innerHTML = fotosGaleria
        .map((_, indice) => `<button type="button" class="${indice === indiceGaleria ? 'activo' : ''}" aria-label="Ver foto ${indice + 1}"></button>`)
        .join('');

    puntosGaleria.querySelectorAll('button').forEach((boton, indice) => {
        boton.addEventListener('click', () => {
            indiceGaleria = indice;
            renderGaleria();
        });
    });
}

if (botonGaleriaPrev && botonGaleriaNext) {
    botonGaleriaPrev.addEventListener('click', () => {
        indiceGaleria = indiceCircular(indiceGaleria - 1);
        renderGaleria();
    });

    botonGaleriaNext.addEventListener('click', () => {
        indiceGaleria = indiceCircular(indiceGaleria + 1);
        renderGaleria();
    });

    renderGaleria();
}

// 5. BOTON DE CALENDARIO
const botonCalendario = document.getElementById('btn-calendario');

if (botonCalendario) {
    const fechaInicio = new Date(2026, 9, 17, 15, 30, 0);
    const fechaFin = new Date(2026, 9, 17, 20, 30, 0);
    const formatoFecha = (fecha) => fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Sissi%20y%20Luis%20Antonio&dates=${formatoFecha(fechaInicio)}/${formatoFecha(fechaFin)}&details=Celebraci%C3%B3n%20de%20boda%20Sissi%20y%20Luis%20Antonio&location=Sal%C3%B3n%20El%20Boh%C3%ADo%2C%20Toluca`;

    botonCalendario.href = googleUrl;
}

// 6. CONTADOR REGRESIVO (17 de Octubre de 2026, 15:30)
const fechaBoda = new Date(2026, 9, 17, 15, 30, 0).getTime();

const intervalo = setInterval(function() {
    const ahora = new Date().getTime(); 
    const distancia = fechaBoda - ahora; 

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    // Inyectamos un diseño de cuadritos premium para los números
    // Inyectamos el nuevo diseño circular minimalista
    // Inyectamos la nueva estructura tipográfica vintage
    const relojHtml = `
        <div class="bloque-tiempo-vintage">
            <span class="numero-tiempo-vintage">${dias}</span>
            <span class="etiqueta-tiempo-vintage">días</span>
        </div>
        <div class="divisor-vintage">|</div>
        <div class="bloque-tiempo-vintage">
            <span class="numero-tiempo-vintage">${horas}</span>
            <span class="etiqueta-tiempo-vintage">horas</span>
        </div>
        <div class="divisor-vintage">|</div>
        <div class="bloque-tiempo-vintage">
            <span class="numero-tiempo-vintage">${minutos}</span>
            <span class="etiqueta-tiempo-vintage">minutos</span>
        </div>
        <div class="divisor-vintage">|</div>
        <div class="bloque-tiempo-vintage">
            <span class="numero-tiempo-vintage">${segundos}</span>
            <span class="etiqueta-tiempo-vintage">segundos</span>
        </div>
    `;

    document.getElementById("reloj").innerHTML = relojHtml;

    if (distancia < 0) {
        clearInterval(intervalo);
        document.getElementById("reloj").innerHTML = "<h3 class='txt-principal'>¡El gran día ha llegado!</h3>";
    }
}, 1000);
