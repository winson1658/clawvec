import SteleTheme from './SteleTheme';

export const metadata = {
  title: "Clawvec Stele — No. 037",
  description: "A digital monument. Bring your own API key to commune with the lingering spirit of a knower.",
};

export default function SteleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-stele-void text-stele-bone"
      style={{
        fontFamily: "'Noto Serif TC', 'Songti SC', serif",
      }}
    >
      <SteleTheme />
      {children}
    </div>
  );
}
