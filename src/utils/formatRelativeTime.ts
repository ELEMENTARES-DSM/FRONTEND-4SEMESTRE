export function formatRelativeTime(
    minutos: number | null,
): string {
    if (minutos === null) {
        return 'Nunca comunicou'
    }

    if (minutos < 1) {
        return 'Agora'
    }

    if (minutos === 1) {
        return 'Há 1 minuto'
    }

    if (minutos < 60) {
        return `Há ${minutos} minutos`
    }

    const horas = Math.floor(minutos / 60)

    if (horas === 1) {
        return 'Há 1 hora'
    }

    if (horas < 24) {
        return `Há ${horas} horas`
    }

    const dias = Math.floor(horas / 24)

    if (dias === 1) {
        return 'Há 1 dia'
    }

    return `Há ${dias} dias`
}