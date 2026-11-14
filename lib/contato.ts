// PENDENTE (SPEC §9): número definitivo do WhatsApp, com 55 + DDD + número.
export const NUMERO_WHATSAPP = '5547988420692'

export const MENSAGEM_WHATSAPP = 'Oi Lucas, vi seu site e quero conversar sobre um site para meu negócio.'

export function linkWhatsApp(): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`
}
