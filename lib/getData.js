// /lib/getData.js
const YahooFinance = require('yahoo-finance2').default;
const yfinance = new YahooFinance();

const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 
                 'NFLX', 'ADBE', 'PYPL', 'INTC', 'AMD', 'CSCO', 'AVGO', 'QCOM'];

let datosEnCache = null;

async function traerYCalcular() {
  if (datosEnCache) return datosEnCache;
  
  console.log('Bajando datos...');
  let todosLosPrecios = {};
  
  const fechaFin = new Date();
  const fechaInicio = new Date();
  fechaInicio.setFullYear(fechaFin.getFullYear() - 3);
  
  for (let ticker of tickers) {
    try {
      let resultado = await yfinance.chart(ticker, {
        period1: fechaInicio,
        period2: fechaFin,
        interval: '1d'
      });
      
      let precios = resultado.quotes
        .map(q => q.close)
        .filter(p => p !== null && p !== undefined);
      
      if (precios.length < 2) {
        throw new Error(`Datos insuficientes para ${ticker}`);
      }
      
      todosLosPrecios[ticker] = precios;
    } catch (e) {
      console.log(`Error bajando ${ticker}:`, e.message);
      throw new Error(`No se pudo obtener datos de ${ticker}: ${e.message}`);
    }
  }
  
  let retornos = {};
  for (let ticker of tickers) {
    retornos[ticker] = [];
    for (let i = 1; i < todosLosPrecios[ticker].length; i++) {
      let r = Math.log(todosLosPrecios[ticker][i] / todosLosPrecios[ticker][i-1]);
      retornos[ticker].push(r);
    }
  }
  
  datosEnCache = { precios: todosLosPrecios, retornos: retornos, tickers: tickers };
  return datosEnCache;
}

module.exports = { traerYCalcular, tickers };