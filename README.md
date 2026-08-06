# Optimizador de Portafolio NASDAQ

Sistema que utiliza un **algoritmo genético** para encontrar la asignación óptima de capital entre 15 activos del NASDAQ, maximizando el Índice de Sharpe (retorno ajustado al riesgo), como aproximación a la frontera eficiente de Markowitz.

🔗 **Demo en producción:** https://mi-portafolio-optimizado.vercel.app

## Proyecto académico

Finanzas para Ingenieros — Segundo Parcial
Integrantes: Carlos Marval, Breinny Gomez, Kimberly Zapata

## Tecnologías

- **Next.js 16** (App Router) — frontend + backend en un solo proyecto
- **React 19** — interfaz del dashboard
- **Recharts** — gráficas de convergencia y distribución
- **yahoo-finance2** — datos históricos reales de mercado
- **Vercel** — despliegue con integración continua desde GitHub

## Estructura del proyecto
app/
api/
runOptimization/route.js -> orquesta todo el flujo (datos + covarianza + algoritmo genético)
calculateSharpe/route.js -> endpoint auxiliar (valores de prueba)
page.jsx -> dashboard interactivo
lib/
algoritmoGenetico.js -> motor evolutivo genérico (sin lógica financiera)
getData.js -> conexión con Yahoo Finance y cálculo de retornos

## Cómo funciona

1. Se descargan precios de cierre diarios de los últimos 3 años de 15 activos NASDAQ.
2. Se calculan retornos logarítmicos diarios y la matriz de covarianzas.
3. Un algoritmo genético (100 carteras, 500 generaciones, selección por torneo, cruce aritmético, mutación y elitismo) busca la combinación de pesos que maximiza el Índice de Sharpe.
4. El dashboard muestra la convergencia del fitness, la asignación final de capital y las métricas de riesgo/retorno.

## Correrlo localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)
