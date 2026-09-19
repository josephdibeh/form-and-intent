import "../src/styles.css";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import tokens from "../src/system/tokens.json";
import { resolveToken } from "../src/system/contract";

for (const role of Object.keys(tokens.semantic))
  document.documentElement.style.setProperty(
    `--${role.replaceAll(".", "-")}`,
    resolveToken(role).value,
  );

export default { parameters: { layout: "centered" } };
