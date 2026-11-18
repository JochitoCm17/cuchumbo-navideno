'use client';

import { useState, useEffect } from 'react';
import { Trash2, Shuffle, UserPlus, ShieldAlert, CheckCircle2, Users } from 'lucide-react';

interface Participante {
  id: string;
  nombre: string;
  ya_giro: boolean;
  pista_regalo?: string;
}

export default function AdminPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [nombre, setNombre] = useState('');
  const [exclusiones, setExclusiones] = useState<{ de: string; a: string }[]>([]);
  const [exDe, setExDe] = useState('');
  const [exA, setExA] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarParticipantes();
  }, []);

  async function cargarParticipantes() {
    const res = await fetch('/api/cuchumbo');
    const data = await res.json();
    if (data.participantes) setParticipantes(data.participantes);
  }

  async function cargarLos26() {
    setCargando(true);
    setMensaje('');
    const res = await fetch('/api/cuchumbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cargar26' }),
    });
    const data = await res.json();
    setCargando(false);
    if (data.error) {
      setMensaje(`❌ Error: ${data.error}`);
    } else {
      setMensaje('✅ ¡Los 26 familiares cargados!');
      cargarParticipantes();
    }
  }

  async function agregarParticipante(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    await fetch('/api/cuchumbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'agregar', nombre: nombre.trim() }),
    });
    setNombre('');
    cargarParticipantes();
  }

  async function eliminarParticipante(id: string) {
    await fetch('/api/cuchumbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eliminar', id }),
    });
    cargarParticipantes();
  }

  function agregarExclusion() {
    if (!exDe || !exA || exDe === exA) return;
    setExclusiones([...exclusiones, { de: exDe, a: exA }]);
    setExDe('');
    setExA('');
  }

  async function generarSorteo() {
    setMensaje('⏳ Mezclando nombres...');
    const res = await fetch('/api/cuchumbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sortear', exclusiones }),
    });
    const data = await res.json();
    if (data.error) {
      setMensaje(`❌ ${data.error}`);
    } else {
      setMensaje('🎄 ¡Sorteo listo! Ya podés compartir el link principal con la familia.');
      cargarParticipantes();
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-red-500">🎅 Panel Admin - Cuchumbo</h1>
            <p className="text-slate-400 text-sm mt-1">
              Cargá a los 26 familiares y generá el sorteo secreto.
            </p>
          </div>
          {participantes.length === 0 && (
            <button
              onClick={cargarLos26}
              disabled={cargando}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
            >
              <Users size={18} /> {cargando ? 'Cargando...' : 'Cargar los 26 de un clic'}
            </button>
          )}
        </div>

        <form onSubmit={agregarParticipante} className="flex gap-2">
          <input
            type="text"
            placeholder="Agregar otro nombre..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <UserPlus size={20} /> Agregar
          </button>
        </form>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold text-lg text-amber-400">
            Participantes ({participantes.length})
          </h2>
          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto pr-2">
            {participantes.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.nombre}</span>
                  {p.ya_giro && (
                    <span className="ml-2 text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Ya participó
                    </span>
                  )}
                </div>
                <button
                  onClick={() => eliminarParticipante(p.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {participantes.length >= 3 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-amber-400 flex items-center gap-2">
              <ShieldAlert size={18} /> Restricciones (Opcional)
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={exDe}
                onChange={(e) => setExDe(e.target.value)}
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Esta persona...</option>
                {participantes.map((p) => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
              <span className="self-center text-sm text-slate-400">NO puede sacar a</span>
              <select
                value={exA}
                onChange={(e) => setExA(e.target.value)}
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Esta persona...</option>
                {participantes.map((p) => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={agregarExclusion}
                className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm font-medium"
              >
                Añadir regla
              </button>
            </div>
            {exclusiones.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {exclusiones.map((ex, i) => (
                  <span key={i} className="text-xs bg-red-950 text-red-300 border border-red-800 px-3 py-1 rounded-full">
                    {ex.de} ➔ ❌ {ex.a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={generarSorteo}
            className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Shuffle size={22} /> Generar / Reiniciar Sorteo Secreto
          </button>
          {mensaje && (
            <p className="text-center font-medium text-amber-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
              {mensaje}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}