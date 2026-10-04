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
            "casein", "caseinate", "whey", "curds", "lactalbumin",
            "paneer", "curd", "dahi", "malai", "khoa", "khoya", "mawa",
            "lassi", "raita", "kheer", "rabri", "rasmalai", "chaas",
            "shrikhand", "kulfi", "milkshake"
        ],
        "derivatives": [
            "buttermilk", "sour cream", "ghee", "clarified butter",
            "condensed milk", "evaporated milk", "milk powder", "dry milk",
            "custard", "parmesan", "cheddar", "mozzarella", "ricotta",
            "brie", "gouda", "feta", "heavy cream", "half-and-half",
            "ice cream", "gelato", "caramel", "dulce de leche",
            "makhani", "rasgulla", "latte", "cappuccino"
        ],
        # Removed from the text before matching, so "peanut butter" or
        # "coconut milk" is not mistaken for dairy.
        "exclusions": [
            "peanut butter", "almond butter", "nut butter", "cashew butter",
            "sunflower butter", "seed butter", "cocoa butter", "apple butter",
            "vegan butter", "plant butter", "coconut milk", "coconut cream",
            "almond milk", "oat milk", "soy milk", "rice milk", "cashew milk",
            "hemp milk", "cream of tartar", "dairy-free", "dairy free",
            "lactose-free", "lactose free", "non-dairy", "vegan cheese",
            "butternut", "butter beans", "butterfly", "cream crackers"
        ],
        # Nearly lactose-free; not flagged when the profile lists an intolerance
        # rather than a milk allergy.
        "low_lactose": ["ghee", "clarified butter"],
        "cross_contamination_vectors": [
            "Cheese slicers and graters",
            "Butter dishes with toast crumbs",
            "Milk frothers on espresso machines"
        ],
        "substitutions": {
            "butter": "A little ghee (nearly lactose-free) or olive oil",
            "heavy cream": "Lactose-free milk thickened with a spoon of cornflour (lighter too)",
            "cream": "Lactose-free milk thickened with a spoon of cornflour",
            "milk": "Lactose-free milk (or oat milk)",
            "parmesan": "Aged parmesan is very low in lactose; a light sprinkle is usually fine",
            "cheese": "Lactose-free cheese, or a small amount of aged hard cheese",
            "mozzarella": "Lactose-free mozzarella",
            "ricotta": "Lactose-free ricotta or crumbled lactose-free paneer",
            "sour cream": "Lactose-free curd, hung and whisked",
            "yogurt": "Lactose-free yogurt",
            "paneer": "Paneer made from lactose-free milk, or eggs / chicken for the same protein",
            "curd": "Lactose-free curd, or well-set homemade curd in a small portion",
            "dahi": "Lactose-free dahi, or well-set homemade dahi in a small portion",
            "raita": "Raita made with lactose-free curd",
            "lassi": "Lassi made with lactose-free curd, no added sugar",
            "kheer": "Kheer made with lactose-free milk and half the sugar",
            "malai": "Lactose-free milk thickened with a spoon of cornflour",
            "makhani": "Makhani gravy finished with lactose-free milk instead of cream and butter",
            "chaas": "Chaas made with lactose-free curd",
            "ice cream": "Lactose-free ice cream, or frozen banana blended smooth",
            "milkshake": "Shake made with lactose-free milk and fruit, no added sugar",
            "latte": "Latte with lactose-free or oat milk",
            "cappuccino": "Cappuccino with lactose-free or oat milk"
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
    },
    # ---- Health conditions (not allergies): flagged as CAUTION ----
    "gut_sensitive": {
        "canonical_name": "Sensitive Gut",
        "keywords": [
            "deep fried", "deep-fried", "fried", "very spicy", "extra spicy",
            "hot sauce", "ghost pepper", "carbonated", "soda", "cola",
            "soft drink", "energy drink", "alcohol", "beer", "wine", "whisky",
            "vodka", "rum", "cocktail", "sorbitol", "mannitol", "xylitol",
            "maltitol", "artificial sweetener", "rajma", "kidney beans"
        ],
        "derivatives": [
            "pakora", "pakoda", "bhaji", "samosa", "kachori", "bhature",
            "bhatura", "puri", "poori", "vada", "french fries", "fries",
            "fried chicken", "tempura", "chilli chicken", "schezwan",
            "vindaloo", "phaal", "pani puri", "golgappa", "chole bhature"
        ],
        "exclusions": [
            "stir fry", "stir-fry", "stir fried", "stir-fried", "air fried",
            "air-fried", "air fryer", "baking soda", "soda bicarbonate",
            "sugar-free"
        ],
        "cross_contamination_vectors": [
            "Gut tip: cook with 1-2 teaspoons of oil and keep spice gentle (cumin, ginger, coriander).",
            "Gut tip: smaller, regular meals are usually easier than one heavy dinner."
        ],
        "default_advice": "Make a lighter version: baked, air-fried, or pan-roasted, with gentle spices",
        "substitutions": {
            "deep fried": "Air-fried, baked, or pan-roasted with a teaspoon of oil",
            "deep-fried": "Air-fried, baked, or pan-roasted with a teaspoon of oil",
            "fried": "Air-fried, baked, or pan-roasted with a teaspoon of oil",
            "hot sauce": "Mild flavour from cumin, ginger, coriander, and lemon",
            "very spicy": "Mild flavour from cumin, ginger, coriander, and lemon",
            "extra spicy": "Mild flavour from cumin, ginger, coriander, and lemon",
            "soda": "Still water with lemon and mint, or jeera water",
            "cola": "Still water with lemon and mint, or jeera water",
            "soft drink": "Still water with lemon and mint, or jeera water",
            "carbonated": "Still water with lemon and mint, or jeera water",
            "beer": "A mint-lime mocktail with still water",
            "wine": "A mint-lime mocktail with still water",
            "alcohol": "A mint-lime mocktail with still water",
            "rajma": "Well-soaked, pressure-cooked moong dal (gentler on the gut)",
            "kidney beans": "Well-soaked, pressure-cooked moong dal (gentler on the gut)",
            "samosa": "Baked samosa or roasted chana chaat",
            "pakora": "Air-fried pakoras or grilled vegetables",
            "pakoda": "Air-fried pakodas or grilled vegetables",
            "bhature": "Whole wheat phulka",
            "puri": "Phulka or a dry-roasted roti",
            "poori": "Phulka or a dry-roasted roti",
            "fries": "Air-fried potato wedges",
            "french fries": "Air-fried potato wedges"
        }
    },
    "thyroid": {
        "canonical_name": "Thyroid (High TSH)",
        "keywords": [
            "soy", "soya", "soybean", "soybeans", "tofu", "tempeh", "edamame",
            "soya chunks", "soy chunks", "nutrela", "bajra", "pearl millet",
            "raw kale", "kale smoothie", "raw cabbage"
        ],
        "derivatives": ["soy milk", "soy protein", "textured vegetable protein", "tvp", "miso", "natto"],
        "exclusions": ["soy sauce", "soy lecithin", "soya lecithin", "soy-free", "soy free"],
        "cross_contamination_vectors": [
            "Thyroid tip: cooked cabbage, cauliflower, and broccoli are fine; only large raw portions are a concern.",
            "Thyroid tip: if she takes thyroid medicine, keep soy, calcium, iron, and coffee about 4 hours apart from it (confirm with her doctor)."
        ],
        "default_advice": "Swap the soy for eggs, chicken, fish, or dal",
        "substitutions": {
            "tofu": "Lactose-free paneer, eggs, chicken, or fish",
            "soy milk": "Lactose-free milk or oat milk",
            "soya chunks": "Chicken, eggs, or moong dal for protein",
            "soy chunks": "Chicken, eggs, or moong dal for protein",
            "nutrela": "Chicken, eggs, or moong dal for protein",
            "edamame": "Green peas",
            "tempeh": "Grilled chicken or paneer made from lactose-free milk",
            "bajra": "Whole wheat, ragi, or rice roti",
            "pearl millet": "Whole wheat, ragi, or rice roti",
            "raw kale": "Lightly cooked spinach or kale",
            "kale smoothie": "Smoothie with cooked spinach or cucumber instead of raw kale",
            "raw cabbage": "Lightly sauteed cabbage"
        }
    },
    "weight_goal": {
        "canonical_name": "Weight Loss Goal",
        "keywords": [
            "deep fried", "deep-fried", "fried", "sugar", "refined sugar",
            "syrup", "corn syrup", "condensed milk", "soda", "cola",
            "soft drink", "energy drink", "maida", "refined flour",
            "white bread", "mayonnaise", "mayo", "heavy cream", "cream"
        ],
        "derivatives": [
            "samosa", "pakora", "pakoda", "kachori", "bhature", "bhatura",
            "puri", "poori", "jalebi", "gulab jamun", "halwa", "ladoo",
            "laddu", "barfi", "rasgulla", "rasmalai", "kheer", "bhujia",
            "namkeen", "chips", "french fries", "fries", "pizza", "burger",
            "pastry", "cake", "cookies", "biscuits", "donut", "doughnut",
            "ice cream", "chocolate", "candy", "milkshake", "naan",
            "butter naan", "biryani"
        ],
        "exclusions": [
            "sugar snap", "sugar-free", "sugar free", "no sugar", "no added sugar",
            "stir fry", "stir-fry", "stir fried", "stir-fried", "air fried",
            "air-fried", "dark chocolate", "ice cream scoop"
        ],
        "cross_contamination_vectors": [
            "Weight tip: fill half the plate with vegetables and a quarter with protein (dal, eggs, chicken, fish).",
            "Weight tip: measure oil with a spoon rather than pouring from the bottle."
        ],
        "default_advice": "Keep the portion small, or choose a baked / home-style version",
        "substitutions": {
            "sugar": "Cut the sugar by half, or sweeten with dates or ripe fruit",
            "refined sugar": "Cut the sugar by half, or sweeten with dates or ripe fruit",
            "syrup": "A little honey or date paste, in half the amount",
            "condensed milk": "Lactose-free milk reduced with a few dates",
            "maida": "Whole wheat atta or multigrain flour",
            "refined flour": "Whole wheat atta or multigrain flour",
            "white bread": "Whole grain or multigrain bread",
            "mayonnaise": "Lactose-free hung curd or mashed avocado",
            "mayo": "Lactose-free hung curd or mashed avocado",
            "heavy cream": "Lactose-free milk thickened with a spoon of cornflour",
            "cream": "Lactose-free milk thickened with a spoon of cornflour",
            "deep fried": "Air-fried, baked, or grilled",
            "deep-fried": "Air-fried, baked, or grilled",
            "fried": "Air-fried, baked, or grilled",
            "soda": "Still water with lemon and mint",
            "cola": "Still water with lemon and mint",
            "soft drink": "Still water with lemon and mint",
            "samosa": "Baked samosa or roasted chana chaat",
            "pakora": "Air-fried pakoras or grilled vegetables",
            "jalebi": "A small bowl of fresh fruit",
            "gulab jamun": "A small bowl of fresh fruit",
            "halwa": "A small portion made with less sugar and ghee",
            "ladoo": "A dates-and-seeds ladoo, one piece",
            "chips": "Roasted makhana or roasted chana",
            "namkeen": "Roasted makhana or roasted chana",
            "bhujia": "Roasted makhana or roasted chana",
            "fries": "Air-fried potato wedges",
            "french fries": "Air-fried potato wedges",
            "pizza": "Thin whole-wheat crust with lots of vegetables and light cheese",
            "burger": "Grilled chicken or veg patty in a whole-wheat bun",
            "naan": "Whole wheat phulka or tandoori roti",
            "butter naan": "Whole wheat phulka or tandoori roti",
            "biryani": "Smaller portion with extra raita-free salad, or a brown rice pulao",
            "cake": "A small slice, or a fruit-based dessert",
            "ice cream": "Frozen banana blended smooth",
            "chocolate": "Two squares of dark chocolate"
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
        "warning": "Lactose vs milk protein: goat and sheep cheeses still contain lactose and casein."
    }
]

# Categories that describe health conditions or goals rather than allergies.
HEALTH_CATEGORIES = {"gut_sensitive", "thyroid", "weight_goal"}
