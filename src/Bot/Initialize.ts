import Bot from "./Bot";
import {readdirSync} from "fs";
import {ApplicationCommandDataResolvable, ButtonInteraction, ChatInputCommandInteraction, Collection, Interaction, ModalSubmitInteraction, SelectMenuInteraction} from "discord.js";
import Button from "../Structures/Button";
import SlashCommand from "../Structures/SlashCommand";
import Modal from "../Structures/Modal";
import SelectMenu from "../Structures/SelectMenu";
import Event from "../Structures/Event";

const slashCommands = new Collection<string, SlashCommand>();
const buttons = new Collection<string, Button>();
const modals = new Collection<string, Modal>();
const selectMenus = new Collection<string, SelectMenu>();

export default function Initialize(bot: Bot): void {
    bot.on("interactionCreate", async (interaction: Interaction): Promise<void> => {
        if (interaction instanceof ChatInputCommandInteraction) {
            const slashCommand: SlashCommand | undefined = slashCommands.get(interaction.commandName);
            if (slashCommand === undefined) return;
            await slashCommand.onInteract(bot, interaction);
        } else if (interaction instanceof ButtonInteraction) {
            const button: Button | undefined = buttons.get(interaction.customId);
            if (button === undefined) return;
            await button.onInteract(bot, interaction);
        } else if (interaction instanceof ModalSubmitInteraction) {
            const modal: Modal | undefined = modals.get(interaction.customId);
            if (modal === undefined) return;
            await modal.onInteract(bot, interaction);
        } else if (interaction instanceof SelectMenuInteraction) {
            const selectMenu: SelectMenu | undefined = selectMenus.get(interaction.customId);
            if (selectMenu === undefined) return;
            await selectMenu.onInteract(bot, interaction);
        }
    });
    const slashCommandData: ApplicationCommandDataResolvable[] = [];
    bot.on("ready", () => {
        bot.application?.commands.cache.clear();
        bot.application?.commands.set(slashCommandData);
    });
    readdirSync("./src/Functions")
        .filter(folderName => !folderName.endsWith(".ts"))
        .forEach(folderName => {
            readdirSync(`./src/Functions/${folderName}`)
                .filter(fileName => fileName.endsWith(".ts"))
                .forEach(fileName => {
                    const file: Button | SlashCommand | Modal | SelectMenu | Event = require(`../Functions/${folderName}/${fileName}`).default;
                    if (file instanceof Event) {
                        bot.on(file.eventName, (...args) => file.onCall(bot, ...args));
                    } else if (file instanceof SlashCommand) {
                        slashCommands.set(file.slashCommand.name, file);
                        slashCommandData.push(file.slashCommand.toJSON());
                    } else if (file instanceof Button) {
                        buttons.set(file.customId, file);
                    } else if (file instanceof Modal) {
                        modals.set(file.customId, file);
                    } else if (file instanceof SelectMenu) {
                        selectMenus.set(file.customId, file);
                    }
                });
        });
}
