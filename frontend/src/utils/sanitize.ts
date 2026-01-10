import DOMPurify from 'dompurify'

export const sanitizeHtml = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
}
