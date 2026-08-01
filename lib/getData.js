// /lib/getData.js
const yfinance = require('yahoo-finance2').default;

const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 
                 'NFLX', 'ADBE', 'PYPL', 'INTC', 'AMD', 'CSCO', 'AVGO', 'QCOM'];

let datosEnCache = null;

async function traerYCalcular() {
  if (datosEnCache) return datosEnCache;
  
  console.log('Bajando datos...');
  let todosLosPrecios = {};
  
  for (let ticker of tickers) {
    try {
      let datos = await yfinance.historical(ticker, { period: 'y3' });
      todosLosPrecios[ticker] = datos.map(d => d.close);
    } catch (e) {
      console.log(`Error bajando ${ticker}`);
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