"""
Open-Source Allergen Knowledge Base & Substitution Taxonomy
Deterministic clinical and culinary data mapping ingredients to allergen classes,
hidden derivatives, risk classifications, and 1:1 safe culinary replacements.
"""

ALLERGEN_TAXONOMY = {
    "gluten": {
        "canonical_name": "Gluten / Celiac",
        "keywords": [
            "gluten", "wheat", "barley", "rye", "spelt", "kamut", "farro",
            "bulgur", "semolina", "couscous", "durum", "seitan", "graham",
            "triticale", "einkorn", "vital wheat gluten"
        ],
        "derivatives": [
            "malt", "malt extract", "malt flavoring", "malt syrup",
            "brewer's yeast", "brewers yeast", "beer", "ale",
            "soy sauce", "shoyu", "tamari with wheat",
            "hydrolyzed wheat protein", "wheat starch", "wheat grass",
            "modified food starch", "modified wheat starch",
            "flour", "all-purpose flour", "bread flour", "cake flour",
            "breadcrumbs", "panko", "croutons", "pasta", "orzo",
            "noodle", "spaghetti", "macaroni", "ramen noodles", "udon",
            "roux", "puff pastry", "phyllo", "filo", "croissant"
        ],
        "cross_contamination_vectors": [
            "Shared toaster (crumb contamination)",
            "Wooden cutting boards (gluten proteins embed in wood pores)",
            "Deep fryer oil used for breaded items",
            "Pasta colander / strainer (gluten starch residue sticks in holes)",
            "Shared butter / jam jars (knife double-dipping)"
        ],
        "substitutions": {
            "all-purpose flour": "1:1 Gluten-Free Baking Blend (Bob's Red Mill or King Arthur)",
            "flour": "1:1 Gluten-Free Measure for Measure Blend or Cassava Flour",
            "wheat flour": "Oat flour (certified GF) or Rice/Cassava blend",
            "soy sauce": "Certified Gluten-Free Tamari or Coconut Aminos",
            "breadcrumbs": "Crushed gluten-free crackers or gluten-free rice panko",
            "panko": "Gluten-free crisp rice crumbs",
            "pasta": "100% Brown rice pasta, chickpea pasta, or Jovial GF pasta",
            "noodles": "100% Buckwheat soba (wheat-free) or rice noodles",
            "couscous": "Quinoa or riced cauliflower",
            "beer": "Gluten-free sorghum/millet beer or dry apple cider",
            "malt vinegar": "Apple cider vinegar or distilled white vinegar"
        }
    },
    "tree_nuts": {
        "canonical_name": "Tree Nuts",
        "keywords": [
            "nut", "nuts", "almond", "cashew", "walnut", "pecan", "pistachio",
            "hazelnut", "filbert", "macadamia", "brazil nut", "pine nut",
            "chestnut", "shea nut", "ginkgo nut", "chinquapin", "beech nut"
        ],
        "derivatives": [
            "almond milk", "almond flour", "almond meal", "almond extract",
            "cashew butter", "cashew milk", "cashew cream",
            "praline", "marzipan", "frangipane", "gianduja", "nougat",
            "nutella", "pesto", "walnut oil", "hazelnut oil", "macadamia oil",
            "baklava", "amaretto"
        ],
        "cross_contamination_vectors": [
            "Bakery conveyor belts and shared equipment",
            "Mortar & pestle used for crushing nuts",
            "Salad bars and shared salad tongs",
            "Ice cream scoops dipping across flavors"
        ],
        "substitutions": {
            "almond flour": "Oat flour or sunflower seed flour (SunFlour)",
            "cashew cream": "Full-fat coconut milk or sunflower seed cream",
            "almond milk": "Oat milk, hemp milk, or soy milk",
            "walnuts": "Toasted pumpkin seeds (pepitas) or sunflower seeds",
            "pecans": "Toasted sunflower seeds or roasted chickpeas",
            "pesto": "Nut-free basil pesto made with toasted pumpkin seeds",
            "pine nuts": "Toasted sunflower seeds or hemp hearts",
            "hazelnut spread": "Sunflower butter blended with cocoa and maple syrup"
        }
    },
    "peanuts": {
        "canonical_name": "Peanuts",
        "keywords": [
            "peanut", "peanuts", "groundnut", "groundnuts", "monkey nut",
            "arachis", "beer nuts"
        ],
        "derivatives": [
            "peanut butter", "peanut oil", "arachis oil", "peanut flour",
            "satay sauce", "pad thai sauce", "mole sauce", "mixed nuts"
        ],
        "cross_contamination_vectors": [
            "Shared kitchen knives in condiment jars",
            "Asian takeout woks without rigorous sanitizing",
            "Bulk food bins with shared scoops"
        ],
        "substitutions": {
            "peanut butter": "Roasted Sunflower Seed Butter (SunButter) or Tahini",
            "peanut oil": "Canola oil, avocado oil, or high-oleic sunflower oil",
            "crushed peanuts": "Toasted sunflower seeds or roasted pumpkin seeds (pepitas)"
        }
    },
    "dairy": {
        "canonical_name": "Lactose / Dairy",
        "keywords": [
            "dairy", "milk", "cheese", "butter", "cream", "lactose", "yogurt",
            "casein", "caseinate", "whey", "curds", "lactalbumin"
        ],
        "derivatives": [
            "buttermilk", "sour cream", "ghee", "clarified butter",
            "condensed milk", "evaporated milk", "milk powder", "dry milk",
            "custard", "parmesan", "cheddar", "mozzarella", "ricotta",
            "brie", "gouda", "feta", "heavy cream", "half-and-half",
            "ice cream", "gelato", "caramel", "dulce de leche"
        ],
        "cross_contamination_vectors": [
            "Cheese slicers and graters",
            "Butter dishes with toast crumbs",
            "Milk frothers on espresso machines"
        ],
        "substitutions": {
            "butter": "Miyoko's European Cultured Vegan Butter or Extra Virgin Olive Oil",
            "heavy cream": "Full-fat canned coconut cream or silken tofu blend",
            "milk": "Unsweetened oat milk or coconut milk",
            "parmesan": "Nutritional yeast flakes with sea salt or Violife Dairy-Free Wedge",
            "mozzarella": "Cashew-free vegan mozzarella (Miyoko's or Violife)",
            "ricotta": "Tofu ricotta whipped with lemon and nutritional yeast",
            "sour cream": "Coconut-based or oat-based vegan sour cream (Forager / Kite Hill)",
            "yogurt": "Coconut milk yogurt (Cocojune / Silk)"
        }
    },
    "soy": {
        "canonical_name": "Soy",
        "keywords": [
            "soy", "soya", "soybean", "soybeans", "edamame"
        ],
        "derivatives": [
            "soy sauce", "shoyu", "tofu", "tempeh", "miso", "natto",
            "soy lecithin", "soy protein", "textured vegetable protein", "tvp",
            "soy milk", "soy flour", "soybean oil"
        ],
        "cross_contamination_vectors": [
            "Shared fryers and sushi prep stations"
        ],
        "substitutions": {
            "soy sauce": "Coconut aminos or certified soy-free chickpea tamari",
            "tofu": "Pumfu (pumpkin seed tofu) or chickpea tofu (Shan tofu)",
            "miso": "Chickpea miso (South River Miso Co.)",
            "edamame": "Green sweet peas or lima beans"
        }
    },
    "eggs": {
        "canonical_name": "Eggs",
        "keywords": ["egg", "eggs", "albumin", "ovalbumin", "globulin", "lysozyme", "ovomucin"],
        "derivatives": [
            "egg white", "egg yolk", "mayonnaise", "meringue", "custard",
            "aioli", "hollandaise", "brioche", "challah", "eggnog"
        ],
        "cross_contamination_vectors": ["Whisks, mixing bowls, egg-wash pastry brushes"],
        "substitutions": {
            "egg (in baking)": "1 tbsp ground flaxseed + 3 tbsp warm water (flax egg) or 1/4 cup unsweetened applesauce",
            "egg wash": "Plant milk brushed with a drop of maple syrup",
            "mayonnaise": "Egg-free vegan mayo (Fabanaise or Hellmann's Vegan)",
            "egg white (binding)": "Aquafaba (whipped chickpea liquid)"
        }
    },
    "shellfish": {
        "canonical_name": "Shellfish & Crustaceans",
        "keywords": [
            "shrimp", "prawn", "crab", "lobster", "crawfish", "crayfish",
            "clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus"
        ],
        "derivatives": [
            "clamato", "oyster sauce", "fish sauce", "shrimp paste",
            "dashi", "bouillabaisse"
        ],
        "cross_contamination_vectors": ["Seafood steamers, deep fryers, cutting boards in sushi prep"],
        "substitutions": {
            "oyster sauce": "Vegetarian mushroom stir-fry sauce",
            "shrimp": "King oyster mushroom medallions or seasoned tofu bites",
            "fish sauce": "Coconut aminos mixed with dried mushroom broth and seaweed"
        }
    },
    "sesame": {
        "canonical_name": "Sesame",
        "keywords": ["sesame", "tahini", "gomasio", "halva", "sesamum"],
        "derivatives": ["sesame oil", "toasted sesame oil", "sesame seeds", "hummus"],
        "cross_contamination_vectors": ["Bakery conveyors, bagel slicers, hummus dips"],
        "substitutions": {
            "tahini": "Sunflower seed butter (SunButter)",
            "sesame oil": "Toasted pumpkin seed oil or roasted peanut/olive oil blend",
            "sesame seeds": "Toasted hemp seeds or white chia seeds"
        }
    }
}

# Cross-reaction warnings
CROSS_REACTIVITY_RULES = [
    {
        "allergen": "gluten",
        "warning": "Celiac alert: Oats are naturally gluten-free but severely prone to wheat crop cross-contamination. Require 'Certified Gluten-Free' oats."
    },
    {
        "allergen": "tree_nuts",
        "warning": "Botanical anomaly: Coconut and nutmeg are NOT botanical tree nuts, but FDA classifies coconut as a tree nut. Confirm individual tolerance."
    },
    {
        "allergen": "dairy",
        "warning": "Lactose vs Milk Protein: Goat and sheep cheeses still contain lactose and casein and will trigger milk protein allergies."
    }
]
