// /app/api/calculateSharpe/route.js
import { NextResponse } from 'next/server';

const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 
                 'NFLX', 'ADBE', 'PYPL', 'INTC', 'AMD', 'CSCO', 'AVGO', 'QCOM'];

export async function POST(request) {
  try {
    const body = await request.json();
    const pesos = body.pesos;
    
    // Por ahora, devuelve valores de prueba
    return NextResponse.json({
      sharpe: 1.45,
      retorno: 0.15,
      riesgo: 0.12
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}