// /app/page.js
'use client';

import { useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState(null);

  async function ejecutarOptimizacion() {
    setCargando(true);
    setError(null);
    
    try {
      const res = await fetch('/api/runOptimization', { method: 'POST' });
      const data = await res.json();
      setResultados(data);
    } catch (e) {
      setError('Error: ' + e.message);
    }
    
    setCargando(false);
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
                  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
                  '#FDBF6E', '#C9D9EB', '#F0F0F0', '#B6992D', '#E8DAEF'];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Optimizador de Portafolio NASDAQ</h1>
      
      <button 
        onClick={ejecutarOptimizacion} 
        disabled={cargando}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {cargando ? 'Optimizando...' : 'Ejecutar Optimización'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {resultados && (
        <div>
          <h2>Resultados</h2>
          
          <h3>Convergencia del Sharpe Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={resultados.generaciones}>
              <CartesianGrid />
              <XAxis dataKey="gen" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sharpe" stroke="#8884d8" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>

          <h3>Asignación Óptima de Capital</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={resultados.carteras}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ ticker, porciento }) => `${ticker}: ${porciento.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="porciento"
              >
                {resultados.carteras.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <h3>Métricas Finales</h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <strong>Sharpe Ratio:</strong> {resultados.mejorSharpe.toFixed(4)}
            </div>
            <div>
              <strong>Retorno Anual:</strong> {(resultados.mejorRetorno * 100).toFixed(2)}%
            </div>
            <div>
              <strong>Riesgo (Volatilidad):</strong> {(resultados.mejorRiesgo * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}