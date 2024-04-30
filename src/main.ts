import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { getDateForPageWithoutBrackets } from "logseq-dateutils";

function main() {
  logseq.DB.onChanged(async (e) => {
    const taskBlock = e.blocks.find((block) => block.marker === "DONE");
    if (!taskBlock) {
      return;
    }

    if (
      e.txData.find(
        (tx) => tx[1] === "block/marker" && tx[2] === "DONE" && tx[4] === true
      )
    ) {
      const todayTitle = getDateForPageWithoutBrackets(
        new Date(),
        (await logseq.App.getUserConfigs()).preferredDateFormat.replace(
          /E{1,3}/,
          "EEE"
        )
      );

      const findOrCreateParent = async (title: string) => {
        let targetBlock = (
          await logseq.Editor.getPageBlocksTree(todayTitle)
        ).find((block) => block.content === title);
        if (!targetBlock) {
          targetBlock =
            (await logseq.Editor.appendBlockInPage(todayTitle, title)) ??
            undefined;
        }

        return targetBlock;
      };

      const targetBlock = await findOrCreateParent(
        logseq.settings!.taskLogHeading as string
      );
      
      if (targetBlock) {
        await logseq.Editor.insertBlock(
          targetBlock.uuid,
          `((${taskBlock.uuid}))`,
          {
            isPageBlock: false,
            sibling: false,
            before: false,
          }
        );
      }
    }
  });
}

const settings: SettingSchemaDesc[] = [
  {
    key: "taskLogHeading",
    description: "The heading to put completed tasks under (including #)",
    type: "string",
    default: "# Completed Tasks",
    title: "Completed Tasks Heading",
  },
];

logseq.useSettingsSchema(settings);
logseq.ready(main).catch(console.error);
