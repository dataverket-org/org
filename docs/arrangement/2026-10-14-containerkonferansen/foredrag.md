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

## Hvilken maskin er dette, og hvem kjører hva på den?

Innledning, 5 minutter, begge

---

## Hvorfor står vi her

<!--
Jan Ivar: UH-sky og Safespring var hendelsesdrevne kontrollplan med mennesker og maskiner på samme buss. I Dataverket er poder principals fra dag én, og de logger inn i dag med en nøkkel i en Secret.
Linus: identitetsplattformene er laget for mennesker. RFC 8693 er lest, men ikke ferdig implementert noe sted. Derfor salmon.
Vi fant hverandre fordi vi manglet det samme.
-->

- Jan Ivar: UH-sky / NREC, ti år i Safespring med hendelsesdrevne kontrollplan. I 2026: Dataverket, et åpent kontrollplan for suveren skyinfrastruktur
- Linus: salmon, en identitetsleverandør for mennesker og arbeidslaster, skrevet fordi de som finnes er bygget for mennesker
- Vi traff samme vegg fra hver vår side: en maskin som skal handle for et menneske, utenfor clusteret den bor i

---

## I dag: hvilken prosess på hvilken maskin er dette?

<!--
Et projisert ServiceAccount-token, slik det ser ut i dag. Alle i salen har tusenvis av dem.
- Kort levetid, bundet til poden, signert av clusterets egen OIDC-utsteder med discovery og JWKS.
- RBAC sjekker bare verb, ressurs og namespace. Loggen i kube-apiserver vet hvem som gjorde hva.
Første halvdel av spørsmålet er besvart, så langt clusteret rekker. Se etter mennesket i tokenet. Det er ikke der.
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

Prosess, maskin og organisasjon står i tokenet. Kort levetid, bundet til poden, signert av clusterets egen OIDC-utsteder. RBAC sjekker bare verb, ressurs og namespace.

Ingen claim sier hvilket menneske som har ansvaret.

---

## I dag: clusteret er grensen

<style scoped>img { max-height: 330px; }</style>

<!--
Kari gjør kubectl apply. Loggen i kube-apiserver sier kari. Controlleren ser endringen og skal gjøre noe utenfor: et kontrollplan, en sky-API, et annet cluster, en meldingsbuss.
Tilgangen ut av clusteret er i dag en statisk nøkkel i en Secret. Et menneske laget den én gang, og den lever til noen husker å bytte den. Slik er det i Dataverket også.
To tidsskalaer, samme hull. Interaktivt: Kari gjør noe nå, controlleren gjør det for henne. Over tid: en jobb som skriver til en S3-bøtte hos en annen operatør hver natt, med en access key noen laget i fjor. Begge må kunne spores til et menneske.
På den andre siden sier loggen «controller». Kari er borte.
De store skyleverandørene har løst dette for sine egne tjenester: IRSA hos AWS, Workload Identity Federation hos Google og Azure. Samme projiserte token, vekslet inn i en kortlevd nøkkel. Åpne identitetsløsninger er laget for mennesker og mangler tilsvarende. Zitadel veksler bare egne tokens, Keycloak er på vei.
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

Enten Kari gjør det nå eller en jobb gjør det hver natt i et år: tilgangen ut av clusteret er en statisk nøkkel som ble laget én gang. De store skyleverandørene har løst dette for sine egne tjenester. Åpne identitetsløsninger mangler tilsvarende.

---

## Det haster å finne bedre løsninger

<!--
Operatormønsteret er ti år gammelt, og vi har levd med at loggen sier «controller». En agent er noe annet: den velger selv hva den gjør, med nøkler noen ga den én gang.
Når maskinen bare gjør det koden sier, følger handlingen av noe et menneske skrev. Da går det an å finne mennesket i etterkant: ressursen i clusteret, git-historikken, hvem som godkjente. Tungvint, men mulig. Når maskinen velger selv, følger ikke handlingen av koden lenger, og samme agent handler for mange mennesker. Koden peker på den som satte agenten i gang, ikke på den som ba om akkurat denne handlingen. Det står ingen steder, med mindre det ble registrert idet det skjedde. Derfor må mennesket finnes i tokenet og logges når det skjer.
-->

- Operatorer, GitOps-controllere og CI-runnere har gjort jobben for oss i ti år. Vi har godtatt at loggen sier «controller»
- En agent velger selv hva den gjør, med nøkler noen ga den én gang
- Loggen sier *hva* som ble gjort og *hvilken maskin* som gjorde det. Den sier sjelden **hvilket menneske som sto bak**

Når maskinen bare gjør det koden sier, kan vi finne mennesket i etterkant, i koden og i ressursen. Når maskinen velger selv, må mennesket finnes i tokenet og logges når det skjer.

---

## Ett problem, to halvdeler

<!--
Dette er disposisjonen. Første halvdel har Dataverket svar på, og Jan Ivar viser hvordan: organisasjon blir konto, token blir tilkobling, konvolutten avgjør. Andre halvdel er hullet. Jan Ivar viser hvor det er, Linus viser det han har bygget for å fylle det. Til slutt ønskelisten.
-->

**Hvilken prosess på hvilken maskin er dette?**
Server, VM eller pod: hvilken organisasjon hører den til, og hvordan beviser den det uten en nøkkel? Det har vi svar på. Jan Ivar viser hvordan.

**Men HVEM kjører hva på den??!**
Mennesket med ansvar for maskina må følge med i tokenet, ut av clusteret og inn i loggen. Dette har ingen gode svar på i dag. Linus har begynt på relevant kode!

Til slutt: Vår ønskeliste til alle, så hver av oss slipper å bygge dette alene.

---

<!-- _class: skille -->

## Kontrollplanet

Hvilken prosess på hvilken maskin er dette? Jan Ivar, 17 minutter

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
kube-apiserver i Plattform bruker også Identitet, med kubelogin. Kari har samme sub i clusterets auditlogg som i Sentrals. Det er forutsetningen for delegeringsslidet.
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
- Emnet utledes av type og subject. Rettighetene er emnemønstre gitt ved CONNECT, så serveren matcher uten å lese noe annet.
- Avvises meldinga, er det NATS-serveren som avviser den, og ingen tjeneste ser den.
Auditloggen er principalen fra CONNECT pluss konvolutten: hvem, hva og hvilken ressurs. Den finnes før tjenesten har sett meldinga. I dag er «hvem» prosessen.
Når STS-en kommer, er det bare principal-boksen som endres. Neste slide.
Samme mønster som RBAC: den sjekker bare verb, ressurs og namespace, aldri spec.
-->

RBAC sjekker bare verb, ressurs og namespace. Sentral sjekker bare type, ressurs-ID og org.

```mermaid
%%{init: {"handDrawnSeed": 1, "fontFamily": "Helvetica, Arial, sans-serif", "flowchart": {"htmlLabels": true, "padding": 12}}}%%
flowchart LR
  K["konvolutten<br/>type + subject"]
  SUBJ["NATS-emne<br/>a.maskin.server.srv-0042.create"]
  P["principal fra CONNECT<br/>sub=controller"]
  J["pub-rettigheter i bruker-JWT<br/>fra Cedar ved CONNECT<br/>a.maskin.server.*.create"]
  R{"match?"}
  K --> SUBJ --> R
  P --> J --> R
  R -- ja --> OK["levert til alle som lytter"]
  R -- nei --> NO["avvist av NATS-serveren<br/>ingen tjeneste ser den"]
  OK --> LOG["auditlogg: principal + konvolutt<br/>hvem, hva, hvilken ressurs<br/>før tjenesten har sett meldinga"]
```

---

## Løsning: workload-delegering med RFC 8693

<!--
Hvem kjører hva på den: her begynner andre halvdel. Operatormønsteret fra innledningen, en controller handler for Kari, nå uten Secret.
Ingenting i Sentral endres fra forrige slide. STS-en bytter bare ut principalen: sub=kari, act=controller. Match og auditlogg er de samme.
- Workload og grant er ressurser i Identitet med egen ID, opprettet og slettet gjennom Sentral som alle andre ressurser: identitet.workload.create med issuer og sub, identitet.grant.create med menneske, workload og org. Principalen er Kari, verifisert av callouten, så granten er bevist med hennes eget token. Revokering er en delete, med samme logg.
- Granten gis én gang per workload, ikke per apply: controller i dette clusteret får handle for kari, i org A, til hun sletter den. Det er det samme som en federated credential i Azure eller en IAM-binding i Google, og Salmon har det alt som rader. Vi bygger det som workload identity. Forskjellen er at mennesket blir med i tokenet ut, slik AWS SourceIdentity følger en rollekjede.
- Eier. Kari logger inn i clusteret med Identitet og gjør apply. kube-apiserver logger kari, og Plattform merker ressursen med eier=kari fra den verifiserte brukeren, i et felt ingen andre får endre. Eieren beviser ingenting mot STS-en, den velger hvilken grant controlleren bruker for akkurat denne ressursen. Controlleren ser aldri Kari sitt token, og trenger det ikke. I Maskin og Objekt kommer eieren fra hendelsen som opprettet ressursen, principalen i konvolutten, uten noe ekstra.
- Vekslingen: SA-tokenet mot clusterets JWKS, granten i Identitet finnes og er ikke slettet, eieren av ressursen er kari. Cedar sjekker alle tre. Beviset er granten pluss eieren: Kari ga lov med sitt eget token, og kube-apiserver har verifisert at det var hun som opprettet ressursen.
- sub er mennesket. act er prosessen som handler for det. Kjeden kan nestes: controller for pipeline for Kari.
- 15 minutters levetid. aud er mottakeren, ikke utstederen. Poden trenger ingen Secret: TokenRequest gir et kortlevd SA-token med den audiencen vi ber om, og clusterets egen OIDC-utsteder signerer det.
- Samme grant dekker jobben som går hver natt mot en S3-bøtte hos Objekt. Neste slide.
Hver hendelse i Sentral kan spores til en person, også når en maskin sendte den.
STS er planlagt, ikke bygget. RFC 8693 §4.1 act, §4.4 may_act. Kubernetes: structured authentication config, projected ServiceAccount tokens, TokenRequest API, issuer discovery. Eier settes av en mutating webhook i Plattform og låses med ValidatingAdmissionPolicy, slik Rancher gjør med field.cattle.io/creatorId.
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
- Leser workloads og grants fra Identitet, der de er ressurser med egen ID: hvem får handle for hvem, i hvilken org, til granten slettes. may_act som ressurs, slik Salmon alt har tillit til en workload som én rad.
Zitadels token exchange er GA, men bytter bare Zitadels egne tokens. Keycloak og de andre er bygget for mennesker.
Objekt-tilfellet: jobben i clusteret veksler sitt SA-token hos STS-en mot et token med sub=kari og act=jobb, på samme slags grant som på forrige slide, gitt én gang og mulig å trekke tilbake. Objekt-gatewayen tar det tokenet i AssumeRoleWithWebIdentity og gir S3-nøkler som lever i timer, ikke år. Gatewayens egen logg navngir mennesket. Både versitygw og RadosGW gjør dette i dag, mot et token fra en utsteder de stoler på.
Dette må alle som trenger delegert maskinidentitet bygge selv i dag. Linus har begynt. Overgang.
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
Dette er også ønskelisten: det vi ikke bygger alene.
-->

- Utlån av roller mellom team
- Roller og tilgang i tokenet, ikke bare hvem
- Mennesket bak maskinen: delegering som følger med
- Flere typer bevis: SPIFFE, sertifikater
- Rammeverk for klienter

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

<!-- Jan Ivar spør, Linus svarer. Forslag: tillit til en workload er én rad i Salmon, med dashbord. Kan en grant være samme slags rad, menneske, workload, org, slettet når? Og kan radene bli et API Sentral snakker med, slik at workload og grant er ressurser med egen ID? Hva må til for at et menneske kan være subjekt? -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 1

<!-- Linus spør, Jan Ivar svarer. Forslag fra notatet: når Kari kommer inn via kubelogin, hvem er «brukeren» i Sentral, Zitadel-sub eller STS-sub? Og hva om samme menneske kommer fra en annen utsteder i morgen? -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 2

<!-- Linus spør, Jan Ivar svarer. -->

---

<!-- _class: sporsmal -->

## Om Dataverket, 3

<!-- Linus spør, Jan Ivar svarer. -->

---

## Ett problem, to svar

**Hvilken prosess på hvilken maskin er dette?** En konto i Sentral som speiler organisasjonen, et token som utløper, en konvolutt som avgjør. Ingen hemmeligheter å rotere.

**Hvem kjører hva på den?** `sub` er mennesket som har ansvaret, `act` er prosessen som handler for det, utstedt av en STS på en grant mennesket selv ga, slik workload identity gjør det hos skyleverandørene. STS-en finnes ikke ferdig i dag. Linus har begynt å skrive den.

Bli med i Dataverket: <medlem@dataverket.org>

<!-- Publikum tar over herfra, eller vi avslutter. -->
