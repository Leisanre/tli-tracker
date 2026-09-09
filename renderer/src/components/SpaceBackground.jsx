import { useEffect, useRef } from 'react';

function Constellation({ className, dataDepth, viewBox, points, corner }) {
  return (
    <svg
      className={className}
      data-depth={dataDepth}
      viewBox={viewBox}
      preserveAspectRatio={corner ? 'xMaxYMax slice' : 'xMinYMid slice'}
      aria-hidden="true"
    >
      {points.lines.map((pts, i) => (
        <polyline key={i} className="c-line" points={pts} />
      ))}
      {points.stars.map(([cx, cy, r], i) => (
        <circle key={i} className="c-star c-pulse" cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}

export default function SpaceBackground() {
  const dustLayerRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // ambient dust — grid-jittered so every region of the screen gets some, corners included
    const dustLayer = dustLayerRef.current;
    const COLS = 9;
    const ROWS = 6;
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const d = document.createElement('div');
        d.className = 'dust';
        const size = 1.5 + Math.random() * 2.5;
        d.style.width = `${size}px`;
        d.style.height = `${size}px`;
        const cellW = 100 / COLS;
        const cellH = 100 / ROWS;
        d.style.left = `${col * cellW + Math.random() * cellW}vw`;
        d.style.top = `${row * cellH + Math.random() * cellH}vh`;
        d.style.setProperty('--dust-op', (0.2 + Math.random() * 0.4).toFixed(2));
        d.style.setProperty('--dust-dx', `${20 + Math.random() * 60}px`);
        d.style.setProperty('--dust-dy', `${-(300 + Math.random() * 300)}px`);
        d.style.animationDuration = `${18 + Math.random() * 22}s`;
        d.style.animationDelay = `${-Math.random() * 30}s`;
        fragment.appendChild(d);
      }
    }
    dustLayer.appendChild(fragment);

    // mouse parallax: near layers (bigger data-depth) travel further than far ones
    const layers = Array.from(document.querySelectorAll('[data-depth]'));
    layers.forEach((el) => {
      el.style.transition = 'transform 500ms cubic-bezier(.2,.7,.2,1)';
    });
    let ticking = false;
    const onMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((el) => {
          const depth = parseFloat(el.getAttribute('data-depth')) || 10;
          el.style.transform = `translate(${-nx * depth}px, ${-ny * depth}px)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      dustLayer.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div className="parallax pw-a" data-depth="70">
        <div className="breathe">
          <div className="blob blob-a" />
        </div>
      </div>
      <div className="parallax pw-b" data-depth="45">
        <div className="breathe">
          <div className="blob blob-b" />
        </div>
      </div>
      <div className="parallax pw-c" data-depth="95">
        <div className="breathe">
          <div className="blob blob-c" />
        </div>
      </div>
      <div className="parallax pw-d" data-depth="30">
        <div className="breathe">
          <div className="blob blob-d" />
        </div>
      </div>
      <div className="dust-layer" ref={dustLayerRef} />
      <div className="grain" />

      <Constellation
        className="constellation"
        dataDepth="18"
        viewBox="0 0 460 900"
        points={{
          lines: [
            '60,120 130,210 95,340 190,300 240,430 170,540 220,660 130,760',
            '95,340 40,420 60,540',
            '190,300 260,250 320,300',
          ],
          stars: [
            [60, 120, 2.6],
            [130, 210, 2],
            [95, 340, 3],
            [40, 420, 1.8],
            [60, 540, 2.2],
            [190, 300, 2.4],
            [260, 250, 1.8],
            [320, 300, 2],
            [240, 430, 2.6],
            [170, 540, 2],
            [220, 660, 2.8],
            [130, 760, 2.2],
          ],
        }}
      />
      <Constellation
        className="constellation constellation-corner"
        dataDepth="14"
        viewBox="0 0 300 260"
        corner
        points={{
          lines: ['200,60 250,110 220,170'],
          stars: [
            [200, 60, 2],
            [250, 110, 1.6],
            [220, 170, 2.2],
          ],
        }}
      />
    </>
  );
}
