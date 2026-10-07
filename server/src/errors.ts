export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, message, fields);
export const unauthorized = (message = "Sessão inválida ou expirada.") => new HttpError(401, message);
export const forbidden = (message = "Não tem permissão para esta ação.") => new HttpError(403, message);
export const notFound = (message = "Não encontrado.") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
