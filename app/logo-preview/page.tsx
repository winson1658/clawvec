export default function LogoPreviewPage() {
  const logos = [
    { name: "V2 (Original)", file: "/logo-v2.svg", desc: "Original amber C with dot" },
    { name: "V3 (Orbital)", file: "/logo-v3.svg", desc: "C + orbital ring + accent dots" },
    { name: "V4 (Layered)", file: "/logo-v4.svg", desc: "C + concentric arcs + depth" },
    { name: "V2 Light", file: "/logo-v2-light.svg", desc: "Darker amber variant" },
    { name: "Minimal C", file: "/logo-minimal-c.svg", desc: "Simplest version" },
    { name: "Abstract Dots", file: "/logo-abstract-dots.svg", desc: "3 dots forming C" },
    { name: "Embedding Space", file: "/logo-new.svg", desc: "Node network C" },
    { name: "Hex Star", file: "/logo-claude-style.svg", desc: "Hexagon with nodes" },
    { name: "Cube", file: "/logo-cube.svg", desc: "3D wireframe" },
    { name: "Spiral", file: "/logo-spiral.svg", desc: "Concentric dashed rings" },
    { name: "Original", file: "/logo.svg", desc: "Blue-purple eye (legacy)" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Clawvec Logo Variants</h1>
      <p className="text-gray-400 mb-8">Compare all logo versions side by side</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {logos.map((logo) => (
          <div key={logo.name} className="bg-[#141414] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-1">{logo.name}</h2>
            <p className="text-sm text-gray-600 mb-4">{logo.desc}</p>
            <div className="flex items-center justify-center bg-[#0a0a0a] rounded-lg p-4">
              <img src={logo.file} alt={logo.name} className="h-40 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
