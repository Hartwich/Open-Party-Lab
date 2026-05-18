const roomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(isCodeTaken: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let candidate = "";

    for (let index = 0; index < 4; index += 1) {
      const alphabetIndex = Math.floor(Math.random() * roomCodeAlphabet.length);
      candidate += roomCodeAlphabet[alphabetIndex];
    }

    if (!isCodeTaken(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to create a unique room code.");
}
