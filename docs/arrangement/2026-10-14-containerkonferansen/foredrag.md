---
marp: true
size: 16:9
paginate: true
style: |
  section { font-size: 26px; }
  table { font-size: 0.7em; }
  small { font-size: 0.6em; color: #555; }
  img[alt="diagram"] { display: block; margin: 0 auto; max-height: 560px; width: auto; max-width: 100%; }
  section.skille { display: flex; flex-direction: column; justify-content: center; }
  section.skille h2 { font-size: 1.8em; }
  section.skille p { color: #555; }
  section.sporsmal { display: flex; flex-direction: column; justify-content: center; }
  section.sporsmal h2 { font-size: 1.6em; }
---

<!--
Skjelett. Tidsbudsjett, 45 minutter:
  0–5    Innledning, begge
  5–22   Kontrollplanet, Jan Ivar
  22–34  Salmon, Linus
  34–36  Ønskelisten, begge
  36–44  Spørsmål dem imellom: først tre om Salmon fra Jan Ivar, så tre om Dataverket fra Linus
  44–45  Publikum, eller avslutt
Skilleark har class skille, Q&A-bildene class sporsmal.
-->

![bg right:36% 55%](content/dataverket-logo.svg)

# Maskiner som logger inn

Maskinidentitet, delegering og tillit med åpen kildekode

Containerkonferansen | Trondheim, 14. oktober 2026 | Jan Ivar Beddari og Linus Johansen

---

<!-- _class: skille -->

## Hvem er denne maskinen, og på vegne av hvem handler den?

Innledning, 5 minutter, begge

---

## Hvem er vi

- Jan Ivar: Dataverket, et åpent kontrollplan for suveren skyinfrastruktur
- Linus: salmon, en identitetsleverandør for mennesker og arbeidslaster

---

## Hvorfor spørsmålet haster nå

<!-- Agenter, orkestratorer og autonome arbeidslaster handler selv. -->

---

## Tre spørsmål

1. **Tenant-isolasjon**: kan kryss-trafikk gjøres kryptografisk umulig, ikke bare forbudt?
2. **Innlogging uten hemmeligheter**: kan kortlevde tokens erstatte statiske credentials?
3. **Delegering**: kan en maskinhandling spores tilbake til et menneske?

---

<!-- _class: skille -->

## Kontrollplanet

Jan Ivar, 17 minutter

---

## Dataverket på ett bilde

<!-- Sentral (NATS), Identitet (Zitadel), CloudEvents, Go, AGPL. -->

---

## Én organisasjon er ett sikkerhetsdomene

<!-- Spørsmål 1. Organisasjon i Identitet, konto i NATS. -->

---

## Innslipp: autentisering

<!-- Spørsmål 2. Sekvensdiagram, gjenbruk fra BLUG. -->

---

## Innslipp: autorisasjon

<!-- Spørsmål 2. Auth callout, Cedar, signert bruker-JWT. Sekvensdiagram, gjenbruk fra BLUG. -->

---

## Konvolutten bestemmer, ikke innholdet

<!-- CloudEvents, globale ressurs-ID-er, emner. -->

---

## Delegering med RFC 8693

<!-- Spørsmål 3. Token exchange, act-claimet. -->

---

## Hullet

<!-- Zitadels token exchange bytter bare egne tokens. Kontrollplanet trenger egen STS: egen iss, egne nøkler, eget JWKS. Overgang til Linus. -->

---

<!-- _class: skille -->

## Salmon

Linus, 12 minutter

---

## Hva salmon er

---

## Datamodellen

---

## Token exchange, flyten

---

## Hva som mangler

---

<!-- _class: skille -->

## Ønskelisten

Begge, 2 minutter

---

## Til det norske åpen kildekode-fellesskapet

- Modne delegeringsprofiler i identitetsplattformene
- Standardisert identitet for meldinger
- Gjenbrukbare byggeklosser i et kontrollplan

---

<!-- _class: skille -->

## Spørsmål

Dem imellom, 8 minutter. Først tre om Salmon, så tre om Dataverket.

---

<!-- _class: sporsmal -->

## Om Salmon, 1

<!-- Jan Ivar spør, Linus svarer. -->

---

<!-- _class: sporsmal -->

## Om Salmon, 2

<!-- Jan Ivar spør, Linus svarer. -->

---

<!-- _class: sporsmal -->

## Om Salmon, 3

<!-- Jan Ivar spør, Linus svarer. -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 1

<!-- Linus spør, Jan Ivar svarer. -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 2

<!-- Linus spør, Jan Ivar svarer. -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 3

<!-- Linus spør, Jan Ivar svarer. -->

---

## Tre spørsmål, tre svar

1. Tenant-isolasjon:
2. Innlogging uten hemmeligheter:
3. Delegering:

Bli med i Dataverket: medlem@dataverket.org

<!-- Publikum tar over herfra, eller vi avslutter. -->
