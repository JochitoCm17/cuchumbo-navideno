'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, Users, CheckCircle2, Clock, ShieldCheck, Heart } from 'lucide-react';

interface Participante {
  id: string;
  nombre: string;
  ya_giro: boolean;
  pista_regalo?: string;
}

const COLORES_RULETA = [
  '#dc2626', '#059669', '#d97706',
  '#991b1b', '#047857', '#b45309',
];

function reproducirSonidoVictoria() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notas = [523.25, 659.25, 783.99, 1046.5];
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch {}
}

export default function CuchumboPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState('');
  const [pistaRegalo, setPistaRegalo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pasoListoParaGirar, setPasoListoParaGirar] = useState(false);
  const [girando, setGirando] = useState(false);
  const [rotacion, setRotacion] = useState(0);
  const [resultado, setResultado] = useState<{ nombre: string; pista: string | null } | null>(null);

  useEffect(() => {
    obtenerDatos();
    const intervalo = setInterval(obtenerDatos, 3500);
    return () => clearInterval(intervalo);
  }, []);

  async function obtenerDatos() {
    try {
      const res = await fetch('/api/cuchumbo');
      const data = await res.json();
      if (data.participantes) setParticipantes(data.participantes);
    } catch {}
  }

  function confirmarDatos(e: React.FormEvent) {
    e.preventDefault();
    const user = participantes.find((p) => p.id === seleccionadoId);
    if (!user) return;
    if (user.ya_giro) {
      setErrorMsg('🔒 Este turno ya fue usado. No se puede volver a entrar.');
      return;
    }
    setErrorMsg('');
    setPasoListoParaGirar(true);
  }

  async function girarRuleta() {
    if (girando || resultado || !seleccionadoId) return;
    setGirando(true);
    setErrorMsg('');

    const res = await fetch('/api/cuchumbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'girar',
        id: seleccionadoId,
        pista_regalo: pistaRegalo,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setGirando(false);
      setErrorMsg(data.error);
      obtenerDatos();
      return;
    }

    const vueltasExtra = 360 * 7;
    const indiceObjetivo = participantes.findIndex((p) => p.nombre === data.amigo_secreto);
    const gradosPorSegmento = 360 / Math.max(participantes.length, 1);
    const anguloFinal =
      vueltasExtra + (360 - Math.max(indiceObjetivo, 0) * gradosPorSegmento - gradosPorSegmento / 2);

    setRotacion(anguloFinal);

    setTimeout(() => {
      setGirando(false);
      setResultado({
        nombre: data.amigo_secreto,
        pista: data.pista_receptor,
      });
      reproducirSonidoVictoria();
      obtenerDatos();

      confetti({
        particleCount: 160,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#10b981', '#f59e0b', '#ffffff'],
      });
    }, 5000);
  }

  const gradienteRuleta =
    participantes.length > 0
      ? `conic-gradient(${participantes
          .map((_, idx) => {
            const inicio = (idx * 100) / participantes.length;
            const fin = ((idx + 1) * 100) / participantes.length;
            const color = COLORES_RULETA[idx % COLORES_RULETA.length];
            return `${color} ${inicio}% ${fin}%`;
          })
          .join(', ')})`
      : '#1e293b';

  const totalYaGiraron = participantes.filter((p) => p.ya_giro).length;
  const usuarioActual = participantes.find((p) => p.id === seleccionadoId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-950 via-slate-950 to-emerald-950 text-white p-4 md:p-8 relative overflow-hidden">
      <style jsx global>{`
        @keyframes caerNieve {
          0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px); opacity: 0.2; }
        }
        .copo-nieve {
          position: fixed;
          top: -10px;
          color: white;
          user-select: none;
          pointer-events: none;
          z-index: 50;
          animation: caerNieve linear infinite;
        }
      `}</style>

      {[...Array(22)].map((_, i) => (
        <div
          key={i}
          className="copo-nieve text-opacity-60"
          style={{
            left: `${(i * 4.7) % 100}%`,
            fontSize: `${(i % 3) * 6 + 10}px`,
            animationDuration: `${(i % 5) + 6}s`,
            animationDelay: `${(i % 4) * 1.2}s`,
          }}
        >
          ❄
        </div>
      ))}

      <div className="max-w-5xl mx-auto text-center space-y-2 mb-8 pt-2 relative z-10">
        <div className="inline-flex items-center gap-2 bg-red-900/60 border border-red-700/50 px-4 py-1.5 rounded-full text-amber-300 text-sm font-medium shadow-lg">
          <Sparkles size={16} /> Gran Cuchumbo Familiar • {participantes.length} Miembros
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow">
          🎄 Ruleta Navideña 🎁
        </h1>
        <p className="text-slate-300 text-sm md:text-base">
          Elegí tu nombre, anotá una pista de qué te gustaría recibir y girá. <strong className="text-amber-300">¡Solo tenés 1 intento!</strong>
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-6 items-start relative z-10">
        <div className="md:col-span-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {!pasoListoParaGirar ? (
            <form onSubmit={confirmarDatos} className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-lg">
                  <Heart size={20} /> Anotá tus datos
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" /> 1 giro único
                </span>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  1. ¿Quién sos?
                </label>
                <select
                  value={seleccionadoId}
                  onChange={(e) => {
                    setSeleccionadoId(e.target.value);
                    setErrorMsg('');
                  }}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Seleccioná tu nombre de la lista...</option>
                  {participantes.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.ya_giro}>
                      {p.nombre} {p.ya_giro ? '🔒 (Ya participó)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  2. Pista para tu amigo secreto (talla, color favorito o qué te gustaría)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Talla M, me gustan los chocolates, perfumes o gorras..."
                  value={pistaRegalo}
                  onChange={(e) => setPistaRegalo(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {errorMsg && (
                <p className="text-red-300 text-sm bg-red-950/80 border border-red-700/60 p-3.5 rounded-xl">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-red-950 transition"
              >
                Continuar a la Ruleta 🎅
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">
                  Turno de: <strong className="text-white">{usuarioActual?.nombre}</strong>
                </span>
                {resultado && (
                  <button
                    onClick={() => {
                      setPasoListoParaGirar(false);
                      setSeleccionadoId('');
                      setPistaRegalo('');
                      setResultado(null);
                      setRotacion(0);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1 rounded-lg transition"
                  >
                    Finalizar y bloquear turno 🔒
                  </button>
                )}
              </div>

              <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />

                <div
                  style={{
                    background: gradienteRuleta,
                    transform: `rotate(${rotacion}deg)`,
                    transition: girando
                      ? 'transform 5s cubic-bezier(0.12, 0.88, 0.22, 1)'
                      : 'none',
                  }}
                  className="w-full h-full rounded-full border-[5px] border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] relative overflow-hidden"
                >
                  {participantes.map((p, idx) => {
                    const angulo = (360 / participantes.length) * idx + 360 / participantes.length / 2;
                    return (
                      <div
                        key={p.id}
                        style={{ transform: `rotate(${angulo}deg)` }}
                        className="absolute inset-0 flex justify-center pt-3"
                      >
                        <span
                          style={{ writingMode: 'vertical-rl' }}
                          className="text-[10px] font-bold uppercase tracking-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] max-h-24 overflow-hidden"
                        >
                          {p.nombre.slice(0, 11)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute w-16 h-16 bg-slate-950 border-4 border-amber-400 rounded-full flex items-center justify-center z-10 shadow-xl">
                  <Gift className="text-amber-400 animate-bounce" size={24} />
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-300 text-sm bg-red-950/80 border border-red-700/60 p-3 rounded-xl w-full">
                  {errorMsg}
                </p>
              )}

              {!resultado ? (
                <button
                  onClick={girarRuleta}
                  disabled={girando}
                  className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-950 font-extrabold py-4 rounded-2xl text-lg shadow-lg hover:brightness-110 disabled:opacity-60 transition cursor-pointer"
                >
                  {girando ? '🎄 Mezclando la suerte navideña...' : '¡GIRAR RULETA! (1 solo intento) 🎲'}
                </button>
              ) : (
                <div className="w-full bg-gradient-to-br from-emerald-900/95 to-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-3 shadow-2xl">
                  <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                    ✨ ¡Te tocó regalarle a! ✨
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-white">
                    🎁 {resultado.nombre} 🎁
                  </p>
                  {resultado.pista && (
                    <div className="bg-slate-950/70 border border-emerald-700/50 rounded-xl p-3 text-sm text-emerald-200">
                      💡 <strong>Su pista de regalo:</strong> &ldquo;{resultado.pista}&rdquo;
                    </div>
                  )}
                  <p className="text-xs text-amber-200/90 bg-slate-950/60 p-2.5 rounded-xl">
                    📸 <strong>¡Tomale captura ahorita!</strong> Tu turno ya quedó bloqueado y no podrás volver a abrirlo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-lg flex items-center gap-2 text-emerald-400">
              <Users size={20} /> En vivo ({totalYaGiraron}/{participantes.length})
            </h2>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full animate-pulse">
              ● Tiempo real
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-500"
              style={{
                width: `${participantes.length ? (totalYaGiraron / participantes.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {participantes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5 rounded-xl"
              >
                <span className="font-medium text-sm">{p.nombre}</span>
                {p.ya_giro ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Listo
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={14} /> Falta
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}