// /app/api/runOptimization/route.js
import { NextResponse } from 'next/server';
import { ejecutarAlgoritmoGenetico } from '@/lib/algoritmoGenetico';
import { traerYCalcular, tickers } from '@/lib/getData';

export const maxDuration = 60; // segundos

let datosEnCache = null;
let matrizCovEnCache = null;

async function calcularMatrizCovarianza(retornos) {
  let n = tickers.length;
  let matriz = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let ret_i = retornos[tickers[i]];
      let ret_j = retornos[tickers[j]];
      
      let prom_i = ret_i.reduce((a,b) => a+b) / ret_i.length;
      let prom_j = ret_j.reduce((a,b) => a+b) / ret_j.length;
      
      let cov = 0;
      for (let k = 0; k < ret_i.length; k++) {
        cov += (ret_i[k] - prom_i) * (ret_j[k] - prom_j);
      }
      matriz[i][j] = cov / ret_i.length * 252;
    }
  }
  
  return matriz;
}

function calcularSharpe(pesos, retornos, matrizCov) {
  let retornoPortafolio = 0;
  for (let i = 0; i < pesos.length; i++) {
    let promRetorno = retornos[tickers[i]].reduce((a,b) => a+b) / retornos[tickers[i]].length;
    retornoPortafolio += pesos[i] * promRetorno * 252;
  }
  
  let varianzaPortafolio = 0;
  for (let i = 0; i < pesos.length; i++) {
    for (let j = 0; j < pesos.length; j++) {
      varianzaPortafolio += pesos[i] * pesos[j] * matrizCov[i][j];
    }
  }
  
  let riesgoPortafolio = Math.sqrt(varianzaPortafolio);
  let tasaLibreRiesgo = 0.02;
  
  let sharpe = (retornoPortafolio - tasaLibreRiesgo) / riesgoPortafolio;
  
  return {
    sharpe: sharpe,
    retorno: retornoPortafolio,
    riesgo: riesgoPortafolio
  };
}

async function evaluarCartera(pesos) {
  return calcularSharpe(pesos, datosEnCache.retornos, matrizCovEnCache);
}

export async function POST(request) {
  try {
    // Bajar datos si no están en cache
    if (!datosEnCache) {
      datosEnCache = await traerYCalcular();
      matrizCovEnCache = await calcularMatrizCovarianza(datosEnCache.retornos);
    }

    // Correr algoritmo genético
    const resultado = await ejecutarAlgoritmoGenetico({
      activos: tickers,
      evaluarCartera: evaluarCartera,
      configuracion: {
        tamanoPoblacion: 100,
        numeroGeneraciones: 500,
        tamanoTorneo: 3,
        probabilidadCruce: 1,
        probabilidadMutacion: 0.05,
        intensidadMutacion: 0.1,
        cantidadElite: 1,
      }
    });

    return NextResponse.json({
      generaciones: resultado.generaciones,
      carteras: resultado.carteras,
      mejorSharpe: resultado.mejorSharpe,
      mejorRetorno: resultado.mejorRetorno,
      mejorRiesgo: resultado.mejorRiesgo
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}