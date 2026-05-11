import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

function formatIngredient(ing: any, depth = 0): string {
  const indent = "  ".repeat(depth);
  const title = ing.title || ing.name || "";
  const amount = ing.value
    ? ` ${ing.value.amount}${ing.value.unit || ""}`
    : "";
  const allergen = ing.allergen ? " (allergén)" : "";
  let line = `${indent}- ${title}${amount}${allergen}`;
  if (Array.isArray(ing.ingredients) && ing.ingredients.length > 0) {
    const sub = ing.ingredients
      .map((s: any) => formatIngredient(s, depth + 1))
      .join("\n");
    line += "\n" + sub;
  }
  return line;
}

export function createProductDetailTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_product_detail",
    definition: {
      title: "Get Product Detail",
      description:
        "Get full product information by ID: name, brand, country of origin, ingredient/composition list (with percentages and allergen flags), and nutritional values per 100g. Use this when you need to verify what is in a product before recommending it (e.g. checking for E-numbers, preservatives, additives, allergens).",
      inputSchema: {
        product_id: z
          .number()
          .describe("The product ID to look up (numeric)"),
      },
    },
    handler: async (args: { product_id: number }) => {
      const { product_id } = args;
      try {
        const api = createRohlikAPI();
        const { info, composition } = await api.getProductDetail(product_id);

        const lines: string[] = [];
        lines.push(`📦 ${info.name || "Unknown product"}`);
        lines.push(`   ID: ${info.id}`);
        if (info.brand) lines.push(`   Brand: ${info.brand}`);
        if (info.textualAmount) lines.push(`   Amount: ${info.textualAmount}`);
        if (info.countries && info.countries.length > 0) {
          const c = info.countries.map((x: any) => x.name).join(", ");
          lines.push(`   Country: ${c}`);
        }

        if (composition && Array.isArray(composition.ingredients) && composition.ingredients.length > 0) {
          lines.push("");
          lines.push("🧪 ÖSSZETEVŐK / INGREDIENTS:");
          for (const ing of composition.ingredients) {
            lines.push(formatIngredient(ing, 0));
          }
        } else {
          lines.push("");
          lines.push("🧪 ÖSSZETEVŐK: nincs összetevő-adat ennél a terméknél (pl. friss termék vagy adat hiányzik)");
        }

        if (composition && Array.isArray(composition.nutritionalValues) && composition.nutritionalValues.length > 0) {
          lines.push("");
          lines.push("📊 TÁPÉRTÉK:");
          for (const nv of composition.nutritionalValues) {
            const portion = nv.portion || "100 g";
            lines.push(`   per ${portion}:`);
            const v = nv.values || {};
            const fmt = (key: string, label: string) => {
              const obj = v[key];
              if (obj && obj.amount != null) {
                lines.push(`     ${label}: ${obj.amount} ${obj.unit || ""}`);
              }
            };
            fmt("energyKJ", "Energia");
            fmt("energyKCal", "Energia");
            fmt("fats", "Zsír");
            fmt("saturatedFats", "telített zsírsav");
            fmt("carbohydrates", "Szénhidrát");
            fmt("sugars", "cukor");
            fmt("protein", "Fehérje");
            fmt("salt", "Só");
            fmt("fiber", "Rost");
          }
        }

        if (composition && Array.isArray(composition.allergens) && composition.allergens.length > 0) {
          lines.push("");
          lines.push("⚠️ ALLERGÉNEK:");
          for (const a of composition.allergens) {
            lines.push(`   - ${a.name || a.title || JSON.stringify(a)}`);
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: lines.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    },
  };
}
