import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Campo, Formulario } from "@/components/formulario";
import { EstadoCoberturaBadge } from "@/components/mascota/cobertura";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buscarMascotas } from "@/lib/atencion/consultas";
import { interpretarBusqueda, MENSAJE_BUSQUEDA_CORTA, POR_PAGINA } from "@/lib/atencion/reglas";
import { formatearAfiliado } from "@/lib/mascotas/validacion";
import { usuarioDePagina } from "@/lib/pagina";
import { ahora } from "@/lib/tiempo";
import { elegirDuenoPorDni } from "./acciones-atencion";

// CU-37 Buscar mascota: pantalla de inicio del veterinario. También la usa el administrador.
export default async function PaginaMascotas({ searchParams }: PageProps<"/mascotas">) {
  const acceso = await usuarioDePagina("consulta");
  if (!acceso.usuario) return <Aviso tipo="error">{acceso.error}</Aviso>;
  const { usuario } = acceso;

  const parametros = await searchParams;
  const q = typeof parametros.q === "string" ? parametros.q : "";
  const pagina = Math.max(1, Number(parametros.pagina) || 1);
  const criterio = q.trim() ? interpretarBusqueda(q) : null;

  let busqueda: Awaited<ReturnType<typeof buscarMascotas>> | null = null;
  if (criterio && criterio.tipo !== "invalido") {
    busqueda = await buscarMascotas(criterio, pagina, ahora());
    // FA-01: un número de afiliado exacto abre directamente la ficha.
    if (criterio.tipo === "afiliado" && busqueda.total === 1) redirect(`/mascotas/${busqueda.resultados[0].id}`);
  }
  const paginas = busqueda ? Math.max(1, Math.ceil(busqueda.total / POR_PAGINA)) : 1;
  const enlacePagina = (n: number) => `/mascotas?q=${encodeURIComponent(q)}&pagina=${n}`;

  // CU-01 paso 10: aviso al entrar por primera vez desde la invitación.
  const vinculada = parametros.vinculada;
  const avisoVinculacion =
    vinculada === "reemplazo"
      ? "Tu cuenta quedó vinculada. Desde ahora ingresá con Google; la cuenta anterior ya no permite ingresar."
      : vinculada
        ? "Tu cuenta quedó vinculada. Desde ahora ingresá con Google."
        : null;

  return (
    <div className="space-y-6">
      {avisoVinculacion && <Aviso tipo="exito">{avisoVinculacion}</Aviso>}
      <Encabezado
        titulo="Mascotas"
        descripcion="Buscá por número de afiliado, DNI del dueño, nombre de la mascota o apellido del dueño."
      />

      <form action="/mascotas" className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Ej.: 000123, 30111222, Luna o Gómez" aria-label="Buscar mascota" autoFocus />
        <Button type="submit">Buscar</Button>
      </form>

      {criterio?.tipo === "invalido" && <Aviso tipo="error">{MENSAJE_BUSQUEDA_CORTA}</Aviso>}
      {busqueda && busqueda.total === 0 && <Aviso tipo="info">No se encontraron mascotas con esos datos.</Aviso>}

      {busqueda && busqueda.total > 0 && (
        <Card>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {busqueda.total === 1 ? "1 mascota encontrada" : `${busqueda.total} mascotas encontradas`}
              {paginas > 1 && ` · página ${pagina} de ${paginas}`}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota</TableHead>
                  <TableHead className="hidden sm:table-cell">Afiliado</TableHead>
                  <TableHead className="hidden md:table-cell">Dueño</TableHead>
                  <TableHead>Cobertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {busqueda.resultados.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-normal">
                      <Link href={`/mascotas/${m.id}`} className="font-medium underline-offset-4 hover:underline">
                        {m.nombre}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {[m.especie, m.raza].filter(Boolean).join(" · ")}
                        <span className="sm:hidden"> · N.º {formatearAfiliado(m.numeroAfiliado)}</span>
                        <span className="md:hidden"> · {m.dueno}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatearAfiliado(m.numeroAfiliado)}</TableCell>
                    <TableCell className="hidden md:table-cell">{m.dueno}</TableCell>
                    <TableCell>
                      <EstadoCoberturaBadge estado={m.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {paginas > 1 && (
              <nav className="flex flex-wrap items-center gap-2" aria-label="Páginas">
                {pagina > 1 && (
                  <Link href={enlacePagina(pagina - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Anterior
                  </Link>
                )}
                {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={enlacePagina(n)}
                    aria-current={n === pagina ? "page" : undefined}
                    className={buttonVariants({ variant: n === pagina ? "default" : "ghost", size: "sm" })}
                  >
                    {n}
                  </Link>
                ))}
                {pagina < paginas && (
                  <Link href={enlacePagina(pagina + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Siguiente
                  </Link>
                )}
              </nav>
            )}
          </CardContent>
        </Card>
      )}

      {usuario.rol === "administrador" && (
        <Card>
          <CardContent>
            <Formulario accion={elegirDuenoPorDni} textoBoton="Dar de alta mascota" className="sm:flex sm:items-end sm:gap-3 sm:space-y-0">
              <Campo etiqueta="Nueva mascota: DNI del dueño" htmlFor="dni" className="sm:flex-1">
                <Input id="dni" name="dni" inputMode="numeric" placeholder="Ej.: 30111222" />
              </Campo>
            </Formulario>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
