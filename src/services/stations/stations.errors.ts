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

export class StationForbiddenError extends Error {
  constructor(message = 'Acesso negado. Perfil insuficiente para esta ação.') {
    super(message)
    this.name = 'StationForbiddenError'
    Object.setPrototypeOf(this, StationForbiddenError.prototype)
  }
}
