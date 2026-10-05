// Resultado de las acciones de personas que pueden entregar un enlace de invitación.
// El enlace no pasa por la URL ni se guarda: viaja solo en la respuesta y se muestra en ese momento.

export type EnlaceDeInvitacion = {
  url: string;
  venceEn: string; // fecha y hora ISO
};

export type ResultadoConEnlace =
  | { ok: true; mensaje: string; enlace?: EnlaceDeInvitacion }
  | { ok: false; error: string }
  | null;
