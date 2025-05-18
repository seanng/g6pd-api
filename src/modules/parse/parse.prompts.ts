const OUTPUT_FORMAT_WITH_EXPLANATION = `
{
  "status": "success" | "error",
  "message": "<error message if status is 'error', otherwise empty>",
  "harmful_ingredients": ["<comma-separated list of harmful ingredients>"] | []
}

The JSON must have:
1. "status": Must be "success" or "error". "success" indicates that none of the "Error Conditions" are met. "error" indicates that one or more "Error Conditions" are met.
2. "message": Empty if status is "success", or specific error message if status is "error"
3. "harmful_ingredients": Array of harmful ingredients found, or empty array if none are found or if there's an error

Do NOT include any explanations, annotations, or additional formatting outside of this JSON structure.
`;

const ERROR_CONDITIONS = `
- The image contains no text.
- Text is too blurry to read.
- Unable to identify a section labeled "ingredients".
- The "ingredients" section is partially cut off or incomplete (e.g., truncated words, missing portions of the list).
- The language of the text is unsupported.
`;

const HARMFUL_INGREDIENTS = `
1. 2-Naphthol (Beta-Naphthol)
2. Acetanilide (Acetanilid)
3. Acetazolamide
4. Acetophenetidin (Phenacetin)
5. Acetylphenylhydrazine (2-Phenylacetohydrazine)
6. Aldesulfone Sodium (Sulfoxone)
7. Aminophenazone (Aminopyrine, Pyramidon, Amidopyrine)
8. Antazoline (Antistine)
9. Antipyrine (Phenazone)
10. Arginine (2-Amino-5-guanidinopentanoic acid)
11. Arsine
12. Ascorbic Acid (Vitamin C)
13. Azathioprine *(use with caution)*
14. Baclofen *(use with caution)*
15. Bean of St. Ignatius (Strychnos ignatii)
16. Benorilate
17. Benzexolo
18. Brinzolamide
19. Bupivacaine
20. Calcium Carboxylate
21. Carbutamide
22. Chloramphenicol
23. Chloroquine
24. Chloroquine + Proguanil
25. Ciprofloxacin
26. Clorguanidine (Proguanil)
27. Colchicine
28. Dapsone (Diaphenylsulfone)
29. Diethylamine
30. Dimenidrinato
31. Dimercaprol
32. Diphenhydramine (Difenilhydramine)
33. Dopamine
34. Dorzolamide
35. Doxorubicin
36. Enoxacin
37. Epirubicin
38. Flumequine
39. Furazolidone
40. Glibenclamide
41. Glibornuride
42. Gliclazide
43. Glimepiride
44. Glipizide
45. Glucosulfone (Glucosulfone Sodium)
46. Hydroxychloroquine
47. Ibuprofen
48. Indigofera Tinctoria
49. Isobutyl Nitrite
50. Isoniazid
51. Lawsone Inermis
52. Levodopa
53. Levofloxacin
54. Lomefloxacin
55. Mefloquine
56. Menadiol Sodium Sulfate (Vitamin K4 Sodium Sulfate)
57. Menadione (Menaphtone, Vitamin K3)
58. Menadione Sodium Bisulfite (Vitamin K3 Sodium Bisulfite)
59. Mepacrine (Quinacrine)
60. Mesalazine (5-Aminosalicylic Acid, Paraminosalicylic Acid)
61. Metamizole
62. Methylthioninium Chloride (Methylene Blue)
63. Morpholine
64. Moxifloxacin
65. Nalidixic Acid
66. Naphthalene (Pure Naphthalene, Naphtalin)
67. Niridazole
68. Nitric Oxide
69. Nitrofural (Nitrofurazone)
70. Nitrofurantoin
71. Nitroglycerin
72. Noramidopyrine
73. Norfloxacin
74. O-Acetylsalicylic Acid (Acetylsalicylic Acid, Aspirin)
   - Combinations:
     - O-Acetylsalicylic Acid + Acetanilide
     - O-Acetylsalicylic Acid + Ascorbic Acid
     - O-Acetylsalicylic Acid + Paracetamol
75. Ofloxacin
76. Oxidase, Urate (Urate Oxidase)
77. Pamaquine
78. Para-Aminobenzoic Acid (4-Aminobenzoic Acid)
79. Paracetamol (Acetaminophen)
   - Combinations:
     - Paracetamol + Propyphenazone
80. Pefloxacin
81. Pentaquine
82. Phenazopyridine
83. Phenylbutazone
84. Phenytoin
85. Phenylhydrazine
86. Phytomenadione (Vitamin K1)
87. Pipemidic Acid
88. Pregabalin *(use with caution)*
89. Prilocaine
90. Primaquine
91. Probenecid
92. Procainamide
93. Procainamide Hydrochloride
94. Propylene Glycol
95. Propyphenazone
96. Pyrimethamine
97. Quinidine
   - Combinations:
     - Quinidine + Phenylhydrazine
     - Quinidine + Quinine
98. Quinine
99. Rasburicase
100. Sodium Nitroprusside
101. Spiramycin
102. Stibophen (2-(2-Oxido-3,5-Disulphonatophenoxy)-1,3,2-Benzodioxastibole-4-6-Disulphonate)
103. Streptomycin
104. Succimer
105. Sulfacetamide
106. Sulfacytine
107. Sulfadiazine
   - Combinations:
     - Sulfadiazine + Trimethoprim
108. Sulfadimidine
109. Sulfadoxine
110. Sulfafurazole (Sulfafurazone, Sulfisoxazole, Gantrisin)
111. Sulfaguanidine
112. Sulfamerazine
113. Sulfamethizole
114. Sulfamethoxazole
115. Sulfamethoxypyridazine
116. Sulfanilamide (Sulphanilamide)
117. Sulfapyridine
118. Sulfasalazine (Salazosulfapyridine, Salazopyrin)
119. Sulfisoxazole (Gantrisin)
120. Sulfoxone
121. Thiamphenicol
122. Thiazosulfone (Thiazolesulfone)
123. Tiaprofenic Acid
124. Tolonium Chloride (Toluidine Blue)
125. Trihexyphenidyl (Benzhexol)
126. Trimethoprim
   - Combinations:
     - Trimethoprim + Sulfamethoxazole
127. Trinitrotoluene (2,4,6-Trinitrotoluene)
128. Tripelennamine
`;

const ADDITIONAL_INSTRUCTIONS = `
- Translate all text into English before checking for harmful ingredients.
- Match ingredients case-insensitively (e.g., "Aspirin" matches "aspirin").
- Include synonyms and scientific names for harmful ingredients in your search.
- If the text is blurry, unclear, or ambiguous, return an error instead of guessing.
- If unsure about an ingredient due to poor image quality or ambiguity, exclude it from the output and flag an error.
- If the "ingredients" section is incomplete or cut off (e.g., truncated words, missing portions of the list), return an error with the message: "The 'ingredients' section is partially cut off or incomplete."
`;

const INSTRUCTIONS = `
Output Format:
Reply strictly in JSON format as follows:
${OUTPUT_FORMAT_WITH_EXPLANATION}

Error Conditions:
${ERROR_CONDITIONS}

Harmful Ingredients:
${HARMFUL_INGREDIENTS}

Additional Instructions:
${ADDITIONAL_INSTRUCTIONS}
`;

export const INITIAL_PROMPT = `
You are an intelligent image parser that reads text from an image containing an ingredient label and identifies whether any of the ingredients are harmful for individuals with G6PD deficiency. The harmful ingredients are listed below in the "Harmful Ingredients" section. You must translate text from multiple languages into English before checking for matches.

${INSTRUCTIONS}
`;

export const RETRY_PROMPT = `
Your previous response did not follow the required format. Please respond EXACTLY as instructed:
`;
