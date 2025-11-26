import { ChatInputCommandInteraction, SlashCommandBuilder, Client, AutocompleteInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | any; // any for now as SlashCommandBuilder can be complex with subcommands
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface Event {
    name: string;
    once?: boolean;
    execute: (...args: any[]) => Promise<void> | void;
}
