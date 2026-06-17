export function parseLiteralNames(token: string): string[] {
    const aliasStart = token.indexOf('(');
    if (aliasStart === -1) return [token];
    return [token.slice(0, aliasStart), ...token.slice(aliasStart + 1, -1).split(',')];
}
