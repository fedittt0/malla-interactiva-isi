// Variable global para almacenar todas las materias cargadas y su estado
let allMaterias = [];

async function cargarMaterias() {
  const res = await fetch('/api/materias');
  allMaterias = await res.json(); // Almacenar todas las materias

  const mallaContainer = document.getElementById('malla-container'); // Obtener el nuevo contenedor
  if (!mallaContainer) {
    console.error("El elemento con ID 'malla-container' no fue encontrado.");
    return; // Salir si el contenedor no existe
  }
  mallaContainer.innerHTML = ''; // Limpiar antes de renderizar

  // Ordenar materias por año y luego por cuatrimestre
  allMaterias.sort((a, b) => {
    const anoOrder = {
      "PRIMER AÑO": 1, "SEGUNDO AÑO": 2, "TERCER AÑO": 3,
      "CUARTO AÑO": 4, "QUINTO AÑO": 5
    };
    const cuatrimestreOrder = {
      "PRIMER CUATRIMESTRE": 1, "SEGUNDO CUATRIMESTRE": 2, "ANUAL": 3
    };

    if (anoOrder[a.año] !== anoOrder[b.año]) {
      return anoOrder[a.año] - anoOrder[b.año];
    }
    return cuatrimestreOrder[a.cuatrimestre] - cuatrimestreOrder[b.cuatrimestre];
  });

  renderMalla(); // Llamar a la función que renderiza la malla
}

function renderMalla() {
  const mallaContainer = document.getElementById('malla-container');
  if (!mallaContainer) return; // Doble chequeo por seguridad
  mallaContainer.innerHTML = ''; // Limpiar antes de renderizar

  // Agrupar materias por año y cuatrimestre
  const materiasAgrupadas = allMaterias.reduce((acc, materia) => {
    if (!acc[materia.año]) {
      acc[materia.año] = {};
    }
    if (!acc[materia.año][materia.cuatrimestre]) {
      acc[materia.año][materia.cuatrimestre] = [];
    }
    acc[materia.año][materia.cuatrimestre].push(materia);
    return acc;
  }, {});

  // Iterar sobre los años ordenados
  const anosOrdenados = Object.keys(materiasAgrupadas).sort((a, b) => {
    const anoOrder = {
      "PRIMER AÑO": 1, "SEGUNDO AÑO": 2, "TERCER AÑO": 3,
      "CUARTO AÑO": 4, "QUINTO AÑO": 5
    };
    return anoOrder[a] - anoOrder[b];
  });

  anosOrdenados.forEach(ano => {
    const anoSection = document.createElement('div');
    anoSection.classList.add('ano-section');
    anoSection.innerHTML = `<h2>${ano}</h2>`;
    mallaContainer.appendChild(anoSection);

    // Iterar sobre los cuatrimestres ordenados dentro de cada año
    const cuatrimestresOrdenados = Object.keys(materiasAgrupadas[ano]).sort((a, b) => {
      const cuatrimestreOrder = {
        "PRIMER CUATRIMESTRE": 1, "SEGUNDO CUATRIMESTRE": 2, "ANUAL": 3
      };
      return cuatrimestreOrder[a] - cuatrimestreOrder[b];
    });

    cuatrimestresOrdenados.forEach(cuatrimestre => {
      const cuatrimestreSection = document.createElement('div');
      cuatrimestreSection.classList.add('cuatrimestre-section');
      cuatrimestreSection.innerHTML = `<h3>${cuatrimestre}</h3>`;
      anoSection.appendChild(cuatrimestreSection);

      const materiasGrid = document.createElement('div');
      materiasGrid.classList.add('materias-grid');
      cuatrimestreSection.appendChild(materiasGrid);

      materiasAgrupadas[ano][cuatrimestre].forEach(materia => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.id = materia.id;
        card.textContent = materia.nombre;

        // Aplicar clases de estado (cursada, aprobada, bloqueada)
        if (materia.aprobada) {
          card.classList.add('aprobada');
        } else if (materia.cursada) {
          card.classList.add('cursada');
        }

        // Determinar si la materia está bloqueada
        const isBlocked = !canAccessMateria(materia);
        if (isBlocked) {
          card.classList.add('bloqueada');
          card.title = 'Para cursar esta materia, necesitas aprobar sus correlativas.';
        } else {
          card.title = 'Haz clic para cambiar estado';
        }

        card.addEventListener('click', () => toggleMateriaState(materia.id));
        materiasGrid.appendChild(card);
      });
    });
  });
}

function canAccessMateria(materia) {
  // Si la materia no tiene correlativas de cursado, siempre se puede cursar.
  if (!materia.correlativas_cursado || materia.correlativas_cursado.length === 0) {
    return true;
  }

  // Verifica si todas las correlativas de cursado están aprobadas.
  return materia.correlativas_cursado.every(correlativaNombre => {
    const corrMateria = allMaterias.find(m => m.nombre === correlativaNombre);
    return corrMateria && corrMateria.aprobada;
  });
}


async function toggleMateriaState(id) {
  const materiaIndex = allMaterias.findIndex(m => m.id === id);
  if (materiaIndex === -1) return;

  const currentMateria = allMaterias[materiaIndex];
  let nuevoEstado = { ...currentMateria }; // Copia para no modificar el original directamente

  // Lógica de transición de estados: Bloqueada -> Cursada -> Aprobada -> Nada (si se puede desaprobar)
  // Estado actual: Nada (ni cursada ni aprobada)
  if (!currentMateria.cursada && !currentMateria.aprobada) {
    // Si la materia está bloqueada (no puede cursarse), no permitir el cambio.
    if (!canAccessMateria(currentMateria)) {
      alert('Para cursar esta materia, primero debes aprobar sus correlativas.');
      return;
    }
    nuevoEstado.cursada = true; // Pasa a Cursada
  }
  // Estado actual: Cursada
  else if (currentMateria.cursada && !currentMateria.aprobada) {
    // Para pasar de Cursada a Aprobada, verifica correlativas de final
    if (currentMateria.correlativas_final && currentMateria.correlativas_final.length > 0) {
      const puedeAprobar = currentMateria.correlativas_final.every(correlativaNombre => {
        const corrMateria = allMaterias.find(mm => mm.nombre === correlativaNombre);
        return corrMateria && corrMateria.aprobada;
      });

      if (!puedeAprobar) {
        alert('Para aprobar esta materia, necesitas tener aprobadas todas sus correlativas de FINAL.');
        return; // No permite aprobar si no cumple las correlativas de final
      }
    }
    nuevoEstado.cursada = true; // Mantener cursada
    nuevoEstado.aprobada = true; // Pasar a aprobada
  }
  // Estado actual: Aprobada
  else if (currentMateria.aprobada) {
    // Antes de desaprobar, verifica si esta materia es correlativa de cursado de alguna materia *APROBADA*
    const isCorrelativaDeAprobada = allMaterias.some(m =>
        m.aprobada && m.correlativas_cursado && m.correlativas_cursado.includes(nuevoEstado.nombre)
    );

    if (isCorrelativaDeAprobada) {
        alert('No puedes desaprobar esta materia porque es correlativa de una materia que ya tienes aprobada.');
        return;
    }

    nuevoEstado.cursada = false;
    nuevoEstado.aprobada = false;
  }

  // Actualiza la materia en la lista global
  allMaterias[materiaIndex] = nuevoEstado;

  // Llama a la API para guardar el estado en la base de datos
  await fetch('/api/materias/' + nuevoEstado.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cursada: nuevoEstado.cursada, aprobada: nuevoEstado.aprobada })
  });

  renderMalla(); // Vuelve a renderizar la malla con los estados actualizados
}

// Cargar materias al iniciar la aplicación
cargarMaterias();