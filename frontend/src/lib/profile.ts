import { UserProfile } from "../types";
import { createLocalStore } from "./store";

// Prithvi's default profile. Edits are saved only in this browser.
export const DEFAULT_PROFILE: UserProfile = {
  id: "prithvi-default",
  name: "Prithvi",
  relationship: "Friend",
  allergies: [
    {
      name: "Lactose (sometimes)",
      severity: "intolerance",
      notes:
        "Lactose bothers her on some days. Lactose-free milk, ghee, and aged cheese are usually fine; keep fresh milk, cream, paneer, and curd small or lactose-free.",
    },
    {
      name: "Sensitive Gut",
      severity: "moderate",
      notes:
        "Go easy on deep-fried food, very spicy dishes, fizzy drinks, alcohol, and sugar-free sweeteners. Simple home-style food suits her best.",
    },
    {
      name: "High TSH (Thyroid)",
      severity: "moderate",
      notes:
        "Limit soy foods and bajra. Cooked cabbage, cauliflower, and broccoli are fine. If she takes thyroid medicine, keep soy, calcium, iron, and coffee about 4 hours apart from it.",
    },
    {
      name: "Weight Loss Goal",
      severity: "preference",
      notes:
        "Favour high-protein, high-fibre meals. Limit fried snacks, sweets, sugary drinks, maida, and heavy cream.",
    },
  ],
  dislikes: [],
  favorite_cuisines: ["Indian home-style"],
};

function isProfile(value: unknown): value is UserProfile {
  const v = value as UserProfile;
  return !!v && typeof v.name === "string" && Array.isArray(v.allergies);
}

// Saved only in this browser.
export const profileStore = createLocalStore<UserProfile>("allergysafe.profile.v2", DEFAULT_PROFILE, {
  validate: isProfile,
});
