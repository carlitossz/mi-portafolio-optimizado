
const EPSILON = 1e-12;

export const CONFIGURACION_DEFECTO_AG = Object.freeze({
  tamanoPoblacion: 100,
  numeroGeneraciones: 500,
  tamanoTorneo: 3,
  probabilidadCruce: 1,
  probabilidadMutacion: 0.05,
  intensidadMutacion: 0.1,
  cantidadElite: 1,
});

function esNumeroFinito(valor) {
  return typeof valor === 'number' && Number.isFinite(valor);
}

function obtenerNumeroValido(...valores) {
  for (const valor of valores) {
    if (esNumeroFinito(valor)) return valor;
  }
  return null;
}

function copiarCromosoma(cromosoma) {
  return cromosoma.slice();
}

function validarActivos(activos) {
  if (!Array.isArray(activos) || activos.length === 0) {
    throw new Error('El algoritmo genético requiere un arreglo no vacío de activos.');
  }

  for (const activo of activos) {
    if (typeof activo !== 'string' || activo.trim() === '') {
      throw new Error('Cada activo debe ser un símbolo de texto válido.');
    }
  }
}

function validarFuncionEvaluadora(evaluarCartera) {
  if (typeof evaluarCartera !== 'function') {
    throw new Error('Se requiere una función evaluarCartera(pesos, activos).');
  }
}

function prepararConfiguracion(configuracion = {}) {
  const base = {
    ...CONFIGURACION_DEFECTO_AG,
    ...configuracion,
  };

  return {
    tamanoPoblacion: Math.max(100, Math.trunc(base.tamanoPoblacion || 100)),
    numeroGeneraciones: Math.max(500, Math.trunc(base.numeroGeneraciones || 500)),
    tamanoTorneo: Math.max(2, Math.trunc(base.tamanoTorneo || 3)),
    probabilidadCruce: Math.min(1, Math.max(0, Number(base.probabilidadCruce ?? 1))),
    probabilidadMutacion: Math.min(1, Math.max(0, Number(base.probabilidadMutacion ?? 0.05))),
    intensidadMutacion: Math.max(0, Number(base.intensidadMutacion ?? 0.1)),
    cantidadElite: Math.max(0, Math.trunc(base.cantidadElite ?? 1)),
  };
}

function ajustarUltimoPeso(cromosoma) {
  if (cromosoma.length === 1) return [1];

  const ajustado = cromosoma.slice();
  const indiceUltimo = ajustado.length - 1;
  const sumaSinUltimo = ajustado
    .slice(0, indiceUltimo)
    .reduce((suma, peso) => suma + peso, 0);

  ajustado[indiceUltimo] = 1 - sumaSinUltimo;

  if (ajustado[indiceUltimo] < 0) {
    return normalizarCromosoma(ajustado.map((peso) => Math.max(0, peso)));
  }

  return ajustado;
}

export function normalizarCromosoma(pesos) {
  if (!Array.isArray(pesos) || pesos.length === 0) {
    throw new Error('No se puede normalizar un cromosoma vacío.');
  }

  const pesosLimpios = pesos.map((peso) => {
    if (!esNumeroFinito(peso) || peso < 0) return 0;
    return peso;
  });

  const suma = pesosLimpios.reduce((acumulado, peso) => acumulado + peso, 0);

  if (suma <= EPSILON) {
    const pesoEquitativo = 1 / pesos.length;
    return ajustarUltimoPeso(pesos.map(() => pesoEquitativo));
  }

  const normalizado = pesosLimpios.map((peso) => peso / suma);
  return ajustarUltimoPeso(normalizado);
}

export function crearCromosomaAleatorio(cantidadActivos) {
  if (!Number.isInteger(cantidadActivos) || cantidadActivos <= 0) {
    throw new Error('La cantidad de activos debe ser un entero positivo.');
  }

  const pesosAleatorios = Array.from({ length: cantidadActivos }, () => Math.random());
  return normalizarCromosoma(pesosAleatorios);
}

export function crearPoblacionInicial(tamanoPoblacion, cantidadActivos) {
  const poblacion = [];
  const clavesGeneradas = new Set();
  let intentos = 0;
  const maximoIntentos = tamanoPoblacion * 20;

  while (poblacion.length < tamanoPoblacion && intentos < maximoIntentos) {
    const cromosoma = crearCromosomaAleatorio(cantidadActivos);
    const clave = cromosoma.map((peso) => peso.toFixed(12)).join('|');

    if (!clavesGeneradas.has(clave)) {
      poblacion.push(cromosoma);
      clavesGeneradas.add(clave);
    }

    intentos += 1;
  }

  while (poblacion.length < tamanoPoblacion) {
    poblacion.push(crearCromosomaAleatorio(cantidadActivos));
  }

  return poblacion;
}

function normalizarMetricas(metricas) {
  if (!metricas || typeof metricas !== 'object') {
    throw new Error('evaluarCartera debe devolver un objeto con retorno, riesgo y sharpe.');
  }

  const retorno = obtenerNumeroValido(
    metricas.retorno,
    metricas.rendimiento,
    metricas.expectedReturn,
    metricas.rentabilidad
  );

  const riesgo = obtenerNumeroValido(
    metricas.riesgo,
    metricas.volatilidad,
    metricas.volatility,
    metricas.desviacion
  );

  const sharpe = obtenerNumeroValido(
    metricas.sharpe,
    metricas.indiceSharpe,
    metricas.sharpeRatio,
    metricas.aptitud,
    metricas.fitness
  );

  if (retorno === null || riesgo === null || sharpe === null) {
    throw new Error(
      'evaluarCartera debe devolver métricas numéricas. Formatos aceptados: { retorno, riesgo, sharpe } o { expectedReturn, volatility, sharpe }.'
    );
  }

  return { retorno, riesgo, sharpe, aptitud: sharpe };
}

export async function evaluarIndividuo(cromosoma, activos, evaluarCartera) {
  const pesosViables = normalizarCromosoma(cromosoma);
  const metricasOriginales = await evaluarCartera(copiarCromosoma(pesosViables), activos.slice());
  const metricas = normalizarMetricas(metricasOriginales);

  return {
    cromosoma: pesosViables,
    metricas,
  };
}

export async function evaluarPoblacion(poblacion, activos, evaluarCartera) {
  return Promise.all(
    poblacion.map((cromosoma) => evaluarIndividuo(cromosoma, activos, evaluarCartera))
  );
}

export function obtenerMejorIndividuo(poblacionEvaluada) {
  if (!Array.isArray(poblacionEvaluada) || poblacionEvaluada.length === 0) {
    throw new Error('No se puede obtener el mejor individuo de una población vacía.');
  }

  return poblacionEvaluada.reduce((mejor, actual) => {
    return actual.metricas.aptitud > mejor.metricas.aptitud ? actual : mejor;
  });
}

export function calcularAptitudPromedio(poblacionEvaluada) {
  if (!Array.isArray(poblacionEvaluada) || poblacionEvaluada.length === 0) return 0;

  const suma = poblacionEvaluada.reduce(
    (acumulado, individuo) => acumulado + individuo.metricas.aptitud,
    0
  );

  return suma / poblacionEvaluada.length;
}

export function seleccionPorTorneo(poblacionEvaluada, tamanoTorneo) {
  if (!Array.isArray(poblacionEvaluada) || poblacionEvaluada.length === 0) {
    throw new Error('La selección por torneo requiere una población evaluada.');
  }

  const participantes = [];
  const limite = Math.min(tamanoTorneo, poblacionEvaluada.length);

  for (let i = 0; i < limite; i += 1) {
    const indiceAleatorio = Math.floor(Math.random() * poblacionEvaluada.length);
    participantes.push(poblacionEvaluada[indiceAleatorio]);
  }

  return obtenerMejorIndividuo(participantes);
}

export function cruceAritmetico(padreA, padreB, probabilidadCruce = 1) {
  if (padreA.length !== padreB.length) {
    throw new Error('Los padres deben tener la misma longitud cromosómica.');
  }

  if (Math.random() > probabilidadCruce) {
    return [normalizarCromosoma(padreA), normalizarCromosoma(padreB)];
  }

  const alfa = Math.random();
  const hijoA = [];
  const hijoB = [];

  for (let i = 0; i < padreA.length; i += 1) {
    hijoA.push(alfa * padreA[i] + (1 - alfa) * padreB[i]);
    hijoB.push((1 - alfa) * padreA[i] + alfa * padreB[i]);
  }

  return [normalizarCromosoma(hijoA), normalizarCromosoma(hijoB)];
}

export function mutarCromosoma(cromosoma, probabilidadMutacion, intensidadMutacion) {
  const mutado = cromosoma.slice();
  let huboMutacion = false;

  for (let i = 0; i < mutado.length; i += 1) {
    if (Math.random() < probabilidadMutacion) {
      const variacion = (Math.random() * 2 - 1) * intensidadMutacion;
      const factor = Math.max(EPSILON, 1 + variacion);
      mutado[i] *= factor;
      huboMutacion = true;
    }
  }

  if (!huboMutacion && mutado.length > 0 && probabilidadMutacion > 0 && intensidadMutacion > 0) {
    const indiceForzado = Math.floor(Math.random() * mutado.length);
    const variacion = (Math.random() * 2 - 1) * intensidadMutacion;
    const factor = Math.max(EPSILON, 1 + variacion);
    mutado[indiceForzado] *= factor;
  }

  return normalizarCromosoma(mutado);
}

function ordenarPorAptitudDescendente(poblacionEvaluada) {
  return poblacionEvaluada
    .slice()
    .sort((a, b) => b.metricas.aptitud - a.metricas.aptitud);
}

function crearNuevaPoblacion(poblacionEvaluada, configuracion) {
  const poblacionOrdenada = ordenarPorAptitudDescendente(poblacionEvaluada);
  const nuevaPoblacion = [];
  const cantidadElite = Math.min(configuracion.cantidadElite, configuracion.tamanoPoblacion);

  for (let i = 0; i < cantidadElite; i += 1) {
    nuevaPoblacion.push(copiarCromosoma(poblacionOrdenada[i].cromosoma));
  }

  while (nuevaPoblacion.length < configuracion.tamanoPoblacion) {
    const padreA = seleccionPorTorneo(poblacionEvaluada, configuracion.tamanoTorneo);
    const padreB = seleccionPorTorneo(poblacionEvaluada, configuracion.tamanoTorneo);

    const hijos = cruceAritmetico(
      padreA.cromosoma,
      padreB.cromosoma,
      configuracion.probabilidadCruce
    );

    for (const hijo of hijos) {
      if (nuevaPoblacion.length >= configuracion.tamanoPoblacion) break;

      const hijoMutado = mutarCromosoma(
        hijo,
        configuracion.probabilidadMutacion,
        configuracion.intensidadMutacion
      );

      nuevaPoblacion.push(hijoMutado);
    }
  }

  return nuevaPoblacion;
}

function crearEntradaHistorial(generacion, mejorHistorico, poblacionEvaluada) {
  const mejorGeneracion = obtenerMejorIndividuo(poblacionEvaluada);

  return {
    gen: generacion,
    sharpe: mejorHistorico.metricas.sharpe,
    mejorSharpeGeneracion: mejorGeneracion.metricas.sharpe,
    promedioSharpeGeneracion: calcularAptitudPromedio(poblacionEvaluada),
  };
}

function construirCarteras(activos, cromosoma) {
  return activos.map((ticker, indice) => ({
    ticker,
    porciento: cromosoma[indice] * 100,
  }));
}

function construirResultado(activos, mejorIndividuo, historial, configuracion) {
  const mejorCromosoma = normalizarCromosoma(mejorIndividuo.cromosoma);

  return {
    generaciones: historial,
    carteras: construirCarteras(activos, mejorCromosoma),
    mejorSharpe: mejorIndividuo.metricas.sharpe,
    mejorRetorno: mejorIndividuo.metricas.retorno,
    mejorRiesgo: mejorIndividuo.metricas.riesgo,
    mejorPesos: mejorCromosoma,
    configuracionUsada: configuracion,
  };
}

export async function ejecutarAlgoritmoGenetico({
  activos,
  evaluarCartera,
  configuracion = {},
}) {
  validarActivos(activos);
  validarFuncionEvaluadora(evaluarCartera);

  const configuracionFinal = prepararConfiguracion(configuracion);
  configuracionFinal.tamanoTorneo = Math.min(
    configuracionFinal.tamanoTorneo,
    configuracionFinal.tamanoPoblacion
  );
  configuracionFinal.cantidadElite = Math.min(
    configuracionFinal.cantidadElite,
    configuracionFinal.tamanoPoblacion
  );

  let poblacion = crearPoblacionInicial(configuracionFinal.tamanoPoblacion, activos.length);
  let poblacionEvaluada = await evaluarPoblacion(poblacion, activos, evaluarCartera);
  let mejorHistorico = obtenerMejorIndividuo(poblacionEvaluada);
  const historial = [];

  for (let generacion = 1; generacion <= configuracionFinal.numeroGeneraciones; generacion += 1) {
    poblacion = crearNuevaPoblacion(poblacionEvaluada, configuracionFinal);
    poblacionEvaluada = await evaluarPoblacion(poblacion, activos, evaluarCartera);

    const mejorGeneracion = obtenerMejorIndividuo(poblacionEvaluada);
    if (mejorGeneracion.metricas.aptitud > mejorHistorico.metricas.aptitud) {
      mejorHistorico = mejorGeneracion;
    }

    historial.push(crearEntradaHistorial(generacion, mejorHistorico, poblacionEvaluada));
  }

  return construirResultado(activos, mejorHistorico, historial, configuracionFinal);
}