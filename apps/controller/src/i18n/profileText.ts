import type { SupportedLanguage } from "@open-party-lab/protocol";

const additionalProfileText = {
  "es": {
    title: "Tu nombre y selfie",
    name: "Nombre del jugador",
    changePhoto: "Cambiar foto del personaje",
    remove: "Quitar selfie",
    save: "Guardar perfil",
    saving: "Guardando…",
    preparing: "Preparando foto…",
    saved: "Perfil guardado.",
    photoError: "No se pudo leer la foto. Elige otra.",
    preview: "Selfie de tu personaje",
    reconnecting: "Se perdió la conexión. Reconectando…",
    hostOffline: "Se perdió la conexión con el anfitrión. Reconectando…",
  },
  "fr": {
    title: "Votre nom et votre selfie",
    name: "Nom du joueur",
    changePhoto: "Changer la photo du personnage",
    remove: "Retirer le selfie",
    save: "Enregistrer le profil",
    saving: "Enregistrement…",
    preparing: "Préparation de la photo…",
    saved: "Profil enregistré.",
    photoError: "Impossible de lire la photo. Choisissez-en une autre.",
    preview: "Selfie de votre personnage",
    reconnecting: "Connexion perdue. Reconnexion en cours…",
    hostOffline: "Connexion à l’hôte perdue. Reconnexion en cours…",
  },
  "pt-BR": {
    title: "Seu nome e sua selfie",
    name: "Nome do jogador",
    changePhoto: "Alterar foto do personagem",
    remove: "Remover selfie",
    save: "Salvar perfil",
    saving: "Salvando…",
    preparing: "Preparando foto…",
    saved: "Perfil salvo.",
    photoError: "Não foi possível ler a foto. Escolha outra.",
    preview: "Selfie do seu personagem",
    reconnecting: "Conexão perdida. Reconectando…",
    hostOffline: "Conexão com o anfitrião perdida. Reconectando…",
  },
};

export function getProfileText(language: SupportedLanguage = "de") {
  if (language !== "de" && language !== "en") return additionalProfileText[language];
  const en = language === "en";
  return {
    title: en ? "Your name & selfie" : "Dein Name & Selfie",
    name: en ? "Player name" : "Spielername",
    changePhoto: en ? "Change character photo" : "Charakterfoto ändern",
    remove: en ? "Remove selfie" : "Selfie entfernen",
    save: en ? "Save profile" : "Profil speichern",
    saving: en ? "Saving…" : "Wird gespeichert…",
    preparing: en ? "Preparing photo…" : "Foto wird vorbereitet…",
    saved: en ? "Profile saved." : "Profil gespeichert.",
    photoError: en ? "Could not read this photo. Please choose another." : "Das Foto konnte nicht gelesen werden. Bitte wähle ein anderes.",
    preview: en ? "Your character selfie" : "Dein Charakter-Selfie",
    reconnecting: en ? "Connection lost. Reconnecting automatically…" : "Verbindung unterbrochen. Wird automatisch wiederhergestellt…",
    hostOffline: en ? "Host connection lost. The host is reconnecting…" : "Host-Verbindung unterbrochen. Der Host verbindet sich erneut…"
  };
}
