// Usage:
//   <DNALoader />                              — full width, horizontal
//   <DNALoader height={80} speed={1.5} />      — taller, faster
//   <DNALoader colorA="#6366f1" colorB="#22c55e" />

import { useEffect, useRef, memo } from 'react';

const DNALoader = memo(function DNALoader({
  height = 60,
  colorA = '#6366f1',
  colorB = '#22c55e',
  speed = 1,
  showRungs = true,
  label,
  className
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let animId;
    let offset = 0;

    const resize = () => {
      const w = container.offsetWidth;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      const cy = h / 2;
      const amplitude = h * 0.32;
      const spacing = 12;
      // Extra nodes beyond edges for seamless loop
      const extra = 4;
      const totalNodes = Math.ceil(w / spacing) + extra * 2;
      // Seamless: offset wraps around one full wave period
      const wavePeriod = (2 * Math.PI);
      const normalizedOffset = offset % wavePeriod;

      const nodesA = [];
      const nodesB = [];

      for (let i = -extra; i < totalNodes - extra; i++) {
        const x = i * spacing;
        const t = (i / totalNodes) * Math.PI * 6 + normalizedOffset;
        const yA = cy + Math.sin(t) * amplitude;
        const yB = cy + Math.sin(t + Math.PI) * amplitude;
        const zA = Math.cos(t);
        const zB = Math.cos(t + Math.PI);

        nodesA.push({ x, y: yA, z: zA });
        nodesB.push({ x, y: yB, z: zB });

        // Rungs
        if (showRungs && i >= 0 && x <= w) {
          const avgZ = ((zA + zB) / 2 + 1) / 2;
          const rungOpacity = avgZ * 0.25;
          ctx.save();
          ctx.strokeStyle = `rgba(148, 163, 184, ${rungOpacity})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(x, yA);
          ctx.lineTo(x, yB);
          ctx.stroke();
          ctx.restore();
        }
      }

      const drawStrand = (nodes, color, isBack) => {
        const filtered = nodes.filter(n => isBack ? n.z < 0 : n.z >= 0);
        if (filtered.length < 2) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = isBack ? 0.25 : 0.9;
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
            if (n.x < -10 || n.x > w + 10) continue;
            const dotSize = 2 + (n.z + 1) * 0.7;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7 + n.z * 0.3;
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

      // Fade edges for seamless look
      const fadeW = 30;
      const grad1 = ctx.createLinearGradient(0, 0, fadeW, 0);
      grad1.addColorStop(0, 'rgba(15, 17, 23, 1)');
      grad1.addColorStop(1, 'rgba(15, 17, 23, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, fadeW, h);

      const grad2 = ctx.createLinearGradient(w - fadeW, 0, w, 0);
      grad2.addColorStop(0, 'rgba(15, 17, 23, 0)');
      grad2.addColorStop(1, 'rgba(15, 17, 23, 1)');
      ctx.fillStyle = grad2;
      ctx.fillRect(w - fadeW, 0, fadeW, h);

      offset += 0.03 * speed;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [height, colorA, colorB, speed, showRungs]);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      {label && (
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
});

export default DNALoader;
