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
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      color: '#fff'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
        Optimizador de Portafolio NASDAQ
      </h1>
      <p style={{ color: '#999', marginBottom: '32px' }}>
        Algoritmo genético para maximizar el Índice de Sharpe sobre 15 activos NASDAQ
      </p>
      
      <button 
        onClick={ejecutarOptimizacion} 
        disabled={cargando}
        style={{ 
          padding: '14px 32px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          cursor: cargando ? 'not-allowed' : 'pointer',
          backgroundColor: cargando ? '#555' : '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
        }}
      >
        {cargando ? 'Optimizando...' : '▶ Ejecutar Optimización'}
      </button>

      {cargando && (
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          backgroundColor: '#111',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #333',
            borderTop: '3px solid #0070f3',
            borderRadius: '50%',
            margin: '0 auto 12px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#ccc', margin: 0 }}>
            Ejecutando 500 generaciones sobre 100 carteras...
          </p>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
            Esto puede tardar entre 20 y 40 segundos
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: '#ff4d4d', marginTop: '16px' }}>{error}</p>
      )}

      {resultados && !cargando && (
        <div style={{ marginTop: '40px' }}>

          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Convergencia del Sharpe Ratio
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={resultados.generaciones}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="gen" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="sharpe" stroke="#0070f3" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>

          <h3 style={{ fontSize: '18px', margin: '32px 0 16px' }}>
            Asignación Óptima de Capital
          </h3>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={resultados.carteras}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ ticker, porciento }) => porciento > 1 ? `${ticker}: ${porciento.toFixed(1)}%` : ''}
                outerRadius={130}
                fill="#8884d8"
                dataKey="porciento"
              >
                {resultados.carteras.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>

          <h3 style={{ fontSize: '18px', margin: '32px 0 16px' }}>
            Métricas Finales
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              flex: '1',
              minWidth: '150px',
              padding: '20px', 
              backgroundColor: '#111', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Sharpe Ratio</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>
                {resultados.mejorSharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ 
              flex: '1',
              minWidth: '150px',
              padding: '20px', 
              backgroundColor: '#111', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Retorno Anual</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#00C49F' }}>
                {(resultados.mejorRetorno * 100).toFixed(2)}%
              </p>
            </div>
            <div style={{ 
              flex: '1',
              minWidth: '150px',
              padding: '20px', 
              backgroundColor: '#111', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Riesgo (Volatilidad)</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FF8042' }}>
                {(resultados.mejorRiesgo * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}