/**
 * Erro de domínio lançado quando há conflito de identificador/código da estação.
 * Desacopla a camada de UI de códigos HTTP (409) e AxiosError.
 */
export class StationConflictError extends Error {
  constructor(message = 'Identificador de estação já cadastrado no sistema') {
    super(message)
    this.name = 'StationConflictError'
    Object.setPrototypeOf(this, StationConflictError.prototype)
  }
}

export class StationNotFoundError extends Error {
  constructor(message = 'Estação não encontrada.') {
    super(message)
    this.name = 'StationNotFoundError'
    Object.setPrototypeOf(this, StationNotFoundError.prototype)
  }
}
