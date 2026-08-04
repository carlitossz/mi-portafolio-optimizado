'use client';

import { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Home() {
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState(null);
  const [manualAbierto, setManualAbierto] = useState(false);

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

  const activoPrincipal = carterasOrdenadas[0];
  const cantidadConcentrada = carterasOrdenadas.filter(c => c.porciento > 5).length;

  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Optimizador de Portafolio NASDAQ
          </h1>
          <p style={{ color: '#999', marginBottom: '0' }}>
            Algoritmo genético para maximizar el Índice de Sharpe sobre 15 activos NASDAQ
          </p>
        </div>
        <button
          onClick={() => setManualAbierto(true)}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: '#0070f3',
            border: '1.5px solid #0070f3',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            height: 'fit-content'
          }}
        >
          📖 ¿Cómo funciona?
        </button>
      </div>
      
      <button 
        onClick={ejecutarOptimizacion} 
        disabled={cargando}
        style={{ 
          marginTop: '32px',
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

          {/* GRÁFICA DE CONVERGENCIA */}
          <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
            Convergencia del Sharpe Ratio
          </h3>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
            Evolución del mejor Índice de Sharpe encontrado en cada generación (mayor es mejor)
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#111', borderRadius: '6px', borderLeft: '3px solid #666' }}>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px' }}>Sharpe Inicial (Gen 1)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                {resultados.generaciones[0]?.sharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ padding: '10px 16px', backgroundColor: '#111', borderRadius: '6px', borderLeft: '3px solid #0070f3' }}>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px' }}>Sharpe Final (Gen 500)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>
                {resultados.mejorSharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ padding: '10px 16px', backgroundColor: '#111', borderRadius: '6px', borderLeft: '3px solid #00C49F' }}>
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

          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            backgroundColor: '#0a1830', 
            borderRadius: '8px',
            borderLeft: '3px solid #0070f3',
            fontSize: '13px',
            color: '#ccc',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#0070f3' }}>💡 Cómo leer esta gráfica: </strong>
            Cada punto representa la mejor cartera encontrada hasta esa generación. La curva sube porque 
            en cada ciclo el algoritmo selecciona las mejores carteras (selección por torneo), las combina 
            (cruce aritmético) y las modifica levemente (mutación) para explorar nuevas combinaciones. 
            Que la curva se aplane hacia el final indica que el algoritmo <strong>convergió</strong>: 
            encontró una solución cercana al óptimo y ya no hay mejoras significativas.
          </div>

          {/* ASIGNACIÓN DE CAPITAL */}
          <h3 style={{ fontSize: '18px', margin: '40px 0 4px' }}>
            Asignación Óptima de Capital
          </h3>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
            Porcentaje del capital total que el algoritmo asignó a cada uno de los 15 activos
          </p>

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
                  {carterasOrdenadas.map((cartera) => {
                    const colorIndex = resultados.carteras.findIndex(c => c.ticker === cartera.ticker);
                    return (
                      <tr key={cartera.ticker} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            backgroundColor: COLORS[colorIndex % COLORS.length],
                            display: 'inline-block', flexShrink: 0
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

          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            backgroundColor: '#0a1830', 
            borderRadius: '8px',
            borderLeft: '3px solid #0070f3',
            fontSize: '13px',
            color: '#ccc',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#0070f3' }}>💡 Cómo interpretar esta distribución: </strong>
            El activo con mayor peso es <strong>{activoPrincipal?.ticker}</strong> ({activoPrincipal?.porciento.toFixed(1)}%). 
            En total, <strong>{cantidadConcentrada} de los 15 activos</strong> concentran más del 5% del capital cada uno; 
            el resto recibe porcentajes muy bajos porque el algoritmo determinó que aportan poco a la relación riesgo-retorno 
            del conjunto. Esto no es un error: significa que esos activos están muy correlacionados con otros ya presentes 
            en la cartera, o que su retorno ajustado al riesgo individual es menos favorable.
          </div>

          {/* MÉTRICAS FINALES */}
          <h3 style={{ fontSize: '18px', margin: '40px 0 16px' }}>
            Métricas Finales
          </h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '150px', padding: '20px', backgroundColor: '#111', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Sharpe Ratio</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0070f3' }}>
                {resultados.mejorSharpe.toFixed(4)}
              </p>
            </div>
            <div style={{ flex: '1', minWidth: '150px', padding: '20px', backgroundColor: '#111', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Retorno Anual</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#00C49F' }}>
                {(resultados.mejorRetorno * 100).toFixed(2)}%
              </p>
            </div>
            <div style={{ flex: '1', minWidth: '150px', padding: '20px', backgroundColor: '#111', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>Riesgo (Volatilidad)</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#FF8042' }}>
                {(resultados.mejorRiesgo * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL */}
      {manualAbierto && (
        <div 
          onClick={() => setManualAbierto(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#111',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid #333'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', margin: 0 }}>📖 Manual del Sistema</h2>
              <button 
                onClick={() => setManualAbierto(false)}
                style={{ 
                  background: 'none', border: 'none', color: '#999', 
                  fontSize: '24px', cursor: 'pointer', lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>

              <h3 style={{ color: '#0070f3', fontSize: '16px', marginTop: '0' }}>¿Qué hace este sistema?</h3>
              <p>
                Busca automáticamente la mejor forma de repartir capital entre 15 acciones del NASDAQ, 
                maximizando el <strong>Índice de Sharpe</strong> (retorno obtenido por cada unidad de riesgo asumido).
                En vez de probar todas las combinaciones posibles (imposible por la cantidad), usa un 
                <strong> algoritmo genético</strong> que imita la evolución natural para encontrar una muy buena solución 
                en poco tiempo.
              </p>

              <h3 style={{ color: '#0070f3', fontSize: '16px' }}>1. Obtención de datos</h3>
              <p>
                Se descargan los precios de cierre diarios de los últimos 3 años de 15 acciones (AAPL, MSFT, GOOGL, 
                TSLA, NVDA, META, AMZN, NFLX, ADBE, PYPL, INTC, AMD, CSCO, AVGO, QCOM) desde Yahoo Finance. Con esos 
                precios se calcula el <strong>retorno logarítmico diario</strong> de cada acción, y con ellos la 
                <strong> matriz de covarianzas</strong>, que mide cómo se mueven las acciones entre sí.
              </p>

              <h3 style={{ color: '#0070f3', fontSize: '16px' }}>2. El algoritmo genético</h3>
              <p>Cada "cartera" (combinación de 15 pesos que suman 100%) es un <strong>cromosoma</strong>. El proceso:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Población inicial:</strong> se generan 100 carteras aleatorias.</li>
                <li><strong>Evaluación:</strong> a cada cartera se le calcula su Sharpe Ratio.</li>
                <li><strong>Selección por torneo:</strong> se eligen "padres" comparando grupos pequeños de carteras y quedándose con la mejor de cada grupo.</li>
                <li><strong>Cruce aritmético:</strong> se combinan los pesos de 2 padres para crear carteras "hijas".</li>
                <li><strong>Mutación:</strong> se altera aleatoriamente algún peso para explorar nuevas combinaciones y evitar estancarse.</li>
                <li><strong>Normalización:</strong> tras cada cruce o mutación, los pesos se ajustan para que siempre sumen exactamente 100%.</li>
                <li>Este ciclo se repite <strong>500 veces (generaciones)</strong>, y en cada una la población tiende a mejorar.</li>
              </ul>

              <h3 style={{ color: '#0070f3', fontSize: '16px' }}>3. Índice de Sharpe</h3>
              <p>
                Es la métrica que el algoritmo maximiza. Se calcula así:
              </p>
              <p style={{ 
                backgroundColor: '#0a0a0a', padding: '12px', borderRadius: '6px', 
                fontFamily: 'monospace', textAlign: 'center', color: '#0070f3'
              }}>
                Sharpe = (Retorno de la cartera − Tasa libre de riesgo) / Riesgo de la cartera
              </p>
              <p>
                Un Sharpe más alto significa mejor retorno por cada unidad de riesgo asumido. Se usa 2% como 
                tasa libre de riesgo de referencia.
              </p>

              <h3 style={{ color: '#0070f3', fontSize: '16px' }}>4. Lo que ves en pantalla</h3>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Gráfica de convergencia:</strong> muestra cómo mejora el mejor Sharpe encontrado, generación tras generación.</li>
                <li><strong>Gráfica de torta + tabla:</strong> muestra el % final de capital asignado a cada una de las 15 acciones.</li>
                <li><strong>Métricas finales:</strong> Sharpe, retorno anual y riesgo (volatilidad) de la cartera óptima encontrada.</li>
              </ul>

              <h3 style={{ color: '#0070f3', fontSize: '16px' }}>Stack tecnológico</h3>
              <p>
                Next.js (frontend + backend en un solo proyecto), React, Recharts (gráficas), Yahoo Finance API 
                (datos reales de mercado), desplegado en Vercel con integración continua desde GitHub.
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