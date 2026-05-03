"use client";

import React from 'react';

/**
 * Componente SVG do logotipo oficial do Instituto Federal do Amazonas
 * Segue as diretrizes de identidade visual da marca IF:
 * - Verde institucional: #2f9e41
 * - Vermelho institucional: #cd191e
 * - Preto: #000000
 * - Tipografia: Open Sans (Bold para "INSTITUTO FEDERAL", Regular para subtítulo)
 */

interface IFAMLogoProps {
  variant?: 'reitoria' | 'cmc';
  layout?: 'horizontal' | 'vertical';
  inverted?: boolean;
  width?: number;
  className?: string;
}

/**
 * Marca do IF: grid 3x3 com círculo vermelho no canto superior esquerdo
 * Conforme manual de identidade visual do Instituto Federal
 */
const IFLogoMark = ({ size = 1, inverted = false }: { size?: number; inverted?: boolean }) => {
  const s = 7 * size;
  const g = 2 * size;
  const verde = inverted ? '#ffffff' : '#2f9e41';
  const vermelho = inverted ? '#ffffff' : '#cd191e';
  const r = s / 2;

  return (
    <g>
      {/* Linha 1: círculo vermelho, quadrado verde, quadrado verde */}
      <circle cx={r} cy={r} r={r} fill={vermelho} />
      <rect x={s + g} y={0} width={s} height={s} fill={verde} />
      <rect x={2 * (s + g)} y={0} width={s} height={s} fill={verde} />
      {/* Linha 2: 3 quadrados verdes */}
      <rect x={0} y={s + g} width={s} height={s} fill={verde} />
      <rect x={s + g} y={s + g} width={s} height={s} fill={verde} />
      <rect x={2 * (s + g)} y={s + g} width={s} height={s} fill={verde} />
      {/* Linha 3: 3 quadrados verdes */}
      <rect x={0} y={2 * (s + g)} width={s} height={s} fill={verde} />
      <rect x={s + g} y={2 * (s + g)} width={s} height={s} fill={verde} />
      <rect x={2 * (s + g)} y={2 * (s + g)} width={s} height={s} fill={verde} />
    </g>
  );
};

export const IFAMLogo: React.FC<IFAMLogoProps> = ({
  variant = 'reitoria',
  layout = 'horizontal',
  inverted = false,
  width = 160,
  className = '',
}) => {
  const textColor = inverted ? '#ffffff' : '#1a1a1a';
  const subtitleColor = inverted ? 'rgba(255,255,255,0.75)' : '#444444';

  if (layout === 'horizontal') {
    const markSize = 2.5;
    const markS = 7 * markSize;       // 17.5
    const markG = 2 * markSize;       // 5
    const markW = 3 * markS + 2 * markG; // 62.5
    const markH = markW;              // 62.5
    const textX = markW + 8;
    
    const mainFontSize = 14;
    const subFontSize = 10;
    const campusFontSize = 9;
    
    // "INSTITUTO FEDERAL" em Open Sans Bold 14px ≈ 140px de largura
    const textBlockWidth = 145;
    const dividerX = textX + textBlockWidth + 5;
    const campusTextX = dividerX + 8;
    const campusBlockWidth = variant === 'cmc' ? 85 : 0;
    
    const svgWidth = variant === 'cmc' 
      ? campusTextX + campusBlockWidth + 5
      : textX + textBlockWidth + 10;
    const svgHeight = markH;
    const scale = width / svgWidth;

    return (
      <svg
        width={width}
        height={svgHeight * scale}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label={variant === 'cmc' ? 'IFAM Campus Manaus Centro' : 'Instituto Federal do Amazonas'}
      >
        <g transform={`translate(0, ${(markH - markH) / 2})`}>
          <IFLogoMark size={markSize} inverted={inverted} />
        </g>
        <g>
          <text
            x={textX}
            y={markH * 0.42}
            fontFamily="'Open Sans', 'Public Sans', sans-serif"
            fontSize={mainFontSize}
            fontWeight="700"
            fill={textColor}
            letterSpacing="0.3"
          >
            INSTITUTO FEDERAL
          </text>
          <text
            x={textX}
            y={markH * 0.68}
            fontFamily="'Open Sans', 'Public Sans', sans-serif"
            fontSize={subFontSize}
            fontWeight="400"
            fill={subtitleColor}
          >
            Amazonas
          </text>
          {variant === 'cmc' && (
            <>
              <line
                x1={dividerX}
                y1={markH * 0.12}
                x2={dividerX}
                y2={markH * 0.88}
                stroke={inverted ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}
                strokeWidth="0.7"
              />
              <text
                x={campusTextX}
                y={markH * 0.42}
                fontFamily="'Open Sans', 'Public Sans', sans-serif"
                fontSize={campusFontSize}
                fontWeight="600"
                fill={subtitleColor}
              >
                Campus
              </text>
              <text
                x={campusTextX}
                y={markH * 0.68}
                fontFamily="'Open Sans', 'Public Sans', sans-serif"
                fontSize={campusFontSize}
                fontWeight="600"
                fill={subtitleColor}
              >
                Manaus Centro
              </text>
            </>
          )}
        </g>
      </svg>
    );
  }

  // Layout vertical
  const markSize = 2.5;
  const markS = 7 * markSize;
  const markG = 2 * markSize;
  const markW = 3 * markS + 2 * markG;
  const markH = markW;

  const svgWidth = 150;
  const svgHeight = variant === 'cmc' ? markH + 48 : markH + 35;
  const scale = width / svgWidth;

  return (
    <svg
      width={width}
      height={svgHeight * scale}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={variant === 'cmc' ? 'IFAM Campus Manaus Centro' : 'Instituto Federal do Amazonas'}
    >
      <g transform={`translate(${(svgWidth - markW) / 2}, 0)`}>
        <IFLogoMark size={markSize} inverted={inverted} />
      </g>
      <text
        x={svgWidth / 2}
        y={markH + 15}
        fontFamily="'Open Sans', 'Public Sans', sans-serif"
        fontSize="12"
        fontWeight="700"
        fill={textColor}
        textAnchor="middle"
        letterSpacing="0.3"
      >
        INSTITUTO FEDERAL
      </text>
      <text
        x={svgWidth / 2}
        y={markH + 27}
        fontFamily="'Open Sans', 'Public Sans', sans-serif"
        fontSize="9"
        fontWeight="400"
        fill={subtitleColor}
        textAnchor="middle"
      >
        Amazonas
      </text>
      {variant === 'cmc' && (
        <text
          x={svgWidth / 2}
          y={markH + 40}
          fontFamily="'Open Sans', 'Public Sans', sans-serif"
          fontSize="8"
          fontWeight="600"
          fill={subtitleColor}
          textAnchor="middle"
        >
          Campus Manaus Centro
        </text>
      )}
    </svg>
  );
};

export default IFAMLogo;
