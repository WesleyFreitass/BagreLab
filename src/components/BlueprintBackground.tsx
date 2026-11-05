import React from 'react';

export const BlueprintBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      
      {/* 1. RÉGUA MILIMÉTRICA VERTICAL (Borda Esquerda) */}
      <svg
        className="hidden lg:block absolute left-2 top-0 h-full w-8 text-[#221E1B] opacity-15"
        viewBox="0 0 32 1000"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
      >
        <line x1="28" y1="0" x2="28" y2="1000" strokeWidth="1" />
        {/* Marcadores a cada intervalo */}
        {Array.from({ length: 25 }).map((_, i) => {
          const y = (i + 1) * 40;
          const isMajor = i % 5 === 4;
          return (
            <g key={i}>
              <line x1={isMajor ? 12 : 20} y1={y} x2="28" y2={y} strokeWidth={isMajor ? 1.5 : 0.75} />
              {isMajor && (
                <text
                  x="8"
                  y={y + 3}
                  fontSize="7"
                  fontFamily="'IBM Plex Mono', monospace"
                  textAnchor="end"
                  fill="currentColor"
                  stroke="none"
                >
                  {(i + 1) * 10}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 2. CRUZEIRO CAD / MIRAS DE REGISTRO NOS 4 CANTOS */}
      <svg className="absolute top-4 left-4 w-6 h-6 text-[#221E1B] opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1" />
        <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1" />
        <circle cx="12" cy="12" r="5" strokeWidth="0.75" />
      </svg>

      <svg className="absolute top-4 right-4 w-6 h-6 text-[#221E1B] opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1" />
        <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1" />
        <circle cx="12" cy="12" r="5" strokeWidth="0.75" />
      </svg>

      {/* 3. FIGURA LATERAL ESQUERDA SUPERIOR: CUBO DE CALIBRAÇÃO ISOMÉTRICO (XYZ) */}
      <svg
        className="hidden xl:block absolute top-28 left-6 w-52 h-52 text-[#221E1B] opacity-15"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
      >
        {/* Cubo isométrico */}
        {/* Top face */}
        <polygon points="80,25 120,45 80,65 40,45" strokeWidth="1" />
        {/* Left face */}
        <polygon points="40,45 80,65 80,110 40,90" strokeWidth="1" />
        {/* Right face */}
        <polygon points="120,45 80,65 80,110 120,90" strokeWidth="1" />
        {/* Linhas ocultas tracejadas */}
        <line x1="40" y1="45" x2="80" y2="25" strokeDasharray="2 2" strokeWidth="0.75" />
        <line x1="120" y1="45" x2="80" y2="25" strokeDasharray="2 2" strokeWidth="0.75" />
        {/* Letras dos eixos */}
        <text x="77" y="50" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="currentColor" stroke="none" fontWeight="bold">Z</text>
        <text x="56" y="80" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="currentColor" stroke="none" fontWeight="bold">X</text>
        <text x="96" y="80" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="currentColor" stroke="none" fontWeight="bold">Y</text>
        {/* Cotas técnicas */}
        <line x1="30" y1="45" x2="30" y2="90" strokeWidth="0.75" />
        <line x1="26" y1="45" x2="34" y2="45" strokeWidth="0.75" />
        <line x1="26" y1="90" x2="34" y2="90" strokeWidth="0.75" />
        <text x="24" y="70" fontSize="7" fontFamily="'IBM Plex Mono', monospace" textAnchor="end" fill="currentColor" stroke="none">
          20.0mm
        </text>
        <text x="80" y="130" fontSize="8" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none">
          CALIB_CUBE // TOL ±0.05
        </text>
      </svg>

      {/* 4. FIGURA LATERAL DIREITA SUPERIOR: ESQUEMA TÉCNICO DE BICO EXTRUSOR (HOTEND NOZZLE) */}
      <svg
        className="hidden xl:block absolute top-28 right-6 w-52 h-52 text-[#221E1B] opacity-15"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
      >
        {/* Bloco aquecedor */}
        <rect x="50" y="20" width="60" height="35" strokeWidth="1" />
        <circle cx="65" cy="37" r="4" strokeWidth="0.75" />
        <text x="65" y="39" fontSize="5" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none">TH</text>
        {/* Bico cônico */}
        <polygon points="60,55 100,55 85,85 75,85" strokeWidth="1" />
        {/* Ponta do bico */}
        <rect x="77" y="85" width="6" height="5" strokeWidth="1" />
        {/* Cordão de filamento depositado */}
        <line x1="70" y1="90" x2="135" y2="90" strokeWidth="2.5" stroke="#1E3E24" opacity="0.5" />
        <line x1="70" y1="94" x2="135" y2="94" strokeWidth="1" strokeDasharray="3 2" />
        {/* Cotas */}
        <line x1="108" y1="55" x2="108" y2="85" strokeWidth="0.75" />
        <line x1="104" y1="55" x2="112" y2="55" strokeWidth="0.75" />
        <line x1="104" y1="85" x2="112" y2="85" strokeWidth="0.75" />
        <text x="116" y="72" fontSize="7" fontFamily="'IBM Plex Mono', monospace" fill="currentColor" stroke="none">
          Ø0.40mm
        </text>
        <text x="80" y="115" fontSize="8" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none">
          HOTEND // 215°C LAYER 0.20
        </text>
      </svg>

      {/* 5. FIGURA LATERAL ESQUERDA INFERIOR: PADRÃO DE PREENCHIMENTO HEXAGONAL (HONEYCOMB INFILL) */}
      <svg
        className="hidden xl:block absolute bottom-16 left-6 w-48 h-48 text-[#221E1B] opacity-15"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
      >
        <g strokeWidth="0.8">
          {/* Hexágonos interligados */}
          <polygon points="40,30 55,22 70,30 70,47 55,55 40,47" />
          <polygon points="70,30 85,22 100,30 100,47 85,55 70,47" />
          <polygon points="55,55 70,47 85,55 85,72 70,80 55,72" />
          <polygon points="85,55 100,47 115,55 115,72 100,80 85,72" />
          <polygon points="40,72 55,64 70,72 70,89 55,97 40,89" />
          <polygon points="70,89 85,81 100,89 100,106 85,114 70,106" />
        </g>
        <line x1="25" y1="125" x2="135" y2="125" strokeWidth="0.75" />
        <text x="80" y="137" fontSize="7" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none">
          HEX-INFILL // 20% INF DENSITY
        </text>
      </svg>

      {/* 6. FIGURA LATERAL DIREITA INFERIOR: CARIMBO TÉCNICO BAGRELAB // WORKSHOP */}
      <svg
        className="hidden xl:block absolute bottom-16 right-6 w-52 h-52 text-[#1E3E24] opacity-20"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
      >
        {/* Círculos concêntricos */}
        <circle cx="80" cy="80" r="60" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="52" strokeWidth="0.75" strokeDasharray="3 2" />
        <circle cx="80" cy="80" r="32" strokeWidth="1" />
        {/* Cruz de centro */}
        <line x1="80" y1="14" x2="80" y2="146" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="14" y1="80" x2="146" y2="80" strokeWidth="0.5" strokeDasharray="4 4" />
        {/* Silhueta minimalista de Bagre no centro */}
        <path
          d="M 60,80 C 65,72 85,70 98,80 C 85,90 65,88 60,80 Z"
          fill="currentColor"
          stroke="none"
          opacity="0.8"
        />
        <path d="M 98,80 L 105,74 L 102,80 L 105,86 Z" fill="currentColor" stroke="none" opacity="0.8" />
        <line x1="68" y1="78" x2="55" y2="72" strokeWidth="1" stroke="currentColor" />
        <line x1="68" y1="82" x2="55" y2="88" strokeWidth="1" stroke="currentColor" />
        {/* Texto circular técnico */}
        <text x="80" y="42" fontSize="6.5" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="bold">
          BAGRELAB 3D // OFICINA
        </text>
        <text x="80" y="125" fontSize="6" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle" fill="currentColor" stroke="none">
          EST. 2026 • MANUFATURA ADITIVA
        </text>
      </svg>

    </div>
  );
};
