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
  section.foto .kilde { position: absolute; right: 30px; bottom: 30px; padding: 0.3em 0.6em; background: rgba(0, 0, 0, 0.75); color: #fff; font-size: 0.75em; border-radius: 4px; }
  section.foto .kilde a { color: #fff; }
---

<!--
Skjelett. Tidsbudsjett, 45 minutter:
  0–5    Innledning, begge
  5–22   Kontrollplanet, Jan Ivar
  22–34  Salmon, Linus
  34–36  Ønskelista, begge
  36–44  Spørsmål dem imellom: ett fra Jan Ivar til Linus, to fra Linus til Jan Ivar, til slutt hva Dataverket er
  44–45  Publikum, eller avslutt
Skilleark har class skille, Q&A-bildene class sporsmal.
-->

![bg right:36% 55%](content/dataverket-logo.svg)

# Maskiner som logger inn

Maskinidentitet, delegering og tillit med åpen kildekode

Containerkonferansen | Trondheim, 14. oktober 2026
Jan Ivar Beddari og Linus Johansen

---

<!-- _class: foto -->
<!-- _paginate: false -->

![bg](content/nrk-koid32005624.jpg)

<div class="kilde">Kilde: <a href="https://tv.nrk.no/program/KOID32005624">https://tv.nrk.no/program/KOID32005624</a></div>

---

<!-- _class: skille -->

## Hvilken maskin er dette, og hvem kjører hva på den?

---

## Hvorfor står vi her

<!--
Jan Ivar: UH-sky og Safespring var hendelsesdrevne kontrollplan med mennesker og maskiner på samme buss. I Dataverket er poder principals fra dag én, og de logger inn i dag med en nøkkel i en Secret.
Linus: identitetsplattformene er laget for mennesker. RFC 8693 er lest, men ikke ferdig implementert noe sted. Derfor salmon.
Vi fant hverandre fordi vi manglet det samme.
-->

- Jan Ivar: UH-sky / NREC, ti år i Safespring med hendelsesdrevne kontrollplan. Ideen om Dataverket - et åpen kildekode-kontrollplan for suveren skyinfrastruktur
- Linus: salmon, en identitetsleverandør for mennesker og arbeidslaster, skrevet fordi de som finnes er bygget for mennesker
- Vi fant samme mangel fra hver vår side: maskiner med behov for å jobbe på vegne av mennesker, utenfor clusteret de bor i

---

## I dag: hvilken prosess på hvilken maskin er dette?

<!--
Et eksempel på ServiceAccount-token, slik det ser ut i dag. Alle i salen har tusenvis av dem.
- Kort levetid, bundet til poden, signert av clusterets egen OIDC-utsteder med discovery og JWKS.
- RBAC sjekker verb, ressurs og namespace. Loggen i kube-apiserver vet hvem som gjorde hva.
Første halvdel av spørsmålet er besvart, så langt clusteret rekker.
- Potensielt problem: Det er ikke noen referanser til mennesket i tokenet.
Men med egen utsteder per cluster, egen iss med discovery og JWKS, kan noen utenfor stole på tokenet. Det kommer vi tilbake til.
-->

```json
{
  "iss": "https://kubernetes.default.svc.cluster.local",
  "sub": "system:serviceaccount:plattform:controller",
  "aud": ["https://kubernetes.default.svc.cluster.local"],
  "exp": 1791979500,
  "kubernetes.io": {
    "namespace": "plattform",
    "serviceaccount": { "name": "controller", "uid": "…" },
    "pod": { "name": "controller-6c9d4-x7k2p", "uid": "…" },
    "node": { "name": "node-07", "uid": "…" }
  }
}
```

Prosess og maskin står i tokenet, men med standardoppsett bare innenfor ett cluster: `iss` er den samme overalt.

Ingen claim sier hvilket **menneske som har ansvaret**.

---

## I dag: clusteret er grensen

<style scoped>img { max-height: 330px; }</style>

<!--
Kari gjør kubectl apply. Loggen i kube-apiserver sier kari. Controlleren ser endringen og skal gjøre noe utenfor: et kontrollplan, en sky-API, et annet cluster, en meldingsbuss.
Tilgangen ut av clusteret er i dag en statisk nøkkel i en Secret. Et menneske laget den én gang, og den lever til noen husker å bytte den. 
To tidsskalaer, samme hull. Interaktivt: Kari gjør noe nå, controlleren gjør det for henne. Over tid: en jobb som skriver til en S3-bøtte hos en annen operatør hver natt, med en access key noen laget i fjor. Begge må kunne spores til et menneske.
På den andre siden sier loggen «controller». Kari er borte.
De store skyleverandørene har løst dette for sine egne tjenester: IRSA hos AWS, Workload Identity Federation hos Google og Azure. Samme projiserte token, vekslet inn i en kortlevd nøkkel. Åpne identitetsløsninger er laget for mennesker og mangler tilsvarende. Zitadel veksler bare egne tokens. Keycloak 26.8 har delegering med act i preview, men bare med brukerens eget token mens hun er logget inn. SA-tokenet kan den ta som klientinnlogging. OpenBao løser første halvdel: JWT-innlogging mot clusterets discovery og JWKS, med streng aud-sjekk. Men den har verken token exchange eller act, så mennesket blir ikke med.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart TB
  subgraph K["cluster, én tillitsgrense"]
    direction LR
    M["Kari"]
    API["kube-apiserver<br/>auditlogg: sub=kari"]
    C["controller-pod<br/>SA-token, kort levetid,<br/>bundet til poden"]
    M -- "kubectl apply<br/>token sub=kari" --> API
    API -- "watch" --> C
  end
  subgraph U["utenfor"]
    direction LR
    X["kontrollplan, sky-API,<br/>S3-bøtte hos en annen operatør"]
    L["auditlogg: controller<br/>på vegne av hvem: ukjent"]
    X --> L
  end
  K -- "Secret med access key, laget av et menneske, en gang" --> U
```

Tilgang ut av clusteret er vanligvis en statisk nøkkel. De store skyleverandørene har løst dette med **workload identity federation**.

---

## Det haster å finne bedre løsninger

<!--
Operatormønsteret er ti år gammelt, og vi har levd med at loggen sier «controller». En agent er noe annet: den velger selv hva den gjør, med nøkler noen ga den én gang.
Når maskinen bare gjør det koden sier, følger handlingen av noe et menneske skrev. Da går det an å finne mennesket i etterkant: ressursen i clusteret, git-historikken, hvem som godkjente. Tungvint, men mulig. Når maskinen velger selv, følger ikke handlingen av koden lenger, og samme agent jobber på vegne av mange mennesker. Koden peker på den som satte agenten i gang, ikke på den som ba om akkurat denne handlingen. Det står ingen steder, med mindre det ble registrert idet det skjedde. Derfor må mennesket finnes i tokenet og logges når det skjer.
-->

- Operatorer, GitOps-controllere og CI-runnere har gjort jobben for oss i ti år. Vi har godtatt at loggen sier «controller»
- En agent velger selv hva den gjør, med nøkler noen ga den én gang
- Loggen sier *hva* som ble gjort og *hvilken maskin* som gjorde det. Den sier sjelden **hvilket menneske som sto bak**

Når maskinen bare gjør det koden sier, kan vi finne mennesket i etterkant, i koden og i ressursen. Når maskinen velger selv, må mennesket finnes i tokenet og logges når det skjer.

---

## Ett problem, to halvdeler

<!--
Dette er disposisjonen. Første halvdel har Dataverket svar på, og Jan Ivar viser hvordan: organisasjon blir konto, token blir tilkobling, konvolutten avgjør. Andre halvdel er hullet. Jan Ivar viser hvor det er, Linus viser det han har bygget som kan hjelpe å fylle det. Til slutt ønskelista.
-->

**Hvilken prosess på hvilken maskin er dette?**

Server, VM eller pod: hvilken organisasjon hører den til, og hvordan beviser den det uten en nøkkel? Det har vi svar på. Jan Ivar viser hvordan Dataverket sitt kontrollplan er bygget.

**Men HVEM kjører hva på den??!**

Mennesket med ansvar for prosessen må følge med i tokenet! Ingen åpen kildekode-løsning har gode svar på dette i dag. Linus har begynt på relevant kode!

Til slutt: Vår ønskeliste til alle, så hver av oss slipper å bygge dette alene.

---

<!-- _class: skille -->

## Kontrollplanet

Hvilken prosess på hvilken maskin er dette?

Målbildet: 3 000 clustere i 300 sikkerhetsdomener.

<!--
Det er annerledes enn de fleste: ikke ett stort cluster med mange team, men mange clustere, hvert med sin egen OIDC-utsteder, fordelt på mange organisasjoner som ikke skal kunne se hverandre.
- 300 sikkerhetsdomener er 300 organisasjoner, og 300 NATS-kontoer med egen nøkkel. Neste slides.
- 3 000 utstedere betyr at tillit til et cluster må registreres selvbetjent, av den som eier det, ikke konfigureres sentralt én og én. Én mount eller én IdP per cluster, slik OpenBao og Keycloak gjør det, skalerer dårlig hit.
-->

---

## Dataverket på ett bilde

<!--
Premissene først, så bildet.
- Alle logger inn ett sted. Ingen lokale brukere, ingen langlevde nøkler.
- Alt som gjøres må logges, og loggen må peke på en identitet.
- Én organisasjon er ett sikkerhetsdomene, kryptografisk, ikke bare ved policy.
- Koden skal kunne kjøres og driftes uten oss.
Kravene er de samme som i NSM 2.1, 2.6, 2.7, CRA vedlegg I og DFØ B.IS.30–32. Vi bygger dem inn, ikke oppå.

Bildet: Go, AGPL v3. Meldinger over NATS, alle som CloudEvents. Identitet er Zitadel i dag.
To principals til venstre: et menneske og en controller-pod. Begge henter token fra Identitet, begge kobler til Sentral på samme måte. Plattform er Kubernetes.

kube-apiserver i Plattform bruker også Identitet, med kubelogin. Kari har samme sub i clusterets auditlogg som i Sentral. Det er forutsetningen for delegeringsslidet.
Dette er status nå. Poden henter token fra Identitet med en nøkkel i en Secret. STS-en og Salmon kommer på de tre siste slidene i min del.
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
  ID -. "OIDC for kube-apiserver, kubelogin" .-> P
```

---

## Én organisasjon er ett sikkerhetsdomene

<!--
Hvilken maskin er dette, første del: hvilken organisasjon. Kryss-trafikk skal være umulig ved nøkkel, ikke sperret av en regel.

- En NATS-konto har egen signeringsnøkkel. Et emne i konto A finnes ikke i konto B.
- Hver organisasjon i Identitet blir én konto for mennesker og maskiner.
- Hver tjeneste har sin egen konto, og importerer eksplisitt, emne for emne.
- Ingen policy å glemme eller regler som kan skrives feil.

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
  KA x-- "umulig å lese: nøkkel, ikke regel" --x KB
  KA -. export .-> KM
  KB -. export .-> KM
```

Kubernetes: namespace er en policy-grense. NATS: konto er en nøkkelgrense.

---

## Innslipp: tilkobling til kontrollplanet

<!--
Hvilken maskin er dette, andre del: hvordan beviser den det. Kortlevde tokens, ingen statiske credentials. Slått sammen fra de to BLUG-diagrammene.
Callouten gjør lite, med vilje:
- Verifiserer signaturen mot Identitets JWKS, hentet ved oppstart og ved ukjent kid. Aldri per CONNECT.
- Bygger principal fra claims: org gir konto, roller gir rettigheter.
- Spør Cedar: hvilke emnemønstre får denne principalen publisere og abonnere på?
- Svarer NATS med en signert bruker-JWT som utløper når tokenet utløper.
- Tilkoblingen logges: hvem, hvilken konto, hvilke rettigheter, hvor lenge. Loggen starter ved døra. De neste to slidene bygger på den.
Ingen kall til Identitet på den varme stien. Identitet nede rammer bare fornyelsen.
Mennesker har ingen hemmeligheter å rotere. Prosesser har det fortsatt: i dag en signert JWT med nøkkel i en Secret. Det er hullet, og vi kommer dit.
Cedar er policyspråket, samme som i Salmon.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "sequence": {"width": 175}}}%%
sequenceDiagram
  actor K as Klient<br/>menneske eller prosess
  participant Z as Identitet<br/>Zitadel
  participant N as Sentral<br/>NATS
  participant C as Auth callout
  participant P as Cedar
  participant L as Auditlogg
  K->>Z: menneske: innlogging eller refresh<br/>prosess: signert JWT (i dag: nøkkel i en Secret)
  Z-->>K: access token, kort levetid<br/>{iss, sub, org, roller, exp}
  Z->>L: innlogging, sub
  K->>N: CONNECT med token
  N->>C: AuthorizationRequest {token}
  Note over C: 1. signatur mot Identitets JWKS<br/>hentet ved oppstart og ved ukjent kid, aldri per CONNECT
  Note over C: 2. principal: org → konto, roller → grants
  C->>P: hvilke emnemønstre?
  P-->>C: tillat eller avslå per mønster
  C-->>N: bruker-JWT signert av callouten<br/>konto, pub/sub-rettigheter, exp = tokenets exp
  N->>L: tilkobling: sub, konto, rettigheter, exp
  N-->>K: tilkoblet
  Note over K,N: ved exp: nytt token, ny CONNECT. Identitet nede rammer bare fornyelsen.
```

---

## En melding i Sentral

<!--
Dette er det som går over bussen. Kommandoer, hendelser, spørringer og svar har samme konvolutt. CloudEvents 1.0, CNCF, samme som Knative bruker.
- type sier hva. source sier hvilken prosess som sendte. subject sier hvilken ressurs det gjelder.
- Alle ressurser har en global ID som kan stå i en regel. Formatet følger ARN: tjeneste, region, org, type og ID. Illustrasjon, ikke vedtatt.
- data er tjenestens sak. Sentral leser den aldri, og trenger ikke forstå tjenesten for å beskytte den.
-->

```json
{
  "specversion": "1.0",
  "type": "maskin.server.create",
  "source": "dvk:plattform:r1:a:controller/maskin",
  "subject": "dvk:maskin:r1:a:server/srv-0042",
  "id": "…",
  "time": "2026-10-14T11:07:12Z",
  "data": { "cpu": 64, "minne": "512G", "nett": "…" }
}
```

Kommandoer, hendelser, spørringer og svar: samme konvolutt. CloudEvents 1.0, CNCF.

Sentral leser aldri `data`. Resten er nok til å rute, tillate og logge.

---

## Konvolutten bestemmer, ikke innholdet

<style scoped>img { max-height: 420px; }</style>

<!--
Samme melding som forrige slide.
- Emnet utledes av type og subject. Rettighetene er emnemønstre gitt ved CONNECT, så serveren matcher uten å lese noe annet. Cedar ble evaluert én gang, ved CONNECT, og er ikke med når meldinga sendes.
- Avvises meldinga, er det NATS-serveren som avviser den, og ingen tjeneste ser den.
Auditloggen er principalen fra CONNECT pluss konvolutten: hvem, hva og hvilken ressurs. Den finnes før tjenesten har sett meldinga. I dag er «hvem» prosessen.
Når STS-en kommer, er det bare principal-boksen som endres. Neste slide.
Samme mønster som RBAC: den sjekker bare verb, ressurs og namespace, aldri spec.
-->

RBAC sjekker bare verb, ressurs og namespace. Sentral sjekker bare type, ressurs-ID og org.

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  P["principal fra CONNECT<br/>sub=controller"]
  J["pub-rettigheter<br/>i bruker-JWT<br/>Cedar, ved CONNECT<br/>a.maskin.server.*.create"]
  K["konvolutten<br/>per melding<br/>type + subject"]
  SUBJ["NATS-emne<br/>a.maskin.server.srv-0042.create"]
  R{"NATS-serveren:<br/>emne mot mønster?"}
  P --> J --> R
  K --> SUBJ --> R
  R -- ja --> OK["levert til alle som lytter"]
  R -- nei --> NO["avvist av NATS-serveren<br/>ingen tjeneste ser den"]
  OK --> LOG["auditlogg: principal + konvolutt<br/>hvem, hva, hvilken ressurs<br/>før tjenesten har sett meldinga"]
```

---

## HVEM kjører hva: workload-delegering med RFC 8693

<!--
Andre halvdel: controlleren jobber på vegne av Kari, nå uten Secret. Ingenting i Sentral endres fra forrige slide. STS-en bytter bare principalen: sub=kari, act=controller.
- Grant: Kari registrerer workloaden (issuer, sub) og gir granten én gang, med sitt eget token, gjennom Sentral. Revokering er en delete. Som en federated credential i Azure, men mennesket blir med ut.
- Eier: Plattform merker ressursen eier=kari fra den verifiserte brukeren. Eieren velger hvilken grant controlleren bruker. Controlleren ser aldri tokenet til Kari.
- Vekslingen: SA-tokenet mot clusterets JWKS, granten finnes og er ikke slettet, eieren er kari. Cedar sjekker alle tre.
- Ingen Secret: TokenRequest gir et kortlevd SA-token med aud=sts. Tokenet ut lever 15 minutter, med aud=sentral.
- Samme grant dekker nattjobben mot en S3-bøtte hos Objekt. Neste slide.
Hver hendelse i Sentral kan spores til en person. STS-en er planlagt, ikke bygget.
Reserve: RFC 8693 §4.1 act, §4.4 may_act. Kjeden kan nestes: controller for pipeline for Kari. Ressurser: identitet.workload.create, identitet.grant.create. Eier settes av en mutating webhook og låses med ValidatingAdmissionPolicy, slik Rancher gjør med field.cattle.io/creatorId. I Maskin og Objekt kommer eieren fra principalen i hendelsen som opprettet ressursen. AWS SourceIdentity følger en rollekjede på samme måte.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "sequence": {"width": 175}}}%%
sequenceDiagram
  actor M as Kari
  participant Z as Identitet
  participant A as kube-apiserver<br/>OIDC mot Identitet,<br/>egen utsteder
  participant PC as controller-pod<br/>Plattform
  participant STS as STS, planlagt
  participant N as Sentral
  participant L as Auditlogg
  M->>Z: workload identity-API, én gang:<br/>registrer controller (issuer, sub), gi grant for kari
  Z->>L: grant opprettet: dvk:identitet:r1:a:grant/…, sub=kari
  M->>Z: kubelogin
  Z-->>M: token sub=kari, org=a
  Z->>L: innlogging, sub=kari
  M->>A: kubectl apply
  A->>L: kubectl apply, sub=kari
  Note over A: Plattform merker ressursen: eier=kari
  A-->>PC: watch
  PC->>A: TokenRequest, aud=sts
  A-->>PC: SA-token, aud=sts<br/>sub=system:serviceaccount:<br/>plattform:controller
  PC->>STS: token-exchange<br/>actor_token=SA-token<br/>for kari, eier av ressursen, audience=sentral
  Note over STS: SA-token mot clusterets JWKS<br/>granten i Identitet finnes og er ikke slettet<br/>bevist: Kari ga lov med sitt eget token
  STS->>L: veksling: sub=kari, act={sub: controller}, grant ok
  STS-->>PC: token sub=kari, act={sub: controller}<br/>aud=sentral, exp 15 min
  PC->>N: CONNECT + CloudEvents
  N->>L: tilkobling og hver hendelse<br/>sub=kari, act={sub: controller}
```

---

## Hullet

<style scoped>img { max-height: 380px; }</style>

<!--
Det vi trenger av en STS:
- Egen iss, egne signeringsnøkler, eget JWKS. Tjenester verifiserer mot én utsteder.
- Tar imot Zitadels tokens for mennesker og tjenestebrukere.
- Tar imot SA-tokens fra hvert clusters innebygde OIDC-utsteder.
- Utsteder sub, act, aud, org og roller, slik callouten vil ha dem.
- Leser workloads og grants fra Identitet, der de er ressurser med egen ID: hvem får jobbe på vegne av hvem, i hvilken org, til granten slettes. may_act som ressurs, slik Salmon alt lagrer tillit til en workload som par av issuer og subject.
Zitadels token exchange er GA, men bytter bare Zitadels egne tokens. Keycloak har act i preview, men bare for den som er logget inn, og bare med Keycloaks egne tokens.
Objekt-tilfellet: jobben i clusteret veksler sitt SA-token hos STS-en mot et token med sub=kari og act=jobb, på samme slags grant som på forrige slide, gitt én gang og mulig å trekke tilbake. Objekt-gatewayen tar det tokenet i AssumeRoleWithWebIdentity og gir S3-nøkler som lever i timer, ikke år. Gatewayens egen logg navngir mennesket. Både versitygw og RadosGW gjør dette i dag, mot et token fra en utsteder de stoler på.
Dette må alle som trenger selvbetjent maskinidentitet bygge selv i dag: et workload identity-API der mennesket selv registrerer workloaden og gir granten, som på forrige slide. Linus har begynt. Overgang.
-->

Den stiplede boksen finnes ikke i dag. Linus har begynt å skrive den. Samme token åpner en S3-bøtte hos Objekt, uten access key i en Secret.

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  Z["Identitet, Zitadel<br/>mennesker og tjenestebrukere"]
  K1["cluster 1<br/>OIDC-utsteder"]
  K2["cluster 2<br/>OIDC-utsteder"]
  ZX["Zitadel token exchange<br/>GA, bytter bare egne tokens"]
  STS["STS<br/>egen iss, egne nøkler, eget JWKS<br/>act, audience, grants som ressurser"]
  S["Sentral<br/>auth callout stoler på én utsteder"]
  O["Objekt<br/>AssumeRoleWithWebIdentity,<br/>kortlevde S3-nøkler"]
  Z --> ZX
  K1 x-- "kommer ikke inn" --x ZX
  Z --> STS
  K1 --> STS
  K2 --> STS
  STS --> S
  STS -- "sub=kari, act=jobb,<br/>grant gitt én gang" --> O
  style STS stroke-dasharray: 6 4
```

---

<!-- _class: skille -->

## Salmon

Vi er per dags dato blitt veldig gode på strømlinjeforming av menneskelig autentisering.
Men maskiner, not so much.

Eksempel fra min erfaring i NHN.

---

## Alarmathan

Flere hundre instanser av Alertmanager, med integrasjoner mot Splunk, Zabbix og SCOM.

- mTLS, nei.
- API-nøkler, nei.
- Service accounts fra 2002, nei.
- OpenID, ja!

---

## Hva salmon er

En identitet som ikke bare er menneskelig. En issuer for både mennesker og workloads.

- En IDP for identiteter, ikke bare mennesker
- Selvbetjening som hovedprinsipp
- Et ønske om å møte klienten på midten
- Sikkerhet og oversikt

<!--
Det er teamet som eier tjenesten, og dermed tilgangen til å delegere. Det skal være selvbetjent, ingen budbringer involvert.
Salmon skal møte klientene sine behov, ikke omvendt.
Salmon skal gjøre det enkelt for utviklere å etablere gode løsninger for autentisering. Målet er å gjøre slutt på sjonglering av API-nøkler, Keycloak og service accounts.
-->

---

## Hvorfor orke et elegant oppsett nå?

<!--
Modellene skriver mye av koden i dag, også hos oss. Da er spørsmålet ikke om det blir gjort feil, men hvor åpenbare de er og hvor langt de rekker.
- Forutsigbar modell: få konsepter (team, rolle, bevis, token), én vei inn. Da har modellen mindre å gjette, og gjetter sjeldnere feil.
- Rotete oppsett er der modellen finner opp: en API-nøkkel limt inn i en .env, en service account med for mye tilgang, en kopi av en hemmelighet i en repo.
- Kortlevde tokens med en identitet bak gjør at en feil er avgrenset og sporbar. En statisk nøkkel som havner på feil sted lever i et år.
- Elegant betyr ikke komplisert. Det betyr at det riktige er det enkleste å gjøre, for mennesker og modeller.
Ikke et argument mot å bruke modeller. Et argument for å gi dem noe forutsigbart å jobbe mot.
-->

- Modellene skriver koden. Vi eier feilene
- En forutsigbar modell gir modellen mindre å gjette på, og dermed færre åpenbare feil
- Den enkleste veien bør også være den riktige: team, rolle, bevis, token
- Kortlevd identitet avgrenser en feil. En statisk nøkkel gjør det ikke

---

## Datamodellen

Salmon er bygget rundt en team-drevet modell.

- Et team kan ha flere tjenester
- En tjeneste kan ha flere roller
- En rolle kan ha flere utlån
- Et team kan ha flere apps og identiteter
- En identitet kan ha flere roller

---

## Visualisert

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  subgraph A["Team DNS"]
    direction TB
    SA["Tjeneste: dns"]
    RA["Rolle: dns.editor<br/>eies av team DNS"]
    SA --- RA
  end
  subgraph B["Team LB"]
    direction TB
    RB["dns.editor<br/>lånt fra team DNS"]
    K["Kari<br/>menneske"]
    W["lb-controller<br/>workload"]
    CR["credential: oidc<br/>issuer + subject"]
    RB -- "delegerer selv" --> K
    RB -- "delegerer selv" --> W
    W --- CR
  end
  RA -. "låner bort" .-> RB
  style RB stroke-dasharray: 6 4
```

---

<!-- _class: skille -->

## Token exchange, flyten

Kort forklart: Et bytte av et bevis mot en identitet noen andre stoler på.

---

## Token exchange, grundig forklart

<!--
A kommer med et bevis og sier hvilken applikasjon den vil til.
Salmon gjør to ting. Først: hvem er dette? Så: hva får den gjøre mot akkurat denne applikasjonen? Det er teamet som eier B som bestemmer.
Svaret legges i tokenet: identiteten, hvor det gjelder, hva det gir tilgang til, og hvor lenge.
Koble til datamodellen: det er her utlånte roller virker. Har team DNS lånt dns.editor til team LB, og LB gitt den videre til Kari, ender det som en rolle i tokenet.

Teknisk: dette er /token-endepunktet i aksjon.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "sequence": {"width": 175}}}%%
sequenceDiagram
  actor A as Identitet A<br/>menneske eller workload
  participant S as Salmon
  A->>S: bevis + hvilken applikasjon<br/>jeg vil til (B)
  Note over S: 1. Hvem er dette?<br/>beviset sjekkes og byttes mot<br/>en identitet vi stoler på
  Note over S: 2. Hva får A gjøre mot B?<br/>team C bestemmer<br/>f.eks. bucket.read
  S-->>A: token<br/>identitet A, gjelder bare hos B,<br/>bucket.read, kort levetid
```

---

## Hva er et bevis?

- En service account fra 2002?
- En SPIFFE-identitet (SVID)
- Et sertifikat
- En Kubernetes service account
- En potet, neida.

<!--
Protokollen setter ingen grenser for hva som er et bevis. Det handler om hva man definerer som sikkert.
Protokollen er utvidbar og kan tilpasses behov. Salmon støtter JWT i dag, resten er hva vi kan bygge.
Pause før poteten.
-->

---

## Under panseret: /token

<!--
Selve byttet er ett POST-kall: A sender beviset sitt til utstederen.
- grant_type sier at dette er et bytte (RFC 8693)
- subject_token er beviset, subject_token_type sier hva slags bevis det er
- audience er applikasjonen A vil til
Svaret er et nytt token, utstedt av den vi byttet hos.
Eksempelet bruker Zitadel for å vise formen. Zitadel støtter ikke dette byttet, men Salmon har samme endepunkt og tar imot nøyaktig det samme kallet, bare med Salmons adresse.
-->

```bash
curl -s https://zitadel.dataverket.org/oauth/v2/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:token-exchange \
  -d subject_token="$BEVIS" \
  -d subject_token_type=urn:ietf:params:oauth:token-type:jwt \
  -d audience=applikasjon-b
```

```json
{
  "access_token": "eyJhbGciOi…",
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
  "token_type": "Bearer",
  "expires_in": 900
}
```

Eksempel på formen, forkortet.

---

## Applikasjonen verifiserer

<!--
Applikasjon B stoler på Salmon, ikke på A. Den sjekker at tokenet er ekte, at det er laget for den, og at tilgangen står der.
Nøklene henter B én gang. Salmon er ikke på den varme stien, så en Salmon som er nede stopper bare nye tokens.
Poenget å ende på: B trenger ikke å vite noe om hvordan A beviste hvem den var.
-->

```mermaid
%%{init: {"handDrawnSeed": 1, "sequence": {"width": 175}}}%%
sequenceDiagram
  actor A as Identitet A
  participant B as Applikasjon B<br/>eies av team C
  participant S as Salmon
  A->>B: kall med token
  Note over B: Er tokenet ekte, ikke utløpt<br/>og laget for meg?<br/>Står bucket.read i det?
  S-->>B: signeringsnøkler, hentet én gang<br/>ikke per kall
  B-->>A: tillatt
```

B spør ikke Salmon for hvert kall. Svaret ligger i tokenet: hvem, hvilken applikasjon, hva.

---

## Under panseret: hvorfor henter B openid-configuration?

<!--
B har fått et token og må avgjøre om det er ekte. Den har ingen nøkler fra før, og skal ikke ha det heller.
1. Tokenet sier selv hvem som har utstedt det (iss) og hvilken nøkkel som signerte det (kid i headeren).
2. B stoler bare på utstedere den er satt opp til å stole på. Står iss ikke på listen, er det over.
3. B spør utstederen hvor nøklene er: GET {iss}/.well-known/openid-configuration. Det er discovery. Svaret peker på jwks_uri.
4. B henter nøklene fra jwks_uri (offentlige nøkler), velger den med riktig kid og sjekker signaturen.
5. Så sjekker den resten: iss stemmer, aud er meg, exp har ikke gått ut, rollen står der.
Poenger:
- Ingen hardkodede nøkler. Utstederen kan bytte nøkkel uten at B må endres: B henter på nytt når den ser en ukjent kid.
- B henter dette én gang og husker det, ikke per kall. Utstederen er ikke på den varme stien.
- Samme prosedyre virker mot Zitadel, Salmon, og alt annet som følger OIDC. Her vist mot Zitadel.
-->

```bash
curl -s https://zitadel.dataverket.org/.well-known/openid-configuration \
  | jq '{issuer, token_endpoint, jwks_uri}'
```

```json
{
  "issuer": "https://zitadel.dataverket.org",
  "token_endpoint": "https://zitadel.dataverket.org/oauth/v2/token",
  "jwks_uri": "https://zitadel.dataverket.org/oauth/v2/keys"
}
```

1. Tokenet sier hvem som utstedte det (`iss`) og hvilken nøkkel som signerte det (`kid`)
2. B spør utstederen hvor nøklene er (`jwks_uri`)
3. B sjekker signatur, mottaker, og at tokenet ikke er utløpt

---

## Visjonen: ett rammeverk for klienter

<!--
Skisse, ikke implementert. Poenget er hvordan det skal føles å bruke Salmon.
- Klienten sier hva den har (et bevis, her en Kubernetes service account) og hvem den vil til (audience). Resten er Salmons sak.
- Ingen hemmeligheter i koden. Ingen token-håndtering, ingen discovery, ingen fornying.
- Bevistypen kan byttes uten at resten endres. Det er «hva er et bevis» som kode.
- Mindre å gjøre feil på, for mennesker og for modeller.
Salmon gir klienten et token. Det applikasjonen gjør med det (her å skrive til en bøtte) er applikasjonens sak.
-->

```go
client, err := salmon.New().
    WithContext(ctx).
    WithAuth(salmon.OidcAuth(salmon.Kubernetes())).
    WithAudience("applikasjon-b")

app.
    WithContext(ctx).
    WithClient(client).
    WriteBucket("my-bucket", bucketData{})
```

Skisse, ikke implementert.

---

## Hva som mangler

<!--
Vær ærlig her. Det er det som gjør resten troverdig.
Det som finnes: bytte av et JWT-bevis mot et token, team og workloads, kortlevde tokens.
- Utlån av roller mellom team: hele «låner bort»-delen i datamodellen. Modellen er tegnet, koden er ikke skrevet.
- Roller og tilgang i tokenet: i dag sier tokenet bare hvem. Det skal også si hva, og for hvilken applikasjon.
- Mennesket bak maskinen (RFC 8693 act): et menneske som delegerer til en workload, slik at sporbarheten følger med.
- Flere typer bevis: i dag JWT. SPIFFE og sertifikater krever mer.
- Rammeverk for klienter: skissen på forrige slide. Ingen kode ennå.
Dette er også ønskelista: det vi ikke bygger alene.
-->

- Utlån av roller mellom team
- Roller og tilgang i tokenet, ikke bare hvem
- Mennesket bak maskinen: delegering som følger med
- Flere typer bevis: SPIFFE, sertifikater
- Rammeverk for klienter

---

## Ett problem, to svar

**Hvilken prosess på hvilken maskin er dette?** En konto i Sentral som speiler organisasjonen, et token som utløper, en konvolutt som avgjør. Ingen hemmeligheter å rotere. Et moderne kontrollplan som åpen kildekode kan gjøre Norge mer konkurransedyktig!

**Hvem kjører hva på den?** `sub` er mennesket som har ansvaret, `act` er prosessen som jobber på vegne av det, utstedt av en STS på en grant mennesket selv ga, slik workload identity gjør det hos skyleverandørene. STS-en finnes ikke ferdig i dag, men vi har presentert byggeklossene for en standardbasert løsning.

---

## Ønskelista

Kan vi i det norske åpen kildekode-fellesskapet:

- få modne delegeringsprofiler inn i identitetsplattformene?
- bli enige om en standard identitet for meldinger?
- dele gjenbrukbare byggeklosser for et kontrollplan?

---

<!-- _class: skille -->

## Spørsmål og svar

---

<!-- _class: sporsmal -->

## Tillit til en workload er bare issuer og subject i Salmon. Kan en grant være like enkel, med et menneske som subjekt?

*Kari lar en workload jobbe på vegne av henne.*

<!--
Jan Ivar spør, Linus svarer.
Svaret i én setning: ja, en grant er fire felt, og Salmon lagrer allerede det vanskeligste, workloaden som issuer og subject.
- Eksempelet: «controller i dette clusteret får jobbe på vegne av Kari, i org A, til hun sletter den». Menneske, workload, org og når den er slettet. Kari gir den én gang med sitt eget token.
- I dag er tillit til en workload en credential av typen oidc med issuer og subject. Teamet registrerer den selv, og ingen hemmelighet lages eller roteres.
- Det som mangler: et menneske kan ikke være subject_token, og actor_token leses og kastes. Det er neste steg.
- Målet: workload og grant som ressurser med egen ID i et API Sentral snakker med, som på delegeringsslidet, «HVEM kjører hva».
-->

---

<!-- _class: sporsmal -->

## OpenBao og Keycloak finnes. Hvorfor trenger vi en egen STS?

<!--
Linus spør, Jan Ivar svarer. Linus kan legge til hvorfor Salmon.
Svaret i én setning: OpenBao og Keycloak stoler begge på clusteret, men ingen av dem lar Kari gi en grant én gang som controlleren bruker uten å se tokenet hennes.
- OpenBao 2.7: logger inn poden mot clusterets JWKS, kunne erstattet nøkkelen i Secret i dag. Men ingen token exchange og ingen act, sub er alltid den som kaller. Sentral, RadosGW, Incus og OpenStack ville sett controlleren, ikke Kari.
- Keycloak 26.8: act i preview, men bare med Keycloaks egne tokens, agenten må holde brukerens token, og en administrator bestemmer hvem som får delegeres til. Jobben som går hver natt i et år passer ikke.
- Med 3 000 clustere: én mount eller én IdP per cluster skalerer ikke. Tillit må registreres selvbetjent.
- Får Keycloak varige, selvbetjente grants, kan STS-en bli tynnere. Det er ønskelista.
Reserve: sjekket mot kildekoden oktober 2026. OpenBao: token-endepunktet tar bare authorization_code og client_credentials. Keycloak: TokenExchangeDelegationProvider, feature token-exchange-delegation.
-->

---

<!-- _class: sporsmal -->

## Hvis identitet i Dataverket får flere backends, hvem er brukeren i Sentral?

<!--
Linus spør, Jan Ivar svarer.
Svaret i én setning: Identitet sin egen sub, alltid, uansett hvilken backend Kari logget inn med.
- Callouten stoler på én utsteder, STS-en. Bak den kan Identitet ha både Zitadel og Keycloak.
- sub i Sentral må være stabil. Kommer Kari fra en annen utsteder i morgen, er hun samme sub, fordi Identitet kobler kontoene hennes, ikke hver tjeneste.
- Det er også derfor Kari har samme sub i clusterets auditlogg som i Sentral, via kubelogin mot Identitet.
- Samme grunn som at Salmon utsteder egen sub for workloads, ikke system:serviceaccount:….
- Keycloak som andre backend gir et valg for dem som alt kjører det, og den har act i preview.
-->

---

<!-- _class: sporsmal -->

## Men hva er egentlig Dataverket?

<style scoped>img { display: block; margin: 1.2em auto 0; height: 260px; }</style>

![servere](content/dataverket-servere.svg)

<!--
Linus spør, Jan Ivar svarer kort. Så går ordet til salen.
Svaret i én setning: et åpen kildekode-kontrollplan for suveren skyinfrastruktur, og et initiativ for kunnskapsdeling og diskusjon om teknisk suverenitet.
- Go, AGPL v3. Maskin, Nett, Objekt og Plattform rundt Sentral, flere tjenester planlagt. Mennesker og maskiner logger inn på samme måte.
- Én organisasjon er ett sikkerhetsdomene, ved nøkkel. Målbildet: 3 000 clustere i 300 sikkerhetsdomener.
- Koden skal kunne kjøres og driftes uten oss. Bli med: hallo@dataverket.org
-->

---

![bg right:40% 70%](content/signal-qr.svg)

## Bli med i Dataverket

- Les mer: <https://www.dataverket.org>
- Send oss en melding: <hallo@dataverket.org>
- Koden: <https://git.dataverket.org>
- Signal-gruppa: signal dataverket dot org →

<!--
Står mens salen spør. QR-koden går til Signal-gruppa.
-->
