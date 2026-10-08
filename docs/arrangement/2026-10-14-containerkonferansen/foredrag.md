---
marp: true
size: 16:9
paginate: true
style: |
  section { font-size: 26px; }
  table { font-size: 0.7em; }
  small { font-size: 0.6em; color: #555; }
  img[alt="diagram"] { display: block; margin: 0 auto; max-height: 500px; width: auto; max-width: 100%; }
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

<!-- Go, AGPL. Alt snakker CloudEvents over NATS. Plattform er Kubernetes, så publikum ser seg selv i bildet. -->

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  H["Menneske<br/>CLI, nettleser"]
  C["controller-pod<br/>i et Kubernetes-cluster"]
  ID["Identitet<br/>Zitadel, OIDC"]
  subgraph S["Sentral"]
    direction TB
    N([NATS-cluster])
    AC["Auth callout<br/>JWT inn, rettigheter ut<br/>Cedar-policy"]
    N --- AC
  end
  M["Maskin<br/>VM og bare metal"]
  NE["Nett<br/>BGP, IPv6, iPXE"]
  O["Objekt<br/>S3"]
  P["Plattform<br/>Kubernetes"]
  H -- "1. token" --> ID
  C -- "1. token" --> ID
  ID -. "JWKS" .-> AC
  H -- "2. CONNECT, CloudEvents" --> N
  C -- "2. CONNECT, CloudEvents" --> N
  N --- M
  N --- NE
  N --- O
  N --- P
```

---

## Én organisasjon er ett sikkerhetsdomene

<!-- Spørsmål 1. Et namespace er en policy-grense: RBAC og NetworkPolicy sier nei. En NATS-konto er en nøkkelgrense: et emne i A finnes ikke i B. Kryss-trafikk krever eksplisitt export/import, per emne. -->

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  subgraph Z["Identitet"]
    direction TB
    OA["org A"]
    OB["org B"]
  end
  subgraph N["Sentral, én NATS-cluster"]
    direction TB
    subgraph KA["konto A, egen signeringsnøkkel"]
      SA["a.maskin.&gt;<br/>a.plattform.&gt;"]
    end
    subgraph KB["konto B, egen signeringsnøkkel"]
      SB["b.maskin.&gt;"]
    end
    subgraph KM["konto maskin, tjenesten"]
      SM["import fra A og B<br/>eksplisitt, per emne"]
    end
  end
  OA -- "token: org=A → konto A" --> KA
  OB -- "token: org=B → konto B" --> KB
  KA x-- "ingen vei, ikke bare forbudt" --x KB
  KA -. export .-> KM
  KB -. export .-> KM
```

Kubernetes: namespace er en policy-grense. NATS: konto er en nøkkelgrense.

---

## Innslipp: fra token til tilkobling

<!-- Spørsmål 2. Slått sammen fra de to BLUG-diagrammene. Poenget for k8s-folk: ingen Secret med langlevd nøkkel, callouten ringer ikke Identitet på den varme stien, og rettighetene lever like lenge som tokenet. Podens vei til et Identitet-token i dag er en nøkkel i en Secret, det er Hullet. -->

```mermaid
%%{init: {"handDrawnSeed": 1}}%%
sequenceDiagram
  actor K as Klient<br/>menneske eller pod
  participant Z as Identitet<br/>Zitadel
  participant N as Sentral<br/>NATS
  participant C as Auth callout
  participant P as Cedar
  K->>Z: menneske: innlogging eller refresh<br/>pod: signert JWT (i dag: nøkkel i en Secret)
  Z-->>K: access token, kort levetid<br/>{iss, sub, org, roller, exp}
  K->>N: CONNECT med token
  N->>C: AuthorizationRequest {token}
  Note over C: 1. signatur mot Identitets JWKS<br/>hentet ved oppstart og ved ukjent kid, aldri per CONNECT
  Note over C: 2. principal: org → konto, roller → grants
  C->>P: principal, konto, katalog av emnemønstre
  P-->>C: tillat eller avslå per mønster
  C-->>N: bruker-JWT signert av callouten<br/>konto, pub/sub-rettigheter, exp = tokenets exp
  N-->>K: tilkoblet
  Note over K,N: ved exp: nytt token, ny CONNECT. Identitet nede rammer bare fornyelsen.
```

---

## Konvolutten bestemmer, ikke innholdet

<!-- Som RBAC: verb, ressurs og namespace avgjør, ikke spec-en. Her: type, ressurs-ID og org i CloudEvent-konvolutten avgjør, og Sentral leser aldri data. Emne- og ID-formatet er illustrasjon, ikke vedtatt. -->

RBAC avgjør på verb, ressurs og namespace. Sentral avgjør på type, ressurs-ID og org.

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  subgraph E["CloudEvent"]
    direction TB
    T["type: maskin.server.create"]
    SU["subject: dvk://a/maskin/server/srv-0042"]
    SRC["source: dvk://a/plattform/controller"]
    D["data: {...}<br/>leses ikke av Sentral"]
  end
  SUBJ["NATS-emne<br/>a.maskin.server.srv-0042.create"]
  J["pub-rettigheter i bruker-JWT<br/>gitt av Cedar ved CONNECT<br/>a.maskin.server.*.create"]
  R{"match?"}
  T --> SUBJ
  SU --> SUBJ
  SUBJ --> R
  J --> R
  R -- ja --> OK["levert til alle som lytter"]
  R -- nei --> NO["avvist av NATS-serveren<br/>meldingen forlater aldri klienten"]
```

---

## Delegering med RFC 8693

<!-- Spørsmål 3. Operatormønsteret: en controller handler på vegne av et menneske. TokenRequest API gir poden et kortlevd SA-token med valgt audience, ingen Secret. STS er planlagt, ikke bygget. -->

```mermaid
%%{init: {"handDrawnSeed": 1}}%%
sequenceDiagram
  actor M as Kari
  participant Z as Identitet
  participant PC as controller-pod<br/>Plattform
  participant A as kube-apiserver<br/>OIDC-utsteder
  participant STS as STS, planlagt
  participant N as Sentral
  M->>Z: innlogging
  Z-->>M: token sub=kari
  M->>PC: «opprett cluster», token følger med
  PC->>A: TokenRequest, aud=sts
  A-->>PC: SA-token<br/>sub=system:serviceaccount:plattform:controller
  PC->>STS: token-exchange<br/>subject_token=kari, actor_token=SA-token, audience=sentral
  Note over STS: begge verifiseres mot hver sin JWKS<br/>may_act: får controller handle for kari?
  STS-->>PC: token sub=kari, act={sub: controller}<br/>aud=sentral, exp 15 min
  PC->>N: CONNECT + CloudEvents
  Note over N: auditlogg per hendelse: sub=kari, act=controller
```

---

## Hullet

<!-- Zitadels token exchange er GA, men bytter bare egne tokens. Clusterets SA-token kommer ikke inn. Kontrollplanet trenger egen STS: egen iss, egne nøkler, eget JWKS, og act, audience og may_act. Overgang til Linus: Salmon har formen. -->

Den stiplede boksen finnes ikke i dag. Linus har begynt å skrive den.

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  Z["Identitet, Zitadel<br/>mennesker og tjenestebrukere"]
  K1["cluster 1<br/>OIDC-utsteder"]
  K2["cluster 2<br/>OIDC-utsteder"]
  ZX["Zitadel token exchange<br/>GA, bytter bare egne tokens"]
  STS["STS<br/>egen iss, egne nøkler, eget JWKS<br/>act, audience, may_act"]
  S["Sentral<br/>auth callout stoler på én utsteder"]
  Z --> ZX
  K1 x-- "kommer ikke inn" --x ZX
  Z --> STS
  K1 --> STS
  K2 --> STS
  STS --> S
  style STS stroke-dasharray: 6 4
```

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
