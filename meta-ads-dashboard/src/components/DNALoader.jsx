// Usage:
//   <DNALoader />
//   <DNALoader width={60} height={120} label="Cargando..." />
//   <DNALoader colorA="#6366f1" colorB="#22c55e" speed={1.5} />

import { useEffect, useRef, memo } from 'react';

const DNALoader = memo(function DNALoader({
  width = 80,
  height = 180,
  colorA = '#6366f1',
  colorB = '#818cf8',
  speed = 1,
  showRungs = true,
  label,
  className
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const amplitude = width * 0.35;
    const numNodes = Math.floor(height / 14);
    let offset = 0;
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const nodesA = [];
      const nodesB = [];

      for (let i = 0; i < numNodes; i++) {
        const t = (i / numNodes) * Math.PI * 4 + offset;
        const y = (i / numNodes) * height;
        const xA = cx + Math.sin(t) * amplitude;
        const xB = cx + Math.sin(t + Math.PI) * amplitude;
        const zA = Math.cos(t);
        const zB = Math.cos(t + Math.PI);

        nodesA.push({ x: xA, y, z: zA });
        nodesB.push({ x: xB, y, z: zB });

        // Rungs (dashed connectors)
        if (showRungs) {
          const avgZ = ((zA + zB) / 2 + 1) / 2;
          const rungOpacity = avgZ * 0.3;
          ctx.save();
          ctx.strokeStyle = `rgba(148, 163, 184, ${rungOpacity})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(xA, y);
          ctx.lineTo(xB, y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw strands — back first, then front
      const drawStrand = (nodes, color, isBack) => {
        const filtered = nodes.filter(n => isBack ? n.z < 0 : n.z >= 0);
        if (filtered.length < 2) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = isBack ? 0.3 : 1;
        ctx.lineWidth = isBack ? 1 : 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(filtered[0].x, filtered[0].y);
        for (let i = 1; i < filtered.length; i++) {
          const prev = filtered[i - 1];
          const curr = filtered[i];
          const cpx = (prev.x + curr.x) / 2;
          const cpy = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        ctx.stroke();

        // Dots on front nodes
        if (!isBack) {
          for (const n of filtered) {
            const dotSize = 2.5 + (n.z + 1) * 0.8;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(n.x, n.y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      };

      // Back pass
      drawStrand(nodesA, colorA, true);
      drawStrand(nodesB, colorB, true);
      // Front pass
      drawStrand(nodesA, colorA, false);
      drawStrand(nodesB, colorB, false);

      offset += 0.025 * speed;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [width, height, colorA, colorB, speed, showRungs]);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <canvas ref={canvasRef} />
      {label && (
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
});

export default DNALoader;
