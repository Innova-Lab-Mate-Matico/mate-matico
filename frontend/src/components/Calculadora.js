import React, { useState, useCallback } from 'react';
import './Calculadora.css';

/*
  MATE-MÁTICO — Calculadora flotante
  - Teclado numérico completo con +, -, ×, ÷, decimales y %
  - Persiste el display aunque el usuario responda o cambie de tab
  - No interfiere con el campo de respuesta del ejercicio
*/

const BOTONES = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0',       '.', '='],
];

export default function Calculadora({ onClose, onInsertResult }) {
  const [display, setDisplay]     = useState('0');
  const [operando, setOperando]   = useState(null);
  const [operacion, setOperacion] = useState(null);
  const [esperandoNum, setEsperandoNum] = useState(false);

  const presionar = useCallback((val) => {
    // Limpiar
    if (val === 'C') {
      setDisplay('0');
      setOperando(null);
      setOperacion(null);
      setEsperandoNum(false);
      return;
    }

    // Retroceso (Backspace)
    if (val === '⌫') {
      setDisplay(d => {
        if (d.length <= 1 || d === 'Error' || d === '-0') return '0';
        if (d.length === 2 && d.startsWith('-')) return '0';
        return d.slice(0, -1);
      });
      return;
    }

    // Porcentaje
    if (val === '%') {
      setDisplay(d => String(parseFloat(d) / 100));
      return;
    }

    // Operaciones
    if (['+', '−', '×', '÷'].includes(val)) {
      setOperando(parseFloat(display));
      setOperacion(val);
      setEsperandoNum(true);
      return;
    }

    // Igual
    if (val === '=') {
      if (operando === null || operacion === null) return;
      const b = parseFloat(display);
      let resultado;
      switch (operacion) {
        case '+': resultado = operando + b; break;
        case '−': resultado = operando - b; break;
        case '×': resultado = operando * b; break;
        case '÷': resultado = b !== 0 ? operando / b : 'Error'; break;
        default: return;
      }
      // Evitar notación científica para números razonables
      const str = typeof resultado === 'number'
        ? parseFloat(resultado.toFixed(10)).toString()
        : resultado;
      setDisplay(str);
      setOperando(null);
      setOperacion(null);
      setEsperandoNum(false);
      
      if (onInsertResult && str !== 'Error') {
        onInsertResult(str);
      }
      return;
    }

    // Punto decimal
    if (val === '.') {
      if (esperandoNum) {
        setDisplay('0.');
        setEsperandoNum(false);
        return;
      }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }

    // Dígitos
    if (esperandoNum) {
      setDisplay(val);
      setEsperandoNum(false);
    } else {
      setDisplay(d => d === '0' ? val : d.length < 12 ? d + val : d);
    }
  }, [display, operando, operacion, esperandoNum]);

  const esOperador = (v) => ['+', '−', '×', '÷'].includes(v);
  const esAccion   = (v) => ['C', '±', '%'].includes(v);

  return (
    <div className="calc-overlay" role="dialog" aria-label="Calculadora">
      <div className="calc-panel">

        {/* Header */}
        <div className="calc-header">
          <span className="calc-title">🧮 Calculadora</span>
          <button
            className="calc-close"
            onClick={onClose}
            aria-label="Cerrar calculadora"
          >
            ✕
          </button>
        </div>

        {/* Display */}
        <div className="calc-display" aria-live="polite">
          {operacion && (
            <div className="calc-display-op">
              {operando} {operacion}
            </div>
          )}
          <div className="calc-display-main">{display}</div>
        </div>

        {/* Teclado */}
        <div className="calc-grid">
          {BOTONES.map((fila, fi) =>
            fila.map((btn, bi) => (
              <button
                key={`${fi}-${bi}`}
                className={[
                  'calc-btn',
                  btn === '='       ? 'calc-btn--igual'    : '',
                  esOperador(btn)   ? 'calc-btn--operador' : '',
                  esAccion(btn)     ? 'calc-btn--accion'   : '',
                  btn === '0'       ? 'calc-btn--cero'     : '',
                ].join(' ').trim()}
                onClick={() => presionar(btn)}
              >
                {btn}
              </button>
            ))
          )}
        </div>

        <p className="calc-hint">Usá esta calculadora para ayudarte con el cálculo — la respuesta la ingresás en el ejercicio.</p>
      </div>
    </div>
  );
}
