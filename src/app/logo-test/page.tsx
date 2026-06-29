export default function LogoTestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      color: '#0f172a',
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      padding: '40px 20px',
    }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: 800,
        letterSpacing: '8px',
        marginBottom: '8px',
        color: '#0f172a',
      }}>
        CLAWVEC LOGO — C 系列
      </h1>
      <p style={{ textAlign: 'center', opacity: 0.5, marginBottom: '40px', fontSize: '12px', letterSpacing: '4px' }}>
        白色背景 · 以 C 發想 · 三個方向
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        justifyContent: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* C1 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <img
              src="/logo-c1.svg"
              alt="Logo C1 - 爪痕C"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#0f172a',
          }}>
            C1 — 爪痕 C
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            C 形被三道白色爪痕打斷 · 紅色箭頭射出 · 粒子尾隨
          </p>
        </div>

        {/* C2 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <img
              src="/logo-c2.svg"
              alt="Logo C2 - 鉗C"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#0f172a',
          }}>
            C2 — 鉗 C
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            粗體 C + 紅色雙鉗伸展 · 中心粒子上浮 · 極簡有力
          </p>
        </div>

        {/* C3 */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <img
              src="/logo-c3.svg"
              alt="Logo C3 - 網絡C"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h2 style={{
            marginTop: '16px',
            fontSize: '16px',
            letterSpacing: '4px',
            color: '#0f172a',
          }}>
            C3 — 網絡 C
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, lineHeight: 1.6 }}>
            C 形框架 + 內部向量網路 · 節點互相連結 · 科技感
          </p>
        </div>
      </div>
    </div>
  );
}
