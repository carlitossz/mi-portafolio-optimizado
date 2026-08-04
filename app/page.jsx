'use client';

import { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
                  '#FDBF6E', '#C9D9EB', '#B6992D', '#E8DAEF', '#66D9EF'];

  const carterasOrdenadas = resultados?.carteras
    ? [...resultados.carteras].sort((a, b) => b.porciento - a.porciento)
    : [];

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

          <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
            Convergencia del Sharpe Ratio
          </h3>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
            Evolución del mejor Índice de Sharpe encontrado en cada generación (mayor es mejor)
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ 
              padding: '10px 16px', 
              backgroundColor: '#111', 
              borderRadius: '6px',
              borderLeft: '3px solid #666'
            }}>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px' }}>Sharpe Inicial (Gen 1)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                {resultados.generaciones[0]?.sharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ 
              padding: '10px 16px', 
              backgroundColor: '#111', 
              borderRadius: '6px',
              borderLeft: '3px solid #0070f3'
            }}>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px' }}>Sharpe Final (Gen 500)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>
                {resultados.mejorSharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ 
              padding: '10px 16px', 
              backgroundColor: '#111', 
              borderRadius: '6px',
              borderLeft: '3px solid #00C49F'
            }}>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px' }}>Mejora Total</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#00C49F' }}>
                +{(((resultados.mejorSharpe - resultados.generaciones[0]?.sharpe) / resultados.generaciones[0]?.sharpe) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={resultados.generaciones} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSharpe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070f3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0070f3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#292929" strokeDasharray="3 3" />
              <XAxis 
                dataKey="gen" 
                stroke="#999" 
                label={{ value: 'Generación', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                stroke="#999" 
                label={{ value: 'Índice de Sharpe', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '6px' }}
                labelFormatter={(label) => `Generación ${label}`}
                formatter={(value) => [value.toFixed(4), 'Sharpe Ratio']}
              />
              <ReferenceLine 
                y={resultados.mejorSharpe} 
                stroke="#00C49F" 
                strokeDasharray="4 4" 
                label={{ value: 'Máximo alcanzado', position: 'insideTopRight', fill: '#00C49F', fontSize: 11 }}
              />
              <Area 
                type="monotone" 
                dataKey="sharpe" 
                stroke="#0070f3" 
                strokeWidth={2.5}
                fill="url(#colorSharpe)"
                dot={false} 
                isAnimationActive={true}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>

          <h3 style={{ fontSize: '18px', margin: '32px 0 16px' }}>
            Asignación Óptima de Capital
          </h3>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <div style={{ flex: '1', minWidth: '300px' }}>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={resultados.carteras}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="porciento"
                  >
                    {resultados.carteras.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                    formatter={(value, name, props) => [`${value.toFixed(2)}%`, props.payload.ticker]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: '1', minWidth: '280px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#999', fontSize: '13px' }}>Activo</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: '#999', fontSize: '13px' }}>Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {carterasOrdenadas.map((cartera, index) => {
                    const colorIndex = resultados.carteras.findIndex(c => c.ticker === cartera.ticker);
                    return (
                      <tr key={cartera.ticker} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            backgroundColor: COLORS[colorIndex % COLORS.length],
                            display: 'inline-block',
                            flexShrink: 0
                          }} />
                          {cartera.ticker}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                          {cartera.porciento.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

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