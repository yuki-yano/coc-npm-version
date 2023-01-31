import { execSync } from "child_process";
import { CompleteResult, ExtensionContext, sources, workspace } from "coc.nvim";

type VersionsCache = {
  [packageName: string]: Array<string>;
};

const versionsCache: VersionsCache = {};

export const activate = async (context: ExtensionContext): Promise<void> => {
  context.subscriptions.push(
    sources.createSource({
      name: "npm",
      doComplete: async () => {
        const items = await getCompletionItems();
        return items;
      },
    }),
  );
};

const getCompletionItems = async (): Promise<CompleteResult> => {
  const fileName = await workspace.nvim.call("expand", ["%:t"]);
  if (fileName !== "package.json") {
    return { items: [] };
  }

  const state = await workspace.getCurrentState();

  const text = state.document.getText();
  const json = JSON.parse(text);
  const dependencies = Object.keys(json.dependencies ?? {});
  const devDependencies = Object.keys(json.devDependencies ?? {});

  const currentLine = await workspace.nvim.line;
  const match = /^\s*"(?<packageName>\S+)":\s"\S+",?$/.exec(currentLine);
  const packageName = match?.groups?.packageName;

  if (packageName == null) {
    return { items: [] };
  }

  if (![...dependencies, ...devDependencies].includes(packageName)) {
    return { items: [] };
  }

  if (versionsCache[packageName] == null) {
    const stdout = execSync(`yarn --silent info --json ${packageName}`, {
      encoding: "utf-8",
    });
    const versions = JSON.parse(stdout).data.versions as Array<string>;

    versionsCache[packageName] = versions;
  }

  let startCol: number | undefined;

  startCol = /\^/.exec(currentLine)?.index;
  if (startCol != null) {
    startCol = startCol + 1;
  }

  if (startCol == null) {
    startCol = /:\s"/.exec(currentLine)?.index;
    if (startCol != null) {
      startCol = startCol + 3;
    }
  }

  if (startCol == null) {
    return { items: [] };
  }

  return {
    items: [
      ...versionsCache[packageName].reverse().map((version) => ({
        word: version,
      })),
    ],
    startcol: startCol,
  };
};
