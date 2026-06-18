export function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (c, i) => i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`);
}
