/** Erro com status HTTP: o tratador de erros do app responde `{ error: message }` com esse status. */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
