import { astroLanguage } from "@flint.fyi/astro-language";
import { ruleCreator } from "./ruleCreator";
import type { AST } from "@flint.fyi/astro-language";

/*
  This rule reports any <style> define:vars that are declared but not used in an Astro component.
*/

function findStyleVars(ast: AST.AstroFile): Set<string> {
  // Look for <style define:vars={...}> in the frontmatter or template
  // This is a placeholder; use Astro parser utilities for actual implementation
  return new Set(); // To be implemented
}

function findUsedVars(ast: AST.AstroFile): Set<string> {
  // Traverse the template and collect identifiers/expressions using style vars
  // Placeholder logic: implement proper traversal for actual rule
  return new Set(); // To be implemented
}

export default ruleCreator.createRule(astroLanguage, {
  about: {
    description: "Reports <style> define:vars declared but not used.",
    id: "unusedStyleDefineVars",
    presets: ["recommended", "stylistic"],
  },
  messages: {
    unused: {
      primary: "Style variable '{{name}}' is defined but never used.",
      secondary: [
        "Defined variables should appear at least once in your template.",
        "Remove unused CSS variables to keep the code clean."
      ],
      suggestions: ["Remove the unused style variable."],
    },
  },
  setup(context) {
    return {
      visitors: {
        AstroFile(node) {
          const definedVars = findStyleVars(node);
          const usedVars = findUsedVars(node);
          for (const name of definedVars) {
            if (!usedVars.has(name)) {
              context.report({
                message: "unused",
                data: { name },
                range: node.getRange(),
              });
            }
          }
        },
      },
    };
  }
});
