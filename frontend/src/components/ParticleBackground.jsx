// frontend/src/components/ParticleBackground.jsx
import Particles from "react-particles";
import { loadFull } from "tsparticles";

export default function ParticleBackground() {
  const particlesInit = async (engine) => {
    // loads all features so options work as expected
    await loadFull(engine);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,          // behind your cards
        pointerEvents: "none" // let clicks pass through
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: { value: 35 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 1.2 },
            links: { enable: true, opacity: 0.25, distance: 140 },
            color: { value: "#65d6a6" },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}