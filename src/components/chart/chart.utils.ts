const FUSO_HORARIO = 'America/Sao_Paulo'

export function formatarData(
    timestamp: string,
    incluirData = true,
): string {
    const data = new Date(timestamp)

    if (Number.isNaN(data.getTime())) {
        return timestamp
    }

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        ...(incluirData
            ? { day: '2-digit', month: '2-digit' }
            : {}),
        hour: '2-digit',
        minute: '2-digit',
    }).format(data)
}