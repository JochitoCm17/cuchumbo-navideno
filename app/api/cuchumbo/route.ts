import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('participantes')
    .select('id, nombre, ya_giro, pista_regalo')
    .order('nombre', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ participantes: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;

  if (action === 'cargar26') {
    const FAMILIA_26 = [
      "Tío Ronal", "Nicole", "Mati", "Tete", "Ariel", "Mami Sasaa",
      "Josué/Fran", "Ivonne", "Jochito", "Rocio", "Tía Jaky", "Yahel",
      "Don Serch", "Nina", "Víctor", "Liz", "Lucas", "Fátima",
      "Huguito", "Jorge", "Corina", "Fran", "Tío Jose", "Génesis",
      "Eliud", "Josué"
    ];
    const nuevos = FAMILIA_26.map((nombre) => ({ nombre, pin: '0000' }));
    const { error } = await supabase.from('participantes').insert(nuevos);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'agregar') {
    const { error } = await supabase
      .from('participantes')
      .insert([{ nombre: body.nombre, pin: '0000' }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'eliminar') {
    const { error } = await supabase.from('participantes').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'sortear') {
    const { data: lista } = await supabase.from('participantes').select('*');
    if (!lista || lista.length < 3) {
      return NextResponse.json({ error: 'Necesitás al menos 3 participantes.' }, { status: 400 });
    }

    const nombres = lista.map((p) => p.nombre);
    const exclusiones: { de: string; a: string }[] = body.exclusiones || [];
    let asignacionValida: Record<string, string> | null = null;

    for (let intento = 0; intento < 5000; intento++) {
      const mezclados = [...nombres].sort(() => Math.random() - 0.5);
      let valido = true;
      const mapa: Record<string, string> = {};

      for (let i = 0; i < nombres.length; i++) {
        const dador = nombres[i];
        const receptor = mezclados[i];
        if (dador === receptor || exclusiones.some((ex) => ex.de === dador && ex.a === receptor)) {
          valido = false;
          break;
        }
        mapa[dador] = receptor;
      }
      if (valido) {
        asignacionValida = mapa;
        break;
      }
    }

    if (!asignacionValida) {
      return NextResponse.json({ error: 'No se pudo generar con esas restricciones.' }, { status: 400 });
    }

    for (const p of lista) {
      await supabase
        .from('participantes')
        .update({
          amigo_secreto: asignacionValida[p.nombre],
          ya_giro: false,
          pista_regalo: null,
        })
        .eq('id', p.id);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'girar') {
    const { id, pista_regalo } = body;
    const { data: user } = await supabase
      .from('participantes')
      .select('*')
      .eq('id', id)
      .single();

    if (!user) return NextResponse.json({ error: 'Participante no encontrado.' }, { status: 404 });
    if (!user.amigo_secreto) return NextResponse.json({ error: 'El sorteo aún no ha sido generado.' }, { status: 400 });
    if (user.ya_giro) return NextResponse.json({ error: '🔒 Este turno ya fue usado y bloqueado.' }, { status: 403 });

    await supabase
      .from('participantes')
      .update({
        ya_giro: true,
        pista_regalo: pista_regalo?.trim() || '¡Sorpresa navideña! 🎁',
      })
      .eq('id', id);

    const { data: receptor } = await supabase
      .from('participantes')
      .select('pista_regalo')
      .eq('nombre', user.amigo_secreto)
      .single();

    return NextResponse.json({
      amigo_secreto: user.amigo_secreto,
      pista_receptor: receptor?.pista_regalo || null,
    });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}