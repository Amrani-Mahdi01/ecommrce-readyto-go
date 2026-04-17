import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #09090b 0%, #18101f 50%, #09090b 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.18) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Logo text */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            position: 'relative',
          }}
        >
          Nexus
          <span style={{ color: '#a78bfa' }}>PC</span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(161,161,170,0.8)',
            marginTop: 16,
            position: 'relative',
          }}
        >
          Algeria&apos;s #1 PC Parts Store
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
