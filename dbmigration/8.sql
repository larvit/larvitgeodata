INSERT INTO geo_langs VALUES("chi", NULL, "living", "individual");

INSERT INTO geo_langLabels VALUES("prs", "swe", "dari");
INSERT INTO geo_langLabels VALUES("prs", "eng", "Dari");
INSERT INTO geo_langLabels VALUES("cmn", "swe", "mandarin");
INSERT INTO geo_langLabels VALUES("cmn", "eng", "Mandarin Chinese");
INSERT INTO geo_langLabels VALUES("chi", "swe", "Kantonesiska");
INSERT INTO geo_langLabels VALUES("chi", "eng", "Cantonese");
INSERT INTO geo_langLabels VALUES("sme", "swe", "Samiska");
INSERT INTO geo_langLabels VALUES("sme", "eng", "Sami");

UPDATE geo_territoryLabels SET label = "Palestina", `labelShort` = NULL
WHERE `terIso3166_1_alpha_2` = "PS" AND `labelIso639_3` = "swe";
