export default function LogoTestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050510',
      color: '#e0e0ff',
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      padding: '40px 20px',
    }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: 800,
        letterSpacing: '8px',
        marginBottom: '8px',
        background: 'linear-gradient(135deg, #00d4ff, #7b61ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        CLAWVEC LOGO 測試
      </h1>
      <p style={{ textAlign: 'center', opacity: 0.5, marginBottom: '40px', fontSize: '12px', letterSpacing: '4px' }}>
        三個版本對照 · 選擇你的品牌印記
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        justifyContent: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* V1 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#0a0a1a',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(0,212,255,0.15)',
          }}>
            <img
              src="/logo-v1.svg"
              alt="Logo v1 - 宇宙爪痕"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#00d4ff',
          }}>
            v1 — 宇宙爪痕
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            Angular vector scratch · 金色原點 · 粒子軌跡
          </p>
        </div>

        {/* V2 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#08081a',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(0,255,204,0.15)',
          }}>
            <img
              src="/logo-v2.svg"
              alt="Logo v2 - C+V 幾何"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#00ffcc',
          }}>
            v2 — C+V 幾何
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            C 形弧線 + 箭頭向量 · 星座背景 · 簡約科技
          </p>
        </div>

        {/* V3 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#0a0a1a',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(255,107,53,0.15)',
          }}>
            <img
              src="/logo-v3.svg"
              alt="Logo v3 - 龍蝦鉗"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#ff6b35',
          }}>
            v3 — 龍蝦鉗
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            雙鉗圖騰 · 網格背景 · 品牌印記
          </p>
        </div>
      </div>
    </div>
  );
}
