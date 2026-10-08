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

- En controller oppretter, sletter og flytter uten at noen trykket på en knapp
- En agent kaller API-er med credentials den fikk av noen, en gang
- Auditloggen sier *hva* som skjedde og *hvilken maskin* som gjorde det

Den sier sjelden **på vegne av hvem**.

<small>Kubernetes-operatorer, GitOps-controllere, CI-runnere og LLM-agenter er alle maskiner som handler for et menneske som ikke er til stede.</small>

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

<!--
Premissene først, så bildet.
- Alle logger inn ett sted. Ingen lokale brukere, ingen langlevde nøkler.
- Alt som gjøres må logges, og loggen må peke på en identitet.
- Én organisasjon er ett sikkerhetsdomene, kryptografisk, ikke ved policy.
- Koden skal kunne kjøres og driftes uten oss.
Kravene er de samme som i NSM 2.1, 2.6, 2.7, CRA vedlegg I og DFØ B.IS.30–32. Vi bygger dem inn, ikke oppå.

Bildet: Go, AGPL v3. Meldinger over NATS, alle som CloudEvents. Identitet er Zitadel i dag.
To principals til venstre: et menneske og en controller-pod. Begge henter token fra Identitet, begge kobler til Sentral på samme måte. Plattform er Kubernetes, så dere er allerede i bildet.
-->

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

<!--
Spørsmål 1: kan kryss-trafikk gjøres umulig, ikke bare forbudt?
- En NATS-konto har egen signeringsnøkkel. Et emne i konto A finnes ikke i konto B.
- Hver organisasjon i Identitet blir én konto for mennesker og maskiner.
- Hver tjeneste har sin egen konto, og importerer eksplisitt, emne for emne.
- Ingen policy å glemme, ingen regel som kan skrives feil.
I Kubernetes stopper NetworkPolicy trafikken. Her finnes det ingen trafikk å stoppe.
Kontoen er grensen. Auth callout bestemmer hvem som slipper inn i den, neste bilde.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  subgraph Z["Identitet"]
    direction TB
    OA["org A"]
    OB["org B"]
  end
  subgraph N["Sentral, ett NATS-cluster"]
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

<!--
Spørsmål 2: kan kortlevde tokens erstatte statiske credentials? Slått sammen fra de to BLUG-diagrammene.
Callouten gjør lite, med vilje:
- Verifiserer signaturen mot Identitets JWKS, hentet ved oppstart og ved ukjent kid. Aldri per CONNECT.
- Bygger principal fra claims: org gir konto, roller gir rettigheter.
- Spør Cedar: hvilke emnemønstre får denne principalen publisere og abonnere på?
- Svarer NATS med en signert bruker-JWT som utløper når tokenet utløper.
Ingen kall til Identitet på den varme stien. Identitet nede rammer bare fornyelsen.
Mennesker har ingen hemmeligheter å rotere. Poder har det fortsatt: i dag en signert JWT med nøkkel i en Secret. Det er hullet, og vi kommer dit.
Cedar er policyspråket, samme som i Salmon.
-->

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

<!--
Emne- og ID-formatet er illustrasjon, ikke vedtatt.
- Kommandoer, hendelser, spørringer og svar, samme konvolutt. CloudEvents 1.0.
- Alle ressurser har en global ID som kan stå i en regel.
- Emnet utledes av konvolutten, og rettighetene er emnemønstre gitt ved CONNECT.
- Sentral leser aldri data. Den trenger ikke å forstå tjenesten for å beskytte den.
Auditloggen er konvolutten pluss principalen. Den finnes før tjenesten har sett meldinga.
Samme mønster som RBAC: avgjørelsen tas på verb, ressurs og namespace, ikke på spec.
-->

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

<!--
Spørsmål 3: kan en maskinhandling spores tilbake til et menneske? Operatormønsteret: en controller handler på vegne av Kari.
- sub er mennesket. act er maskinen som handler for det. Kjeden kan nestes: controller for pipeline for Kari.
- may_act sier hvem som får handle for hvem, bestemt der tokenet byttes.
- 15 minutters levetid. aud er mottakeren, ikke utstederen.
Poden trenger ingen Secret. TokenRequest gir et kortlevd SA-token med den audiencen vi ber om, og clusterets egen OIDC-utsteder signerer det.
Hver hendelse i Sentral kan spores til en person, også når en maskin sendte den.
STS er planlagt, ikke bygget. RFC 8693 §4.1 act, §4.4 may_act. Kubernetes: projected ServiceAccount tokens, TokenRequest API, issuer discovery.
-->

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

<!--
Det vi trenger av en STS:
- Egen iss, egne signeringsnøkler, eget JWKS. Tjenester verifiserer mot én utsteder.
- Tar imot Zitadels tokens for mennesker og tjenestebrukere.
- Tar imot SA-tokens fra hvert clusters innebygde OIDC-utsteder.
- Utsteder sub, act, aud, org og roller, slik callouten vil ha dem.
- Håndhever may_act.
Zitadels token exchange er GA, men bytter bare Zitadels egne tokens. Keycloak og de andre er bygget for mennesker.
Dette må alle som trenger delegert maskinidentitet bygge selv i dag. Linus har begynt. Overgang.
-->

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
