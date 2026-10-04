"""
Typical ingredients for common dishes, and a library of everyday healthy meals.

Dish entries describe a *typical* home or restaurant recipe. Real recipes vary,
so answers built on them always say which ingredients were assumed.
"""
import re
from typing import Dict, List, Optional

# name -> {aliases, ingredients}
DISHES: Dict[str, Dict] = {
    # ---- North Indian ----
    "Paneer Butter Masala": {
        "aliases": ["paneer butter masala", "paneer makhani", "butter paneer"],
        "ingredients": ["Paneer", "Butter", "Fresh cream", "Tomato", "Cashew paste", "Onion", "Ginger garlic paste", "Kasuri methi", "Sugar", "Spices"],
    },
    "Butter Chicken": {
        "aliases": ["butter chicken", "murgh makhani", "chicken makhani"],
        "ingredients": ["Chicken", "Curd marinade", "Butter", "Fresh cream", "Tomato", "Cashew paste", "Ginger garlic paste", "Kasuri methi", "Sugar", "Spices"],
    },
    "Palak Paneer": {
        "aliases": ["palak paneer", "saag paneer"],
        "ingredients": ["Spinach", "Paneer", "Onion", "Tomato", "Ginger garlic paste", "Fresh cream", "Cumin", "Spices"],
    },
    "Shahi Paneer": {
        "aliases": ["shahi paneer", "paneer korma"],
        "ingredients": ["Paneer", "Fresh cream", "Cashew paste", "Curd", "Onion", "Ghee", "Sugar", "Spices"],
    },
    "Kadai Paneer": {
        "aliases": ["kadai paneer", "kadhai paneer"],
        "ingredients": ["Paneer", "Capsicum", "Onion", "Tomato", "Ginger garlic paste", "Oil", "Kadai masala"],
    },
    "Dal Makhani": {
        "aliases": ["dal makhani", "daal makhani", "maa ki dal"],
        "ingredients": ["Whole black urad dal", "Rajma", "Butter", "Fresh cream", "Tomato", "Ginger garlic paste", "Spices"],
    },
    "Dal Tadka": {
        "aliases": ["dal tadka", "dal fry", "yellow dal", "daal tadka", "dal"],
        "ingredients": ["Toor dal", "Tomato", "Onion", "Garlic", "Cumin", "Ghee", "Turmeric", "Spices"],
    },
    "Rajma Chawal": {
        "aliases": ["rajma chawal", "rajma rice", "rajma"],
        "ingredients": ["Rajma", "Onion", "Tomato", "Ginger garlic paste", "Oil", "Spices", "Basmati rice"],
    },
    "Chole Bhature": {
        "aliases": ["chole bhature", "chole bhatura", "chhole bhature"],
        "ingredients": ["Chickpeas", "Onion", "Tomato", "Chole masala", "Bhature (deep-fried maida bread)", "Curd in dough", "Oil"],
    },
    "Chana Masala": {
        "aliases": ["chana masala", "chole", "chhole"],
        "ingredients": ["Chickpeas", "Onion", "Tomato", "Ginger garlic paste", "Oil", "Chana masala spices"],
    },
    "Aloo Paratha": {
        "aliases": ["aloo paratha", "alu paratha", "paratha"],
        "ingredients": ["Whole wheat atta", "Potato", "Green chilli", "Spices", "Butter", "Curd on the side"],
    },
    "Chicken Biryani": {
        "aliases": ["chicken biryani", "biryani", "mutton biryani", "veg biryani"],
        "ingredients": ["Basmati rice", "Chicken", "Curd marinade", "Fried onions", "Ghee", "Whole spices", "Saffron milk", "Raita on the side"],
    },
    "Tandoori Chicken": {
        "aliases": ["tandoori chicken", "chicken tikka", "tikka"],
        "ingredients": ["Chicken", "Curd marinade", "Lemon", "Ginger garlic paste", "Kashmiri chilli", "Spices", "Oil"],
    },
    "Chicken Curry": {
        "aliases": ["chicken curry", "home style chicken curry"],
        "ingredients": ["Chicken", "Onion", "Tomato", "Ginger garlic paste", "Oil", "Garam masala", "Turmeric"],
    },
    "Egg Curry": {
        "aliases": ["egg curry", "anda curry"],
        "ingredients": ["Boiled eggs", "Onion", "Tomato", "Ginger garlic paste", "Oil", "Spices"],
    },
    "Fish Curry": {
        "aliases": ["fish curry", "meen curry", "goan fish curry"],
        "ingredients": ["Fish", "Coconut milk", "Tamarind", "Onion", "Tomato", "Oil", "Spices"],
    },
    "Aloo Gobi": {
        "aliases": ["aloo gobi", "alu gobi"],
        "ingredients": ["Potato", "Cauliflower", "Onion", "Tomato", "Oil", "Turmeric", "Cumin"],
    },
    "Bhindi Masala": {
        "aliases": ["bhindi masala", "bhindi fry", "okra"],
        "ingredients": ["Okra", "Onion", "Tomato", "Oil", "Amchur", "Spices"],
    },
    "Jeera Rice": {
        "aliases": ["jeera rice"],
        "ingredients": ["Basmati rice", "Cumin", "Ghee"],
    },
    "Khichdi": {
        "aliases": ["khichdi", "khichri", "moong dal khichdi"],
        "ingredients": ["Moong dal", "Rice", "Turmeric", "Cumin", "Ghee", "Vegetables"],
    },
    "Butter Naan": {
        "aliases": ["butter naan", "naan", "garlic naan"],
        "ingredients": ["Maida", "Curd", "Butter", "Yeast", "Sugar"],
    },
    "Roti": {
        "aliases": ["roti", "chapati", "phulka", "chapathi"],
        "ingredients": ["Whole wheat atta", "Water"],
    },
    # ---- South Indian ----
    "Masala Dosa": {
        "aliases": ["masala dosa", "dosa", "plain dosa"],
        "ingredients": ["Rice and urad dal batter", "Potato masala", "Oil", "Coconut chutney", "Sambar"],
    },
    "Idli Sambar": {
        "aliases": ["idli sambar", "idli", "idly"],
        "ingredients": ["Rice and urad dal batter (steamed)", "Sambar", "Coconut chutney"],
    },
    "Medu Vada": {
        "aliases": ["medu vada", "vada", "vada sambar"],
        "ingredients": ["Urad dal batter", "Deep-fried in oil", "Sambar", "Coconut chutney"],
    },
    "Upma": {
        "aliases": ["upma", "rava upma"],
        "ingredients": ["Semolina (rava)", "Onion", "Mustard seeds", "Curry leaves", "Vegetables", "Oil"],
    },
    "Curd Rice": {
        "aliases": ["curd rice", "thayir sadam", "dahi chawal"],
        "ingredients": ["Rice", "Curd", "Milk", "Mustard seeds", "Curry leaves"],
    },
    # ---- Breakfast & snacks ----
    "Poha": {
        "aliases": ["poha", "kanda poha"],
        "ingredients": ["Flattened rice", "Onion", "Peanuts", "Mustard seeds", "Turmeric", "Lemon", "Oil"],
    },
    "Besan Chilla": {
        "aliases": ["besan chilla", "chilla", "cheela", "moong dal chilla"],
        "ingredients": ["Besan", "Onion", "Tomato", "Coriander", "Oil"],
    },
    "Samosa": {
        "aliases": ["samosa", "samosas"],
        "ingredients": ["Samosa (deep-fried maida pastry)", "Potato", "Peas", "Spices"],
    },
    "Pakora": {
        "aliases": ["pakora", "pakoda", "bhajji", "bhaji"],
        "ingredients": ["Besan batter", "Onion", "Deep-fried in oil"],
    },
    "Pani Puri": {
        "aliases": ["pani puri", "golgappa", "puchka"],
        "ingredients": ["Puri (deep-fried)", "Potato", "Chickpeas", "Tamarind chutney", "Spicy mint water"],
    },
    "Pav Bhaji": {
        "aliases": ["pav bhaji"],
        "ingredients": ["Mixed vegetables", "Butter", "Pav (white bread)", "Pav bhaji masala", "Onion"],
    },
    "Vada Pav": {
        "aliases": ["vada pav", "wada pav"],
        "ingredients": ["Potato vada (deep-fried besan batter)", "Pav (white bread)", "Chutneys"],
    },
    "Masala Chai": {
        "aliases": ["masala chai", "chai", "tea with milk", "milk tea"],
        "ingredients": ["Milk", "Tea leaves", "Sugar", "Ginger", "Cardamom"],
    },
    "Filter Coffee": {
        "aliases": ["filter coffee", "coffee"],
        "ingredients": ["Coffee decoction", "Milk", "Sugar"],
    },
    "Lassi": {
        "aliases": ["lassi", "sweet lassi", "mango lassi"],
        "ingredients": ["Curd", "Sugar", "Milk"],
    },
    "Buttermilk": {
        "aliases": ["buttermilk", "chaas", "chaach", "mattha"],
        "ingredients": ["Curd", "Water", "Cumin", "Salt"],
    },
    "Gulab Jamun": {
        "aliases": ["gulab jamun", "gulab jamuns"],
        "ingredients": ["Khoya", "Maida", "Deep-fried in ghee", "Sugar syrup"],
    },
    "Jalebi": {
        "aliases": ["jalebi", "jalebis"],
        "ingredients": ["Maida batter", "Deep-fried", "Sugar syrup"],
    },
    "Kheer": {
        "aliases": ["kheer", "payasam", "rice pudding"],
        "ingredients": ["Milk", "Rice", "Sugar", "Cardamom", "Nuts"],
    },
    "Makhana": {
        "aliases": ["makhana", "roasted makhana", "fox nuts", "lotus seeds"],
        "ingredients": ["Makhana", "A teaspoon of ghee", "Salt", "Pepper"],
    },
    "Sprouts Chaat": {
        "aliases": ["sprouts chaat", "sprouts salad", "sprouts"],
        "ingredients": ["Moong sprouts", "Onion", "Tomato", "Cucumber", "Lemon", "Chaat masala"],
    },
    "Fruit Bowl": {
        "aliases": ["fruit bowl", "fruit salad", "fruits", "fruit"],
        "ingredients": ["Seasonal fruits", "Lemon", "Chaat masala"],
    },
    # ---- Indo-Chinese & international ----
    "Veg Fried Rice": {
        "aliases": ["fried rice", "veg fried rice", "chicken fried rice"],
        "ingredients": ["Rice", "Mixed vegetables", "Soy sauce", "Oil", "Spring onion", "Stir-fried"],
    },
    "Hakka Noodles": {
        "aliases": ["hakka noodles", "chowmein", "chow mein", "noodles"],
        "ingredients": ["Noodles (maida)", "Cabbage", "Capsicum", "Soy sauce", "Chilli sauce", "Oil"],
    },
    "Chilli Chicken": {
        "aliases": ["chilli chicken", "chili chicken"],
        "ingredients": ["Chicken", "Cornflour batter", "Deep-fried", "Soy sauce", "Chilli sauce", "Capsicum", "Onion"],
    },
    "Manchurian": {
        "aliases": ["manchurian", "gobi manchurian", "veg manchurian"],
        "ingredients": ["Vegetable balls", "Maida and cornflour batter", "Deep-fried", "Soy sauce", "Chilli sauce"],
    },
    "Margherita Pizza": {
        "aliases": ["pizza", "margherita", "pepperoni pizza"],
        "ingredients": ["Pizza (maida crust)", "Mozzarella cheese", "Tomato sauce", "Olive oil"],
    },
    "Burger": {
        "aliases": ["burger", "cheeseburger", "veg burger"],
        "ingredients": ["Burger bun (white bread)", "Patty", "Cheese", "Mayonnaise", "Lettuce", "Tomato", "French fries on the side"],
    },
    "Pasta Alfredo": {
        "aliases": ["alfredo", "white sauce pasta", "fettuccine alfredo", "creamy pasta"],
        "ingredients": ["Pasta (maida)", "Heavy cream", "Butter", "Parmesan cheese", "Garlic"],
    },
    "Red Sauce Pasta": {
        "aliases": ["red sauce pasta", "arrabbiata", "tomato pasta", "pasta"],
        "ingredients": ["Pasta", "Tomato sauce", "Garlic", "Olive oil", "Chilli flakes"],
    },
    "Spaghetti and Meatballs": {
        "aliases": ["spaghetti and meatballs", "meatballs", "spaghetti"],
        "ingredients": ["Spaghetti", "Ground meat", "Egg", "Breadcrumbs", "Parmesan cheese", "Marinara sauce"],
    },
    "Pad Thai": {
        "aliases": ["pad thai", "thai noodles"],
        "ingredients": ["Rice noodles", "Egg", "Peanuts", "Fish sauce", "Soy sauce", "Tamarind", "Sugar", "Bean sprouts", "Tofu"],
    },
    "Sushi": {
        "aliases": ["sushi", "maki", "california roll"],
        "ingredients": ["Sushi rice", "Rice vinegar", "Sugar", "Nori", "Fish", "Soy sauce"],
    },
    "Tofu Stir Fry": {
        "aliases": ["tofu stir fry", "tofu"],
        "ingredients": ["Tofu", "Mixed vegetables", "Soy sauce", "Ginger", "Garlic", "Oil", "Stir-fried"],
    },
    "Caesar Salad": {
        "aliases": ["caesar salad"],
        "ingredients": ["Lettuce", "Parmesan cheese", "Croutons", "Caesar dressing (mayonnaise, anchovy, egg)"],
    },
    "Grilled Chicken Salad": {
        "aliases": ["grilled chicken salad", "chicken salad", "salad"],
        "ingredients": ["Grilled chicken", "Lettuce", "Cucumber", "Tomato", "Olive oil", "Lemon"],
    },
    "Omelette": {
        "aliases": ["omelette", "omelet", "masala omelette", "egg bhurji", "scrambled eggs"],
        "ingredients": ["Eggs", "Onion", "Tomato", "Green chilli", "Oil"],
    },
    "Oats": {
        "aliases": ["oats", "oatmeal", "porridge", "overnight oats"],
        "ingredients": ["Rolled oats", "Milk", "Fruit", "Honey"],
    },
    "Smoothie": {
        "aliases": ["smoothie", "banana smoothie"],
        "ingredients": ["Banana", "Milk", "Honey"],
    },
    "Ice Cream": {
        "aliases": ["ice cream", "icecream", "kulfi"],
        "ingredients": ["Ice cream", "Sugar"],
    },
    "Chocolate Cake": {
        "aliases": ["cake", "chocolate cake", "pastry", "brownie"],
        "ingredients": ["Cake (maida)", "Sugar", "Butter", "Eggs", "Chocolate"],
    },
    "Cola": {
        "aliases": ["cola", "coke", "pepsi", "soda", "soft drink", "cold drink"],
        "ingredients": ["Carbonated soft drink", "Sugar"],
    },
    "Beer": {
        "aliases": ["beer", "wine", "alcohol", "cocktail", "whisky", "vodka"],
        "ingredients": ["Alcohol"],
    },
    # ---- Single foods people often ask about ----
    "Eggs": {"aliases": ["egg", "eggs", "boiled egg", "boiled eggs"], "ingredients": ["Eggs"]},
    "Paneer": {"aliases": ["paneer", "cottage cheese"], "ingredients": ["Paneer"]},
    "Milk": {"aliases": ["milk", "glass of milk", "haldi doodh", "turmeric milk"], "ingredients": ["Milk"]},
    "Curd": {"aliases": ["curd", "dahi", "yogurt", "yoghurt"], "ingredients": ["Curd"]},
    "Cheese": {"aliases": ["cheese", "cheese slice"], "ingredients": ["Cheese"]},
    "Ghee": {"aliases": ["ghee"], "ingredients": ["Ghee"]},
    "Chicken": {"aliases": ["chicken", "grilled chicken"], "ingredients": ["Chicken"]},
    "Rice": {"aliases": ["rice", "plain rice", "steamed rice"], "ingredients": ["Rice"]},
    "Soy Chunks": {"aliases": ["soy chunks", "soya chunks", "nutrela"], "ingredients": ["Soya chunks"]},
    "Soy Milk": {"aliases": ["soy milk", "soya milk"], "ingredients": ["Soy milk"]},
    "Cabbage": {"aliases": ["cabbage", "cauliflower", "broccoli", "gobi"], "ingredients": ["Cooked cruciferous vegetables"]},
    "Bajra Roti": {"aliases": ["bajra", "bajra roti", "pearl millet"], "ingredients": ["Bajra"]},
    "Peanut Butter": {"aliases": ["peanut butter"], "ingredients": ["Peanut butter"]},
}


def _norm(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", " ", text)
    return " ".join(text.split())


# Longest alias first so "paneer butter masala" beats "butter".
_ALIAS_INDEX = sorted(
    ((alias, name) for name, d in DISHES.items() for alias in d["aliases"]),
    key=lambda pair: len(pair[0]),
    reverse=True,
)


def find_dish(text: str) -> Optional[str]:
    """Return the dish mentioned first in the text (longest alias on ties),
    so "pasta with cream and cheese" is pasta, not cheese."""
    norm = f" {_norm(text)} "
    best = None  # (position, -alias_length, name)
    for alias, name in _ALIAS_INDEX:
        m = re.search(rf"\b{re.escape(alias)}s?\b", norm)
        if m:
            candidate = (m.start(), -len(alias), name)
            if best is None or candidate < best:
                best = candidate
    return best[2] if best else None


def dish_ingredients(name: str) -> List[str]:
    return list(DISHES.get(name, {}).get("ingredients", []))


# Everyday meals. "types" decides where each one is suggested; dinner meals with
# "aisles" can appear in the meal planner. Every meal is checked against the
# profile before it is suggested.
MEALS: List[Dict] = [
    {
        "title": "Moong Dal Khichdi with Sauteed Vegetables",
        "types": ["dinner", "lunch"],
        "description": "Soft moong dal and rice cooked with turmeric and cumin, served with carrots, beans, and peas sauteed in a teaspoon of oil.",
        "why": "Light on the stomach, high in protein and fibre, and naturally lactose-free.",
        "minutes": 30,
        "ingredients": ["Moong dal", "Rice", "Carrot", "French beans", "Green peas", "Turmeric", "Cumin", "Ginger", "Cold-pressed oil"],
        "tip": "Pressure-cook the dal well; well-cooked dal is gentler on a sensitive gut.",
        "aisles": {
            "Produce": ["Carrots", "French beans", "Green peas", "Ginger"],
            "Pantry & Grains": ["Yellow moong dal", "Rice", "Turmeric", "Cumin seeds", "Cold-pressed oil"],
        },
    },
    {
        "title": "Lemon-Herb Grilled Fish with Sauteed Spinach and Brown Rice",
        "types": ["dinner", "lunch"],
        "description": "Fish fillets marinated in lemon, garlic, and herbs, grilled and served with garlicky spinach and a small bowl of brown rice.",
        "why": "Lean protein for weight loss, fish provides selenium and iodine for thyroid health, and nothing fried or creamy.",
        "minutes": 25,
        "ingredients": ["Fish fillets", "Lemon", "Garlic", "Fresh herbs", "Spinach", "Brown rice", "Olive oil"],
        "tip": "Grill on a pan with a teaspoon of oil; no batter or deep-frying needed.",
        "aisles": {
            "Produce": ["Lemons", "Garlic", "Fresh coriander or dill", "Spinach"],
            "Meat & Seafood": ["Fish fillets (rohu, basa, or salmon)"],
            "Pantry & Grains": ["Brown rice", "Olive oil"],
        },
    },
    {
        "title": "Lemon-Pepper Chicken Tikka with Kachumber Salad and Phulka",
        "types": ["dinner", "lunch"],
        "description": "Chicken marinated in lemon juice, ginger-garlic, and spices instead of curd, grilled, and served with cucumber-onion-tomato salad and phulkas.",
        "why": "High protein with a lactose-free marinade, and grilled rather than fried.",
        "minutes": 35,
        "ingredients": ["Chicken breast", "Lemon", "Ginger garlic paste", "Kashmiri chilli", "Spices", "Cucumber", "Tomato", "Onion", "Whole wheat atta"],
        "tip": "Marinate for at least 30 minutes; lemon tenderises the chicken the way curd would.",
        "aisles": {
            "Produce": ["Lemons", "Cucumber", "Tomatoes", "Onion", "Ginger", "Garlic"],
            "Meat & Seafood": ["Boneless chicken breast"],
            "Pantry & Grains": ["Whole wheat atta", "Kashmiri chilli powder", "Garam masala"],
        },
    },
    {
        "title": "Egg Bhurji with Multigrain Roti and Cucumber Salad",
        "types": ["dinner", "breakfast", "lunch"],
        "description": "Scrambled eggs with onion, tomato, and a little turmeric, with multigrain roti and a crunchy cucumber salad.",
        "why": "Quick, filling, high in protein, and eggs provide iodine and selenium.",
        "minutes": 15,
        "ingredients": ["Eggs", "Onion", "Tomato", "Turmeric", "Multigrain atta", "Cucumber", "Cold-pressed oil"],
        "tip": "Use one teaspoon of oil in a non-stick pan.",
        "aisles": {
            "Produce": ["Onion", "Tomatoes", "Cucumber"],
            "Refrigerated": ["Eggs"],
            "Pantry & Grains": ["Multigrain atta", "Turmeric"],
        },
    },
    {
        "title": "Lauki Chana Dal with Jeera Rice",
        "types": ["dinner", "lunch"],
        "description": "Bottle gourd simmered with chana dal, tomato, and mild spices, served with a small portion of cumin rice.",
        "why": "Bottle gourd is light, hydrating, and low in calories; dal adds protein.",
        "minutes": 35,
        "ingredients": ["Lauki (bottle gourd)", "Chana dal", "Tomato", "Turmeric", "Cumin", "Rice", "Cold-pressed oil"],
        "tip": "Soak the chana dal for an hour so it cooks soft and digests easily.",
        "aisles": {
            "Produce": ["Lauki (bottle gourd)", "Tomatoes"],
            "Pantry & Grains": ["Chana dal", "Rice", "Cumin seeds", "Turmeric"],
        },
    },
    {
        "title": "Crispy Herb Salmon with Roasted Sweet Potato and Broccoli",
        "types": ["dinner"],
        "description": "Pan-seared salmon with lemon and herbs, roasted sweet potato, and roasted broccoli.",
        "why": "Omega-3 rich protein with fibre-filled vegetables; broccoli is fine for the thyroid when cooked.",
        "minutes": 25,
        "ingredients": ["Salmon fillets", "Sweet potatoes", "Broccoli", "Garlic", "Lemon", "Olive oil", "Rosemary"],
        "tip": "Roast the vegetables on parchment with a light spray of oil.",
        "aisles": {
            "Produce": ["Sweet potatoes", "Broccoli", "Garlic", "Lemons", "Fresh rosemary"],
            "Meat & Seafood": ["Salmon fillets"],
            "Pantry & Grains": ["Olive oil"],
        },
    },
    {
        "title": "Vegetable Quinoa Pulao with Mint-Cucumber Salad",
        "types": ["dinner", "lunch"],
        "description": "Quinoa cooked pulao-style with whole spices, carrots, beans, and peas, served with a fresh mint and cucumber salad.",
        "why": "Quinoa adds complete protein and fibre and keeps her full for longer.",
        "minutes": 25,
        "ingredients": ["Quinoa", "Carrot", "French beans", "Green peas", "Whole spices", "Cucumber", "Mint", "Lemon", "Cold-pressed oil"],
        "tip": "Rinse the quinoa well to remove its bitter coating.",
        "aisles": {
            "Produce": ["Carrots", "French beans", "Green peas", "Cucumber", "Fresh mint", "Lemons"],
            "Pantry & Grains": ["Quinoa", "Bay leaf, cloves, cinnamon"],
        },
    },
    {
        "title": "Home-Style Chicken Curry with Phulka and Salad",
        "types": ["dinner", "lunch"],
        "description": "Chicken simmered in an onion-tomato gravy with a tablespoon of oil and no cream, served with phulkas and salad.",
        "why": "Comfort food made lighter: no cream or butter, and lots of protein.",
        "minutes": 40,
        "ingredients": ["Chicken", "Onion", "Tomato", "Ginger garlic paste", "Garam masala", "Turmeric", "Whole wheat atta", "Cucumber", "Cold-pressed oil"],
        "tip": "Keep the chilli mild; flavour comes from slow-cooked onions and garam masala.",
        "aisles": {
            "Produce": ["Onion", "Tomatoes", "Ginger", "Garlic", "Cucumber"],
            "Meat & Seafood": ["Chicken (curry cut)"],
            "Pantry & Grains": ["Whole wheat atta", "Garam masala", "Turmeric"],
        },
    },
    # Breakfast and snacks (suggestions only)
    {"title": "Moong Dal Chilla with Mint Chutney", "types": ["breakfast", "snack"],
     "why": "High-protein, low-oil, and naturally lactose-free.",
     "ingredients": ["Moong dal batter", "Onion", "Coriander", "Mint chutney", "Cold-pressed oil"]},
    {"title": "Vegetable Oats Upma", "types": ["breakfast"],
     "why": "Fibre-rich oats with vegetables keep her full without a heavy stomach.",
     "ingredients": ["Rolled oats", "Carrot", "Peas", "Onion", "Mustard seeds", "Curry leaves", "Cold-pressed oil"]},
    {"title": "Idli with Sambar", "types": ["breakfast"],
     "why": "Steamed, light, and easy to digest.",
     "ingredients": ["Rice and urad dal batter (steamed)", "Sambar"]},
    {"title": "Two Boiled Eggs and a Fruit Bowl", "types": ["breakfast", "snack"],
     "why": "Protein plus fibre, ready in ten minutes.",
     "ingredients": ["Eggs", "Seasonal fruits"]},
    {"title": "Roasted Makhana", "types": ["snack"],
     "why": "Crunchy, low-calorie swap for chips and namkeen.",
     "ingredients": ["Makhana", "A teaspoon of ghee", "Salt", "Pepper"]},
    {"title": "Moong Sprouts Chaat", "types": ["snack", "lunch"],
     "why": "Protein and fibre with a tangy lemon kick.",
     "ingredients": ["Moong sprouts", "Onion", "Tomato", "Cucumber", "Lemon", "Chaat masala"]},
    {"title": "Roasted Chana and a Cup of Green Tea", "types": ["snack"],
     "why": "Filling, high-protein evening snack.",
     "ingredients": ["Roasted chana", "Green tea"]},
]
