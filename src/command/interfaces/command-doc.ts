export interface CommandDocFlag {
    name: string;
    type: 'boolean' | 'string' | 'number';
    required: boolean;
    description: string | undefined;
}

export interface CommandDoc {
    path: string[];
    description: string | undefined;
    flags: CommandDocFlag[];
}
